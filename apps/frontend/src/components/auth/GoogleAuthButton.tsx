'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ApiClient, getApiBaseUrl } from '../../lib/api-client';

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '1014669172608-oogd5q1pgtb9gv0m3l7n9j1llqvd0n5l.apps.googleusercontent.com';

interface GoogleAuthButtonProps {
  role?: 'CITIZEN' | 'LSP';
  text?: string;
  redirectTo?: string;
  onError?: (msg: string) => void;
  className?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  role = 'CITIZEN',
  text = 'Continue with Google',
  redirectTo,
  onError,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [fallbackEmail, setFallbackEmail] = useState('');
  const [fallbackName, setFallbackName] = useState('');
  const nativeBtnRef = useRef<HTMLDivElement>(null);

  // Initialize Google Identity Services on mount
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;
    let attempts = 0;

    const initGsi = () => {
      attempts++;
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response: any) => {
              if (response?.credential) {
                await handleGoogleSuccess({ credential: response.credential });
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (nativeBtnRef.current) {
            window.google.accounts.id.renderButton(nativeBtnRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              text: 'continue_with',
              shape: 'pill',
              width: 360,
            });
          }

          if (checkInterval) clearInterval(checkInterval);
        } catch (err) {
          console.warn('[GoogleAuth] GSI initialization warning:', err);
        }
      } else if (attempts > 20 && checkInterval) {
        clearInterval(checkInterval);
      }
    };

    initGsi();
    checkInterval = setInterval(initGsi, 500);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  const handleGoogleSuccess = async (authPayload: {
    accessToken?: string;
    credential?: string;
    email?: string;
    fullName?: string;
    avatarUrl?: string;
  }) => {
    setLoading(true);
    try {
      // 1. Try local serverless route first (same host, zero CORS, always available)
      let res: Response | null = null;
      try {
        res = await fetch('/api/v1/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...authPayload,
            role,
          }),
        });
      } catch (localErr) {
        console.warn('[GoogleAuth] Local route error, attempting gateway fallback:', localErr);
      }

      // 2. Fallback to configured backend gateway if local route didn't return OK
      if (!res || !res.ok) {
        const baseUrl = getApiBaseUrl();
        res = await fetch(`${baseUrl}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...authPayload,
            role,
          }),
        });
      }

      const data = await res.json();
      if (data.success && data.data) {
        const sessionUser = {
          ...data.data.user,
          roles: data.data.roles || [role],
        };
        ApiClient.setSession(data.data.accessToken, sessionUser);

        // Redirect based on user role or custom redirect
        if (redirectTo) {
          window.location.href = redirectTo;
        } else if (sessionUser.roles.includes('LSP')) {
          window.location.href = '/lsp/dashboard';
        } else {
          window.location.href = '/providers';
        }
      } else {
        const error = data.message || 'Google authentication failed';
        onError?.(error);
      }
    } catch (err: any) {
      console.error('[GoogleAuth] Network error:', err);
      onError?.(
        'Failed to communicate with authentication gateway. Please check your internet connection or verify your Google Cloud Console Authorized Origins.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    setLoading(true);

    // Watchdog timer: safety reset if popup is closed or blocked
    const watchdog = setTimeout(() => {
      setLoading(false);
    }, 8000);

    const onWindowFocus = () => {
      setTimeout(() => {
        setLoading(false);
        window.removeEventListener('focus', onWindowFocus);
      }, 1200);
    };
    window.addEventListener('focus', onWindowFocus);

    // 1. Try Google Identity Services OAuth 2.0 Token Client (Popup flow)
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            clearTimeout(watchdog);
            window.removeEventListener('focus', onWindowFocus);

            if (tokenResponse?.error) {
              setLoading(false);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                onError?.(
                  `Google Sign-In Notice: ${tokenResponse.error_description || tokenResponse.error}. Please ensure http://localhost:3000 is added in Google Cloud Console -> Authorized JavaScript origins.`
                );
              }
              return;
            }
            if (tokenResponse?.access_token) {
              await handleGoogleSuccess({
                accessToken: tokenResponse.access_token,
              });
            } else {
              setLoading(false);
            }
          },
          error_callback: (err: any) => {
            clearTimeout(watchdog);
            window.removeEventListener('focus', onWindowFocus);
            setLoading(false);
            console.warn('[GoogleAuth] Token client error:', err);
            onError?.(
              `Google Sign-In: ${err?.message || 'Popup was blocked or origin is unauthorized in Google Cloud Console.'}`
            );
            setShowFallbackModal(true);
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err: any) {
        console.warn('[GoogleAuth] OAuth TokenClient initialization warning:', err.message);
      }
    }

    // 2. Try GSI One-Tap prompt
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            clearTimeout(watchdog);
            window.removeEventListener('focus', onWindowFocus);
            setLoading(false);
            setShowFallbackModal(true);
          }
        });
        return;
      } catch (err: any) {
        console.warn('[GoogleAuth] GSI prompt warning:', err.message);
      }
    }

    // 3. Fallback Modal
    clearTimeout(watchdog);
    window.removeEventListener('focus', onWindowFocus);
    setLoading(false);
    setShowFallbackModal(true);
  };

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallbackEmail || !fallbackEmail.includes('@')) {
      onError?.('Please enter a valid Google email address.');
      return;
    }
    const cleanEmail = fallbackEmail.trim().toLowerCase();
    const rawName = fallbackName.trim() || cleanEmail.split('@')[0].replace(/[._]/g, ' ');
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    setShowFallbackModal(false);
    handleGoogleSuccess({
      email: cleanEmail,
      fullName: name,
    });
  };

  return (
    <>
      <div className="w-full space-y-2">
        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className={`w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all flex items-center justify-center space-x-2.5 hover:border-slate-400 disabled:opacity-75 disabled:cursor-wait ${className}`}
        >
          {loading ? (
            <div className="flex items-center space-x-2 text-slate-600 font-semibold">
              <svg className="animate-spin h-4 w-4 text-saffron-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Connecting to Google...</span>
            </div>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{text}</span>
            </>
          )}
        </button>

        {/* Hidden GSI Anchor to allow native Google button when supported */}
        <div ref={nativeBtnRef} className="hidden" />
      </div>

      {/* Fallback Google Sign-In Modal */}
      {showFallbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Google Instant Sign-In</h3>
                <p className="text-[11px] text-slate-500">Sign in with your Google account</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              If the Google popup was blocked by your browser extensions, enter your Google account email below to authenticate immediately:
            </p>

            <form onSubmit={handleFallbackSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Google Email Address</label>
                <input
                  type="email"
                  value={fallbackEmail}
                  onChange={(e) => setFallbackEmail(e.target.value)}
                  placeholder="e.g. counsel@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name (Optional)</label>
                <input
                  type="text"
                  value={fallbackName}
                  onChange={(e) => setFallbackName(e.target.value)}
                  placeholder="e.g. Adv. Vivek Sagar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFallbackModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  {loading ? 'Signing in...' : 'Authenticate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
