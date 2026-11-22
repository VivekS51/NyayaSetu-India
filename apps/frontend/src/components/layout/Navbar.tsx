'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useI18n, Language } from '../../lib/i18n';
import { ApiClient, AppNotification } from '../../lib/api-client';
import {
  ShieldCheck,
  Scale,
  Globe,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Award,
  LayoutDashboard,
  CheckCheck,
  FileCheck2,
  AlertTriangle,
  IndianRupee,
  Layers,
  ChevronDown,
  Wallet,
  Phone,
  Mail,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(ApiClient.getStoredUser());
    loadNotifications();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await ApiClient.fetchNotifications();
      setNotifications(res.items);
      setUnreadCount(res.unreadCount);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    await ApiClient.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => {
    ApiClient.clearSession();
    setCurrentUser(null);
    window.location.href = '/';
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'VERIFICATION':
        return <FileCheck2 className="w-4 h-4 text-emerald-400" />;
      case 'ESCROW':
        return <IndianRupee className="w-4 h-4 text-saffron-400" />;
      case 'DISPUTE':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'INCENTIVE':
        return <Award className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-govnavy-900 text-white shadow-md border-b border-govnavy-700">
      {/* Tricolor National Emblem Top Ribbon */}
      <div className="h-1 w-full flex">
        <div className="w-1/3 bg-saffron-500" />
        <div className="w-1/3 bg-white" />
        <div className="w-1/3 bg-govgreen-600" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Brand Logo & Statutory Subtitle */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-saffron-500 to-govnavy-700 flex items-center justify-center shadow-inner">
              <Scale className="w-6 h-6 text-white group-hover:scale-105 transition-transform" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">{t.nav.brand}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  National Portal
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium tracking-wide">{t.nav.tagline}</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-5 text-sm font-medium">
            <Link
              href="/providers"
              className="text-slate-200 hover:text-saffron-500 transition-colors flex items-center space-x-1"
            >
              <ShieldCheck className="w-4 h-4 text-govgreen-600" />
              <span>{t.nav.findProvider}</span>
            </Link>

            <Link
              href="/onboarding"
              className="text-slate-200 hover:text-saffron-500 transition-colors"
            >
              {t.nav.forAdvocates}
            </Link>

            <Link
              href="/rewards"
              className="text-slate-200 hover:text-saffron-500 transition-colors flex items-center space-x-1"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Incentives & Tiers</span>
            </Link>

            <Link
              href="/admin"
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-1.5 border border-slate-700 text-xs font-semibold"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-saffron-400" />
              <span>Admin Desk</span>
            </Link>
          </nav>

          {/* Right Section: Notifications, Language Switcher & Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notifications Bell Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-lg bg-govnavy-800 hover:bg-govnavy-700 text-slate-200 border border-govnavy-700 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-govnavy-900 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-govnavy-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 bg-govnavy-800/80 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-saffron-400" />
                      <span className="text-xs font-bold text-white tracking-wide">
                        Statutory Notifications ({unreadCount} new)
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-govgreen-600" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors hover:bg-govnavy-800/50 ${
                            !n.isRead ? 'bg-saffron-500/5' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-2.5">
                            <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700 mt-0.5">
                              {getNotifIcon(n.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-white tracking-tight">
                                  {n.title}
                                </span>
                                {!n.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-saffron-500" />
                                )}
                              </div>
                              <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">
                                {n.message}
                              </p>
                              <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300 uppercase">
                                  {n.type}
                                </span>
                                <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 bg-govnavy-800/50 border-t border-slate-800 text-center">
                    <Link
                      href="/admin"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-[11px] font-semibold text-saffron-400 hover:underline"
                    >
                      View Administrative Control Desk &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="flex items-center bg-govnavy-800 rounded-lg p-1 border border-govnavy-700 text-xs font-semibold">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1.5" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded transition-colors ${
                  language === 'en' ? 'bg-saffron-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded transition-colors ${
                  language === 'hi' ? 'bg-saffron-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('pa')}
                className={`px-2 py-1 rounded transition-colors ${
                  language === 'pa' ? 'bg-saffron-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                ਪੰਜਾਬੀ
              </button>
            </div>

            {/* Auth / My Account Section */}
            {currentUser ? (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-govnavy-800 hover:bg-govnavy-700 border border-govnavy-700 text-xs font-semibold text-white shadow-sm transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-saffron-600 to-amber-500 text-white flex items-center justify-center font-black text-[10px] shadow-inner">
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-bold">My Account</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* My Account Dropdown Details Panel */}
                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-govnavy-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
                    {/* User Header */}
                    <div className="p-4 bg-gradient-to-br from-govnavy-800 to-slate-900 border-b border-slate-700">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-saffron-500 to-govnavy-900 flex items-center justify-center text-white text-lg font-bold border border-saffron-400 shadow-md">
                            {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white leading-tight">
                              {currentUser.fullName || 'Citizen User'}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {currentUser.phone || currentUser.email || 'Statutory Account'}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          {currentUser.status || 'ACTIVE'}
                        </span>
                      </div>

                      {/* Roles Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(currentUser.roles || ['CITIZEN']).map((role: string) => (
                          <span
                            key={role}
                            className="px-2 py-0.5 rounded bg-govnavy-950/80 text-saffron-300 border border-saffron-500/30 text-[10px] font-bold uppercase tracking-wider"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Account Stats Preview */}
                    <div className="p-3 bg-govnavy-800/40 border-b border-slate-800 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-govnavy-800/80 border border-slate-700/60">
                        <span className="text-[10px] text-slate-400 block">Escrow Balance</span>
                        <span className="font-bold text-white text-xs">
                          ₹{currentUser.wallet?.monetaryBalanceINR !== undefined ? Number(currentUser.wallet.monetaryBalanceINR).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-govnavy-800/80 border border-slate-700/60">
                        <span className="text-[10px] text-slate-400 block">Reward Points</span>
                        <span className="font-bold text-amber-400 text-xs">
                          {currentUser.wallet?.rewardPointsBalance !== undefined ? currentUser.wallet.rewardPointsBalance : 25} Pts
                        </span>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="p-2 divide-y divide-slate-800 text-xs">
                      <div className="py-1">
                        <Link
                          href="/account"
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-govnavy-800 transition-colors"
                        >
                          <User className="w-4 h-4 text-saffron-400" />
                          <div>
                            <div className="font-semibold">My Account Profile</div>
                            <span className="text-[10px] text-slate-400 block">View full account credentials & UID</span>
                          </div>
                        </Link>

                        <Link
                          href={currentUser.roles?.includes('LSP') ? '/lsp/dashboard' : '/citizen/dashboard'}
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-govnavy-800 transition-colors"
                        >
                          <Layers className="w-4 h-4 text-govgreen-600" />
                          <div>
                            <div className="font-semibold">{currentUser.roles?.includes('LSP') ? 'Advocate Dashboard' : 'Citizen Case Desk'}</div>
                            <span className="text-[10px] text-slate-400 block">Consultations, slots & active matters</span>
                          </div>
                        </Link>
                      </div>

                      <div className="pt-1.5 pb-0.5">
                        <button
                          onClick={() => {
                            setAccountDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span className="font-semibold">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-govnavy-800 border border-govnavy-700 transition-colors"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/onboarding"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-saffron-600 hover:bg-saffron-700 shadow transition-colors flex items-center space-x-1.5"
                >
                  <span>{t.nav.register}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-govnavy-800 text-slate-300 hover:text-white border border-govnavy-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-govnavy-900 border-t border-govnavy-700 px-4 py-4 space-y-3">
          {currentUser ? (
            <div className="p-3 bg-govnavy-800 rounded-xl border border-govnavy-700 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-saffron-500 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{currentUser.fullName}</div>
                    <div className="text-[10px] text-slate-400">{currentUser.phone || currentUser.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex space-x-2 pt-1">
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1.5 bg-saffron-600 hover:bg-saffron-700 text-white text-center rounded-lg text-xs font-bold"
                >
                  My Account
                </Link>
                <Link
                  href={currentUser.roles?.includes('LSP') ? '/lsp/dashboard' : '/citizen/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-1.5 bg-govnavy-700 text-slate-200 text-center rounded-lg text-xs font-bold"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pb-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 bg-govnavy-800 border border-govnavy-700 rounded-lg text-center text-xs font-bold text-slate-200"
              >
                Sign In
              </Link>
              <Link
                href="/onboarding"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 bg-saffron-600 text-white rounded-lg text-center text-xs font-bold"
              >
                Join Platform
              </Link>
            </div>
          )}

          <Link
            href="/providers"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-200 py-1"
          >
            {t.nav.findProvider}
          </Link>
          <Link
            href="/onboarding"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-200 py-1"
          >
            {t.nav.forAdvocates}
          </Link>
          <Link
            href="/rewards"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-200 py-1"
          >
            Incentives & Tier Catalog
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-saffron-400 py-1"
          >
            Admin Verification & Dispute Panel
          </Link>
          <div className="pt-2 border-t border-govnavy-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">Language:</span>
            <div className="flex space-x-1">
              {(['en', 'hi', 'pa'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 text-xs rounded font-semibold ${
                    language === lang ? 'bg-saffron-600 text-white' : 'bg-govnavy-800 text-slate-300'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
