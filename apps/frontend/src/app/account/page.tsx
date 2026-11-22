'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient, getApiBaseUrl } from '../../lib/api-client';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Wallet,
  Calendar,
  LogOut,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  FileText,
  Scale,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [wallet, setWallet] = useState<any | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    const token = ApiClient.getToken();
    const stored = ApiClient.getStoredUser();

    if (!token && !stored) {
      router.push('/auth/login');
      return;
    }

    if (stored) {
      setUser(stored);
      setRoles(stored.roles || ['CITIZEN']);
      if (stored.wallet) setWallet(stored.wallet);
    }

    if (token) {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data.user);
          setRoles(json.data.roles || ['CITIZEN']);
          if (json.data.wallet) setWallet(json.data.wallet);
          ApiClient.setSession(token, { ...json.data.user, roles: json.data.roles, wallet: json.data.wallet });
        }
      } catch (err) {
        console.warn('Could not sync live account data:', err);
      }
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAccount();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleLogout = () => {
    ApiClient.clearSession();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-saffron-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">No Account Session Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Please sign in to access your verified profile, wallet, and legal services.
          </p>
          <Link
            href="/auth/login"
            className="w-full py-2.5 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold shadow block transition-colors"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  const isLsp = roles.includes('LSP');
  const isAdmin = roles.includes('ADMIN');

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-govnavy-900 to-slate-800 flex items-center justify-center text-white text-2xl font-black shadow-md border-2 border-saffron-500">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-bold text-govnavy-900 tracking-tight">
                  {user.fullName || 'Citizen User'}
                </h1>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{user.status || 'ACTIVE'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                UID: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700 text-[10px]">{user.id}</code>
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {roles.map((r) => (
                  <span
                    key={r}
                    className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-govnavy-100 text-govnavy-900 border border-govnavy-200"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-stretch md:self-auto justify-end">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Refresh Account Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-saffron-600' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Account Details & Wallet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity & Contact Info */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <h2 className="text-sm font-bold text-govnavy-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-saffron-600" />
              <span>Account & Identity Credentials</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block mb-0.5">Primary Mobile Number</span>
                <div className="flex items-center space-x-1.5 font-semibold text-xs text-slate-800">
                  <Phone className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                  <span>{user.phone || 'Not provided'}</span>
                  {user.isPhoneVerified && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 rounded border border-emerald-200">
                      Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block mb-0.5">Registered Email</span>
                <div className="flex items-center space-x-1.5 font-semibold text-xs text-slate-800 truncate">
                  <Mail className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                  <span className="truncate">{user.email || 'None attached (OTP sign-in)'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block mb-0.5">Preferred Portal Language</span>
                <div className="font-semibold text-xs text-slate-800 uppercase">
                  {user.preferredLanguage === 'hi' ? 'Hindi (हिंदी)' : user.preferredLanguage === 'pa' ? 'Punjabi (ਪੰਜਾਬੀ)' : 'English (EN)'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block mb-0.5">Statutory Compliance</span>
                <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>DPDP Act 2023 Consent Active</span>
                </div>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-3">Portal Services</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href={isLsp ? '/lsp/dashboard' : '/citizen/dashboard'}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-govnavy-900 text-white flex items-center justify-center">
                      <Layers className="w-4 h-4 text-saffron-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-saffron-600 transition-colors">
                        {isLsp ? 'LSP Advocate Desk' : 'Citizen Case Desk'}
                      </div>
                      <span className="text-[10px] text-slate-500">Track consultations & bookings</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/providers"
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                      <Scale className="w-4 h-4 text-emerald-100" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                        Find Legal Counsel
                      </div>
                      <span className="text-[10px] text-slate-500">Verified Advocates & Notaries</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Wallet & Rewards Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-govnavy-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Wallet className="w-4 h-4 text-govgreen-600" />
                <span>Statutory Wallet</span>
              </h2>

              <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-govnavy-900 to-slate-800 text-white space-y-3">
                <div>
                  <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Escrow / Monetary Balance</span>
                  <div className="text-2xl font-black text-white mt-0.5">
                    ₹{wallet?.monetaryBalanceINR !== undefined ? Number(wallet.monetaryBalanceINR).toFixed(2) : '0.00'}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-saffron-300 font-semibold block">GovTech Reward Points</span>
                    <span className="text-base font-bold text-amber-400">
                      {wallet?.rewardPointsBalance !== undefined ? wallet.rewardPointsBalance : 25} Pts
                    </span>
                  </div>
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500">Tier Status</span>
                  <span className="font-bold text-govnavy-900">BRONZE CITIZEN</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500">Statutory Fee</span>
                  <span className="font-bold text-emerald-700">0% Commission (Rule 36)</span>
                </div>
              </div>
            </div>

            <Link
              href="/rewards"
              className="w-full py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-900 transition-colors block"
            >
              View Rewards & Tiers Catalog &rarr;
            </Link>
          </div>
        </div>

        {/* Statutory Disclaimers */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed text-center">
          <p>
            NyayaSetu India operates strictly under Bar Council of India (BCI) Rule 36 and Section 35 of the Advocates Act, 1961. Professional fees are paid directly to verified practitioners with 0% platform commission. All consent data is logged in compliance with the Digital Personal Data Protection (DPDP) Act, 2023.
          </p>
        </div>
      </div>
    </div>
  );
}
