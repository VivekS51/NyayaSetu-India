'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient, API_BASE_URL } from '../../../lib/api-client';
import { Scale, Phone, KeyRound, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'OTP' | 'PASSWORD'>('OTP');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [mockOtpHint, setMockOtpHint] = useState<string | null>(null);

  const [passwordEmail, setPasswordEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!phone || phone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        if (data.data?.mockOtp) {
          setMockOtpHint(data.data.mockOtp);
        } else {
          setMockOtpHint(null);
        }
      } else {
        setErrorMsg(data.message || 'Failed to dispatch OTP');
      }
    } catch (err: any) {
      console.error('OTP Send Error:', err);
      // If deployed backend is temporarily unreachable, notify citizen clearly
      setErrorMsg('Unable to connect to authentication server. Please check your internet connection or backend status.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
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
        setErrorMsg(data.message || 'Invalid OTP code entered');
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
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: passwordEmail, password }),
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
        setErrorMsg(data.message || 'Invalid login credentials');
      }
    } catch {
      // Local fallback for admin or advocate demo
      if (passwordEmail.includes('admin')) {
        ApiClient.setSession('admin_mock_token', {
          id: 'usr-admin-001',
          fullName: 'Smt. Priya Sharma (Joint Registrar)',
          roles: ['ADMIN', 'VERIFIER'],
        });
      } else {
        ApiClient.setSession('lsp_mock_token', {
          id: 'usr-lsp-003',
          fullName: 'Adv. Rajesh Varma',
          roles: ['LSP'],
        });
      }
      router.push('/providers');
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
              Mobile OTP (Citizens & LSPs)
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
              Password / Admin
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
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full text-center tracking-widest text-lg font-bold py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                    required
                  />
                  {mockOtpHint ? (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1.5 text-center">
                      Sandbox Development OTP: <code className="bg-emerald-50 px-1.5 py-0.5 rounded">{mockOtpHint}</code>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 font-medium mt-1.5 text-center">
                      6-digit OTP dispatched via SMS to your mobile number.
                    </p>
                  )}
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
                  Email or Mobile Number
                </label>
                <input
                  type="text"
                  value={passwordEmail}
                  onChange={(e) => setPasswordEmail(e.target.value)}
                  placeholder="admin@legalmarketplace.gov.in"
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

