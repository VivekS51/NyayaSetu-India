'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient, getApiBaseUrl } from '../../../lib/api-client';
import { Scale, Phone, KeyRound, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'OTP' | 'PASSWORD'>('OTP');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [passwordEmail, setPasswordEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        startCooldown();
      } else {
        setErrorMsg(data.message || 'Unable to dispatch verification SMS. Please try again.');
      }
    } catch (err: any) {
      console.error('OTP Send Error:', err);
      setErrorMsg('Could not connect to authentication gateway. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!otp || otp.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code received on your phone.');
      return;
    }

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: otp.trim() }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        ApiClient.setSession(data.data.accessToken, data.data.user);
        const roles = data.data.roles || [];
        if (roles.includes('LSP')) {
          router.push('/onboarding');
        } else {
          router.push('/providers');
        }
      } else {
        setErrorMsg(data.message || 'Invalid or expired OTP code entered. Please verify or request a new code.');
      }
    } catch (err: any) {
      console.error('OTP Verify Error:', err);
      setErrorMsg('Verification failed. Unable to communicate with authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: passwordEmail.trim(), password }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        ApiClient.setSession(data.data.accessToken, data.data.user);
        const roles = data.data.roles || [];
        if (roles.includes('ADMIN')) {
          router.push('/providers');
        } else if (roles.includes('LSP')) {
          router.push('/onboarding');
        } else {
          router.push('/providers');
        }
      } else {
        setErrorMsg(data.message || 'Invalid login credentials. Please check your identifier and password.');
      }
    } catch {
      setErrorMsg('Connection error. Unable to verify credentials with authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const emailInput = window.prompt('Enter your Google Account email for instant sign-in:', 'citizen@gmail.com');
      if (!emailInput || !emailInput.includes('@')) {
        setLoading(false);
        return;
      }
      const rawName = emailInput.split('@')[0].replace(/[._]/g, ' ');
      const fullName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim().toLowerCase(),
          fullName,
          role: 'CITIZEN',
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        ApiClient.setSession(data.data.accessToken, data.data.user);
        router.push('/providers');
      } else {
        setErrorMsg(data.message || 'Google authentication failed');
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMsg('Unable to connect to Google authentication service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-govnavy-900 flex items-center justify-center text-white">
            <Scale className="w-6 h-6 text-saffron-500" />
          </div>
          <span className="text-2xl font-bold text-govnavy-900 tracking-tight">NyayaSetu India</span>
        </Link>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-800">
          Sign In to Legal Marketplace
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Access verified legal services or manage your professional practice
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl border border-slate-200">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => {
                setAuthMode('OTP');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition-colors ${
                authMode === 'OTP'
                  ? 'border-saffron-600 text-saffron-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Mobile OTP Login
            </button>
            <button
              onClick={() => {
                setAuthMode('PASSWORD');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition-colors ${
                authMode === 'PASSWORD'
                  ? 'border-saffron-600 text-saffron-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Password Login
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authMode === 'OTP' ? (
            !otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number (Indian +91)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      maxLength={10}
                      className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    We will send a 6-digit statutory verification OTP via SMS.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Phone className="w-4 h-4" />
                  <span>{loading ? 'Dispatching OTP...' : 'Send Verification OTP'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">Enter 6-Digit OTP</label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-saffron-600 font-semibold"
                    >
                      Change Phone
                    </button>
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                    className="w-full text-center tracking-widest text-2xl font-bold py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                    required
                  />
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2 text-center text-xs text-slate-600">
                    <p>Enter the 6-digit verification code sent to <strong className="text-slate-900">+91 {phone}</strong>.</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('PASSWORD');
                        setPasswordEmail(phone);
                      }}
                      className="text-slate-600 font-semibold hover:text-saffron-600 underline"
                    >
                      Sign in with password instead
                    </button>
                    {resendCooldown > 0 ? (
                      <span className="text-slate-400 font-medium">Resend in {resendCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-saffron-600 font-bold hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-govgreen-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center justify-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'Verifying...' : 'Verify OTP & Enter'}</span>
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number or Email
                </label>
                <input
                  type="text"
                  value={passwordEmail}
                  onChange={(e) => setPasswordEmail(e.target.value)}
                  placeholder="e.g. 9876543210 or counsel@bar.org.in"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-govnavy-800 hover:bg-govnavy-900 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center justify-center space-x-1.5"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all flex items-center justify-center space-x-2.5 hover:border-slate-400"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Don&apos;t have an account yet?{' '}
            <Link href="/auth/register" className="text-saffron-600 font-bold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

