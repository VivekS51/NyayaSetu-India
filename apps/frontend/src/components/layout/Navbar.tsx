'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Users2,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { createTopDockController } from '../../shaders/animated-top-dock/topDockController';
import "../../shaders/threeui.css";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { t, language, setLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = dockRef.current;
    if (!root) return;
    return createTopDockController(root, () => ({
      proximity: 122,
      spring: 0.19,
      damping: 0.70,
      widthGrowth: 17,
      heightGrowth: 16,
      drop: 3.5,
    }));
  }, []);

  const syncAuth = useCallback(() => {
    const stored = ApiClient.getStoredUser();
    setCurrentUser(stored);
  }, []);

  useEffect(() => {
    syncAuth();
    loadNotifications();

    const handleAuthEvent = () => {
      syncAuth();
      loadNotifications();
    };

    window.addEventListener('nyayasetu_auth_change', handleAuthEvent);
    window.addEventListener('storage', handleAuthEvent);

    // Heartbeat check every 1s to ensure instantaneous reactive sync across client transitions
    const timer = setInterval(() => {
      syncAuth();
    }, 1000);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('nyayasetu_auth_change', handleAuthEvent);
      window.removeEventListener('storage', handleAuthEvent);
      clearInterval(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [syncAuth]);

  // Re-sync on route navigation
  useEffect(() => {
    syncAuth();
  }, [pathname, syncAuth]);

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
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full px-2 sm:px-4 lg:px-6 pt-2.5 pb-2 pointer-events-none transition-all">
      <div className="max-w-[1400px] mx-auto pointer-events-auto">
        <div
          ref={dockRef}
          className="portal-navbar-capsule"
          aria-label="Portal Navigation"
          data-dock-state="idle"
          data-dock-max="0.00"
        >
          {/* Subtle Indian Tricolor Hairline Indicator */}
          <div className="absolute top-0 left-8 right-8 h-[2px] rounded-full overflow-hidden flex opacity-85 pointer-events-none">
            <div className="w-1/3 bg-saffron-500" />
            <div className="w-1/3 bg-white" />
            <div className="w-1/3 bg-govgreen-600" />
          </div>

          {/* Left: Brand Identity with ThreeUI Dock animation */}
          <Link
            href="/"
            className="animated-top-dock__item flex items-center space-x-2.5 px-3 py-1 group flex-shrink-0"
            data-dock-item
            aria-label="NyayaSetu India Home"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-saffron-500 to-amber-600 flex items-center justify-center shadow-md">
              <Scale className="w-3.5 h-3.5 text-white group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white font-sans">{t.nav.brand}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold hidden xl:inline-block font-sans">
                National Portal
              </span>
            </div>
          </Link>

          {/* Center: ThreeUI Animated Top Dock Navigation Track */}
          <nav
            className="hidden lg:inline-flex portal-dock-track"
            aria-label="Primary Navigation"
          >
            {/* Light / Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`animated-top-dock__item animated-top-dock__logo transition-all ring-2 ${
                theme === 'dark'
                  ? 'ring-amber-500/60 hover:ring-amber-400 bg-amber-500/10'
                  : 'ring-saffron-500/70 hover:ring-saffron-500 bg-saffron-500/10'
              }`}
              data-dock-item
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform group-hover:rotate-45" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-amber-600 transition-transform group-hover:-rotate-12" />
              )}
            </button>

            <Link
              href="/providers"
              className={`animated-top-dock__item animated-top-dock__link ${pathname.startsWith('/providers') ? 'is-active ring-1 ring-saffron-500' : ''}`}
              data-dock-item
            >
              <span className="animated-top-dock__icon" aria-hidden="true">
                <ShieldCheck className="w-3.5 h-3.5 text-govgreen-500" />
              </span>
              <span>FIND PROVIDER</span>
            </Link>

            <Link
              href="/onboarding"
              className={`animated-top-dock__item animated-top-dock__link ${pathname === '/onboarding' ? 'is-active ring-1 ring-saffron-500' : ''}`}
              data-dock-item
            >
              <span className="animated-top-dock__icon" aria-hidden="true">
                <Users2 className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <span>FOR ADVOCATES</span>
            </Link>

            <Link
              href="/rewards"
              className={`animated-top-dock__item animated-top-dock__link ${pathname === '/rewards' ? 'is-active ring-1 ring-saffron-500' : ''}`}
              data-dock-item
            >
              <span className="animated-top-dock__icon" aria-hidden="true">
                <Award className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <span>INCENTIVES & TIERS</span>
            </Link>

            <Link
              href="/admin"
              className={`animated-top-dock__item animated-top-dock__link ${pathname === '/admin' ? 'is-active ring-1 ring-saffron-500' : ''}`}
              data-dock-item
            >
              <span className="animated-top-dock__icon" aria-hidden="true">
                <LayoutDashboard className="w-3.5 h-3.5 text-saffron-400" />
              </span>
              <span>ADMIN DESK</span>
            </Link>
          </nav>

          {/* Right Section: Notifications, Language Switcher & Auth */}
          <div className="hidden md:flex items-center space-x-2 pr-1 flex-shrink-0">
            {/* Notifications Bell Dropdown with ThreeUI animation */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="animated-top-dock__item relative !h-8 !px-2.5"
                data-dock-item
                title="Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-slate-900 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden text-left backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-saffron-400" />
                      <span className="text-xs font-bold text-white tracking-wide">
                        Statutory Notifications ({unreadCount} new)
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-slate-300 hover:text-white flex items-center space-x-1 transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-govgreen-500" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors hover:bg-white/5 ${
                            !n.isRead ? 'bg-saffron-500/10' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-2.5">
                            <div className="p-1.5 rounded-md bg-white/5 border border-white/10 mt-0.5">
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
                                <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-slate-300 uppercase">
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

                  <div className="p-2 bg-white/5 border-t border-white/10 text-center">
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

            {/* Language Selector with ThreeUI animation */}
            <div className="flex items-center bg-slate-100/90 dark:bg-white/5 rounded-full p-0.5 border border-slate-300 dark:border-white/10 backdrop-blur-md">
              <span className="pl-1.5 pr-0.5 text-slate-400 flex items-center">
                <Globe className="w-3 h-3" />
              </span>
              <button
                onClick={() => setLanguage('en')}
                className={`animated-top-dock__item !h-7 !px-2 !text-[10px] ${
                  language === 'en' ? 'is-active' : ''
                }`}
                data-dock-item
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`animated-top-dock__item !h-7 !px-2 !text-[10px] ${
                  language === 'hi' ? 'is-active' : ''
                }`}
                data-dock-item
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('pa')}
                className={`animated-top-dock__item !h-7 !px-2 !text-[10px] ${
                  language === 'pa' ? 'is-active' : ''
                }`}
                data-dock-item
              >
                ਪੰਜਾਬੀ
              </button>
            </div>

            {/* Auth / My Account Section with ThreeUI animation */}
            {currentUser ? (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="animated-top-dock__item flex items-center space-x-1.5 !px-3"
                  data-dock-item
                >
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-saffron-600 to-amber-500 text-white flex items-center justify-center font-black text-[9px] shadow-inner">
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-bold text-xs">My Account</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* My Account Dropdown Details Panel */}
                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden text-left backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                    {/* User Header */}
                    <div className="p-4 bg-white/5 border-b border-white/10">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-saffron-500 to-amber-700 flex items-center justify-center text-white text-lg font-bold border border-saffron-400 shadow-md">
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
                            className="px-2 py-0.5 rounded bg-white/5 text-saffron-300 border border-saffron-500/30 text-[10px] font-bold uppercase tracking-wider"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Account Stats Preview */}
                    <div className="p-3 bg-white/[0.02] border-b border-white/10 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[10px] text-slate-400 block">Escrow Balance</span>
                        <span className="font-bold text-white text-xs">
                          ₹{currentUser.wallet?.monetaryBalanceINR !== undefined ? Number(currentUser.wallet.monetaryBalanceINR).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[10px] text-slate-400 block">Reward Points</span>
                        <span className="font-bold text-amber-400 text-xs">
                          {currentUser.wallet?.rewardPointsBalance !== undefined ? currentUser.wallet.rewardPointsBalance : 50} Pts
                        </span>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="p-2 divide-y divide-white/10 text-xs">
                      <div className="py-1">
                        <Link
                          href="/account"
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
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
                          className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Layers className="w-4 h-4 text-govgreen-500" />
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
              <div className="flex items-center space-x-1.5">
                <Link
                  href="/auth/login"
                  className="animated-top-dock__item !h-8 !px-3 !text-xs font-semibold"
                  data-dock-item
                >
                  Sign In
                </Link>
                <Link
                  href="/onboarding"
                  className="animated-top-dock__item is-active !h-8 !px-3.5 !text-xs font-bold"
                  data-dock-item
                >
                  <span>Join Platform</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button with ThreeUI animation */}
          <div className="lg:hidden flex items-center space-x-2 pr-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="animated-top-dock__item !h-8 !px-2.5"
              data-dock-item
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 px-4 py-4 space-y-3 backdrop-blur-2xl animate-in slide-in-from-top-2 text-slate-800 dark:text-slate-200 shadow-2xl rounded-b-2xl">
          {/* Mobile Theme Switcher Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-colors"
          >
            <div className="flex items-center space-x-2">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-amber-600" />
              )}
              <span>Color Mode</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300">
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </button>

          {currentUser ? (
            <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-300 dark:border-white/10 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-saffron-500 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.fullName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{currentUser.phone || currentUser.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-xs"
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
                  className="flex-1 py-1.5 bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white text-center rounded-lg text-xs font-bold"
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
                className="py-2 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-center text-xs font-bold text-slate-800 dark:text-white"
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
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1"
          >
            {t.nav.findProvider}
          </Link>
          <Link
            href="/onboarding"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1"
          >
            {t.nav.forAdvocates}
          </Link>
          <Link
            href="/rewards"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1"
          >
            Incentives & Tier Catalog
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-saffron-600 dark:text-saffron-400 py-1"
          >
            Admin Verification & Dispute Panel
          </Link>
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">Language:</span>
            <div className="flex space-x-1">
              {(['en', 'hi', 'pa'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 text-xs rounded font-semibold ${
                    language === lang ? 'bg-saffron-600 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
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
