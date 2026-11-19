'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClient, getApiBaseUrl } from '../../../lib/api-client';
import { Scale, ShieldCheck, UserCheck, Briefcase, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'LSP' ? 'LSP' : 'CITIZEN';

  const [role, setRole] = useState<'CITIZEN' | 'LSP'>(initialRole);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'hi' | 'pa'>('en');
  const [dpdpConsent, setDpdpConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!dpdpConsent) {
      setErrorMsg('DPDP Act 2023 Statutory Consent is required to process legal account registration.');
      return;
    }

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const cleanEmail = email.trim() ? email.trim().toLowerCase() : undefined;

      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: cleanPhone,
          email: cleanEmail,
          password,
          role,
          preferredLanguage,
          dpdpConsentAcknowledged: true,
        }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        ApiClient.setSession(data.data.accessToken, data.data.user);
        if (role === 'LSP') {
          router.push('/onboarding');
        } else {
          router.push('/providers');
        }
      } else {
        const errorDetail = data.errors?.[0]?.message || data.message || 'Registration failed';
        setErrorMsg(errorDetail);
      }
    } catch (err: any) {
      console.error('Registration network error:', err);
      setErrorMsg('Unable to connect to registration server. Please check your internet connection and try again.');
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
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim().toLowerCase(),
          fullName: formattedName,
          role,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        ApiClient.setSession(data.data.accessToken, data.data.user);
        if (role === 'LSP') {
          router.push('/onboarding');
        } else {
          router.push('/providers');
        }
      } else {
        setErrorMsg(data.message || 'Google registration failed');
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMsg('Unable to connect to Google authentication service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setRole('CITIZEN')}
          className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition-all ${
            role === 'CITIZEN'
              ? 'border-saffron-500 bg-saffron-50/50 text-govnavy-900 ring-2 ring-saffron-500/20'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
          }`}
        >
          <UserCheck className={`w-5 h-5 shrink-0 mt-0.5 ${role === 'CITIZEN' ? 'text-saffron-600' : 'text-slate-400'}`} />
          <div>
            <div className="text-xs font-bold">Citizen / Client</div>
            <div className="text-[10px] text-slate-500 leading-tight">Seek legal assistance</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setRole('LSP')}
          className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition-all ${
            role === 'LSP'
              ? 'border-govnavy-700 bg-govnavy-50 text-govnavy-900 ring-2 ring-govnavy-700/20'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
          }`}
        >
          <Briefcase className={`w-5 h-5 shrink-0 mt-0.5 ${role === 'LSP' ? 'text-govnavy-800' : 'text-slate-400'}`} />
          <div>
            <div className="text-xs font-bold">Legal Provider</div>
            <div className="text-[10px] text-slate-500 leading-tight">Advocate / Notary</div>
          </div>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{errorMsg}</span>
            {errorMsg.toLowerCase().includes('already exists') && (
              <div className="mt-1">
                <Link href="/auth/login" className="font-bold underline text-rose-800">
                  Click here to Sign In with your password →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {role === 'LSP' ? 'Full Legal Name (as per Bar Council)' : 'Full Name'}
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={role === 'LSP' ? 'Adv. Harpreet Singh' : 'Sunita Devi'}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number (+91)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="counsel@delhibar.org.in"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Create Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="e.g. NyayaSetu@2026"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
            required
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Min. 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special symbol (@, #, $, !).
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred UI Language</label>
          <select
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
          </select>
        </div>

        {/* DPDP Act 2023 Explicit Digital Consent */}
        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={dpdpConsent}
              onChange={(e) => setDpdpConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-saffron-600 focus:ring-saffron-500"
            />
            <span className="text-[11px] text-slate-600 leading-tight">
              I give explicit consent under <strong className="text-slate-800">DPDP Act 2023</strong> for NyayaSetu to
              process and store my identity data in Indian sovereign infrastructure for legal service facilitation.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center justify-center space-x-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{loading ? 'Creating Account...' : 'Agree & Create Account'}</span>
        </button>
      </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400 font-medium">Or register with</span>
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
        Already registered?{' '}
        <Link href="/auth/login" className="text-saffron-600 font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-govnavy-900 flex items-center justify-center text-white">
              <Scale className="w-6 h-6 text-saffron-500" />
            </div>
            <span className="text-2xl font-bold text-govnavy-900 tracking-tight">NyayaSetu India</span>
          </Link>
          <h2 className="mt-3 text-xl font-bold text-slate-900">Create Verified Platform Account</h2>
          <p className="text-xs text-slate-500">Ministry of Law & Justice • Digital India Initiative</p>
        </div>

        <Suspense fallback={<div className="text-center py-10 text-xs text-slate-500">Loading form...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
