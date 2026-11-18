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
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(ApiClient.getStoredUser());
    loadNotifications();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
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

            {/* Auth Buttons */}
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <Link
                  href={currentUser.roles?.includes('LSP') ? '/lsp/dashboard' : '/citizen/dashboard'}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-govnavy-800 hover:bg-govnavy-700 border border-govnavy-700 text-xs font-semibold text-slate-200"
                >
                  <User className="w-3.5 h-3.5 text-saffron-400" />
                  <span>{currentUser.fullName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-govnavy-800 hover:bg-govnavy-700 text-slate-300 hover:text-rose-400 border border-govnavy-700 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
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
