'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useI18n } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import {
  Search,
  ShieldCheck,
  Scale,
  Award,
  Lock,
  BookOpen,
  ArrowRight,
  Landmark,
  FileCheck2,
  Users2,
  ChevronRight,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { ConstellationField } from '../components/effects/constellation-field/ConstellationField';

export default function HomePage() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('query', searchQuery.trim());
    if (selectedService !== 'ALL') params.append('providerType', selectedService);
    if (selectedState !== 'ALL') params.append('state', selectedState);
    router.push(`/providers?${params.toString()}`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'light' ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#060503] text-white'}`}>
      {/* Hero Section - Compact Viewport Layout matching reference */}
      <section className={`relative pt-14 sm:pt-16 pb-3 sm:pb-4 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[calc(100vh-65px)] lg:h-[calc(100vh-65px)] flex flex-col justify-between border-b transition-colors duration-300 ${
        theme === 'light' ? 'border-slate-200/90 text-slate-900' : 'border-slate-800/80 text-white'
      }`}>
        {/* Theme Background Image: Light Mode (light.png) and Dark Mode (dark.png) */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
          <Image
            src={theme === 'light' ? '/images/hero-light.png' : '/images/hero-dark.png'}
            alt="NyayaSetu India National Legal Services Portal"
            fill
            priority
            sizes="100vw"
            className="object-cover object-right md:object-center transition-all duration-500"
          />
          {/* Subtle lateral gradient mask for sharp, high-contrast text readability */}
          <div
            className={`absolute inset-0 pointer-events-none transition-colors duration-300 ${
              theme === 'light'
                ? 'bg-gradient-to-r from-white/95 via-white/75 to-transparent lg:from-white/90 lg:via-white/35 lg:to-transparent'
                : 'bg-gradient-to-r from-[#060503]/90 via-[#060503]/50 to-transparent lg:from-[#060503]/85 lg:via-[#060503]/25 lg:to-transparent'
            }`}
          />
        </div>

        {/* Dynamic Constellation Field Animation (Preserved across both Light & Dark modes) */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <ConstellationField
            variant="constellation-field"
            speed={0.8}
            density={1.1}
            length={1.1}
            strokeWidth={1}
            size={1}
            opacity={theme === 'light' ? 0.70 : 0.85}
            palette="saffron"
            mode={theme}
            interactive={true}
          />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Column: Headline, Features, CTAs & Social Proof */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-3 sm:space-y-3.5 text-left relative z-20">
              {/* High-Impact Modern Headline matching reference typography & landing page theme */}
              <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-[1.12]">
                <span className={theme === 'light' ? 'text-slate-900' : 'text-white'}>
                  Your Legal Rights.
                </span>{' '}
                <span className="block mt-1 sm:mt-1.5">
                  <span className={`text-transparent bg-clip-text bg-gradient-to-r font-black ${
                    theme === 'light'
                      ? 'from-orange-600 via-amber-600 to-orange-500'
                      : 'from-amber-300 via-saffron-400 to-orange-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                  }`}>
                    Always
                  </span>{' '}
                  <span className={theme === 'light' ? 'text-slate-900' : 'text-white'}>
                    on your side.
                  </span>
                </span>
              </h1>

              {/* Subtitle */}
              <p className={`text-xs sm:text-sm max-w-lg leading-relaxed ${theme === 'light' ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                NyayaSetu India connects citizens directly with Bar Council verified advocates, licensed notaries, and accredited mediators—backed by statutory 100% escrow protection and 0% platform fee on professional legal fees.
              </p>

              {/* 4 Authentic Statutory Features in warm light orange theme */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-0.5">
                <div className="flex flex-col items-start space-y-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    theme === 'light'
                      ? 'bg-amber-500/15 border border-amber-500/35 text-amber-700 shadow-sm'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                  }`}>
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[11px] ${theme === 'light' ? 'font-bold text-slate-800' : 'font-semibold text-slate-200'}`}>
                    Bar Council Verified
                  </span>
                </div>
                <div className="flex flex-col items-start space-y-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    theme === 'light'
                      ? 'bg-amber-500/15 border border-amber-500/35 text-amber-700 shadow-sm'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                  }`}>
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[11px] ${theme === 'light' ? 'font-bold text-slate-800' : 'font-semibold text-slate-200'}`}>
                    Statutory Escrow
                  </span>
                </div>
                <div className="flex flex-col items-start space-y-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    theme === 'light'
                      ? 'bg-amber-500/15 border border-amber-500/35 text-amber-700 shadow-sm'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                  }`}>
                    <Landmark className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[11px] ${theme === 'light' ? 'font-bold text-slate-800' : 'font-semibold text-slate-200'}`}>
                    Rule 36 Directory
                  </span>
                </div>
                <div className="flex flex-col items-start space-y-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    theme === 'light'
                      ? 'bg-amber-500/15 border border-amber-500/35 text-amber-700 shadow-sm'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                  }`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[11px] ${theme === 'light' ? 'font-bold text-slate-800' : 'font-semibold text-slate-200'}`}>
                    DPDP 2023 Vault
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/providers"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-saffron-600 via-amber-600 to-orange-600 hover:from-saffron-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center space-x-2 group"
                >
                  <span>Find Verified Counsel</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="#trust-pillars"
                  className={`px-4 py-2 rounded-xl backdrop-blur-md transition-all flex items-center space-x-2 group border ${
                    theme === 'light'
                      ? 'bg-white/90 hover:bg-white border-amber-500/40 text-slate-900 shadow-sm'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-amber-500/30 text-white'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    theme === 'light'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-700'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                  }`}>
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </div>
                  <div className="text-left">
                    <div className={`font-semibold text-xs ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      See how it works
                    </div>
                    <div className={`text-[10px] ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      2 min overview
                    </div>
                  </div>
                </Link>
              </div>

              {/* Social Proof Avatars & Metric Rating */}
              <div className="flex items-center space-x-2.5 pt-0.5">
                <div className="flex -space-x-1.5 overflow-hidden">
                  <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white shadow">DL</div>
                  <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white shadow">MH</div>
                  <div className="w-6 h-6 rounded-full bg-sky-600 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white shadow">TN</div>
                  <div className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white shadow">UP</div>
                  <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-300 shadow">+</div>
                </div>
                <div className="text-xs">
                  <div className="flex items-center text-amber-500 text-[10px] tracking-widest leading-none">
                    ★★★★★
                  </div>
                  <span className={`font-medium text-[10px] sm:text-[11px] ${theme === 'light' ? 'text-slate-700' : 'text-slate-400'}`}>
                    Trusted across <strong className={theme === 'light' ? 'text-amber-700 font-bold' : 'text-amber-300'}>680+ Districts</strong> &amp; <strong className={theme === 'light' ? 'text-amber-700 font-bold' : 'text-amber-300'}>12,500+ Verified Practitioners</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Open viewport allowing the theme background character to shine through */}
            <div className="hidden lg:flex lg:col-span-6 xl:col-span-6 items-end justify-center min-h-[460px] sm:min-h-[520px] lg:min-h-[calc(100vh-120px)] xl:min-h-[calc(100vh-115px)] pointer-events-none select-none" />
          </div>
        </div>

        {/* Bottom Statutory Credentials Ribbon (Inside Hero, cleanly pinned at base) */}
        <div className={`w-full max-w-7xl mx-auto pt-3 pb-1 border-t text-center relative z-10 flex-shrink-0 transition-colors duration-300 ${
          theme === 'light' ? 'border-slate-300/80 text-slate-800' : 'border-slate-800/80 text-slate-300'
        }`}>
          <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${
            theme === 'light' ? 'text-slate-600' : 'text-slate-400'
          }`}>
            BUILT FOR INDIAN CITIZENS &amp; ADVOCATES · MANDATED STATUTORY COMPLIANCE
          </p>
          <div className={`flex flex-wrap items-center justify-center gap-3 sm:gap-6 opacity-90 hover:opacity-100 transition-opacity text-[10.5px] font-semibold ${
            theme === 'light' ? 'text-slate-800' : 'text-slate-300'
          }`}>
            <div className="flex items-center space-x-1.5">
              <Scale className="w-3 h-3 text-saffron-500" />
              <span>Bar Council of India Rule 36</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Landmark className={`w-3 h-3 ${theme === 'light' ? 'text-blue-600' : 'text-sky-400'}`} />
              <span>Advocates Act 1961</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <FileCheck2 className={`w-3 h-3 ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>Notaries Act 1952</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Users2 className={`w-3 h-3 ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`} />
              <span>Mediation Act 2023</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className={`w-3 h-3 ${theme === 'light' ? 'text-indigo-600' : 'text-blue-400'}`} />
              <span>DPDP Act 2023 Data Vault</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Fast Search Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className={`max-w-4xl mx-auto backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl shadow-2xl border transition-colors duration-300 ${
          theme === 'light'
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50'
            : 'bg-slate-900/80 border-slate-700/70 text-white'
        }`}>
          <div className="text-left px-1 pb-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-saffron-600' : 'text-sky-400'}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${theme === 'light' ? 'text-saffron-600' : 'text-sky-400'}`}>
                Fast Practitioner Search
              </span>
            </div>
            <span className={`text-[11px] hidden sm:inline ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              Advocates, Notaries, Mediators &amp; Arbitrators across 680+ Districts
            </span>
          </div>
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-5 relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.hero.searchPlaceholder}
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 border transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950/70 border-slate-700/80 text-white placeholder-slate-400'
                }`}
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 border transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-slate-950/70 border-slate-700/80 text-slate-200'
                }`}
              >
                <option value="ALL">All Legal Providers</option>
                <option value="ADVOCATE">Advocates (Civil/Criminal)</option>
                <option value="NOTARY">Notary Public</option>
                <option value="MEDIATOR">Accredited Mediator</option>
                <option value="ARBITRATOR">Arbitrator</option>
                <option value="DOCUMENT_WRITER">Document Writer</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 border transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-slate-950/70 border-slate-700/80 text-slate-200'
                }`}
              >
                <option value="ALL">All States</option>
                <option value="Delhi">Delhi NCT</option>
                <option value="Punjab">Punjab</option>
                <option value="Haryana">Haryana</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full h-full min-h-[42px] bg-gradient-to-r from-saffron-600 via-amber-600 to-orange-600 hover:from-saffron-500 hover:to-orange-500 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-600/25 transition-all"
              >
                <span>Search</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Trust Pillars */}
      <section id="trust-pillars" className={`py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t transition-colors duration-300 ${
        theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            Four Core Pillars of Judicial Integrity &amp; Trust
          </h2>
          <p className={`text-sm mt-2.5 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Engineered from ground up to satisfy statutory mandates under the Advocates Act 1961, Notaries Act 1952, and DPDP Act 2023.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={`p-6 rounded-2xl border transition-all ${
            theme === 'light'
              ? 'bg-white border-slate-200 hover:border-amber-500/50 shadow-md text-slate-900'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/90 shadow-xl backdrop-blur-xl text-white'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-500 flex items-center justify-center mb-4">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className={`text-base font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Bar Council Verification</h3>
            <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Every advocate profile requires verified State Bar Council enrolment certificates and Certificate of Practice (COP) before publication.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border transition-all ${
            theme === 'light'
              ? 'bg-white border-slate-200 hover:border-amber-500/50 shadow-md text-slate-900'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/90 shadow-xl backdrop-blur-xl text-white'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-saffron-500/15 border border-saffron-500/30 text-saffron-500 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className={`text-base font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Escrow Payment Security</h3>
            <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Citizen payments are locked securely in statutory escrow and released only upon verified completion of the consultation or draft delivery.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border transition-all ${
            theme === 'light'
              ? 'bg-white border-slate-200 hover:border-amber-500/50 shadow-md text-slate-900'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/90 shadow-xl backdrop-blur-xl text-white'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className={`text-base font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Neutral Rule 36 Directory</h3>
            <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              No paid rank boosting, no touting, and no commercial bidding. Providers appear strictly based on verified jurisdiction, domain, and availability.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border transition-all ${
            theme === 'light'
              ? 'bg-white border-slate-200 hover:border-amber-500/50 shadow-md text-slate-900'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/90 shadow-xl backdrop-blur-xl text-white'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className={`text-base font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>DPDP 2023 Data Vault</h3>
            <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Confidential case materials and PII are encrypted at rest with AES-256 and hosted within Indian sovereign cloud infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* Practice Areas / Categories Grid */}
      <section id="categories" className={`py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t transition-colors duration-300 ${
        theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {t.categories.title}
              </h2>
              <p className={`text-sm mt-2 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                Explore specialized statutory legal domains and connect with certified practitioners.
              </p>
            </div>
            <Link
              href="/providers"
              className={`mt-4 sm:mt-0 text-sm font-semibold flex items-center space-x-1 transition-colors ${
                theme === 'light' ? 'text-saffron-600 hover:text-saffron-700' : 'text-sky-400 hover:text-sky-300'
              }`}
            >
              <span>View All 24 Legal Domains</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '01', title: t.categories.property, desc: t.categories.propertyDesc, href: '/providers?practiceArea=Property' },
              { num: '02', title: t.categories.family, desc: t.categories.familyDesc, href: '/providers?practiceArea=Family' },
              { num: '03', title: t.categories.criminal, desc: t.categories.criminalDesc, href: '/providers?practiceArea=Criminal' },
              { num: '04', title: t.categories.notary, desc: t.categories.notaryDesc, href: '/providers?providerType=NOTARY' },
              { num: '05', title: t.categories.mediation, desc: t.categories.mediationDesc, href: '/providers?providerType=MEDIATOR' },
              { num: '06', title: t.categories.documents, desc: t.categories.documentsDesc, href: '/providers?providerType=DOCUMENT_WRITER' },
            ].map((cat) => (
              <Link
                key={cat.num}
                href={cat.href}
                className={`p-6 rounded-2xl border transition-all group shadow-md ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 hover:border-amber-500/50 hover:shadow-lg'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-sky-500/50 hover:bg-slate-900/90 shadow-xl backdrop-blur-xl'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                    theme === 'light'
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-700'
                      : 'bg-white/5 border border-white/10 text-sky-400'
                  }`}>
                    {cat.num}
                  </div>
                  <h3 className={`font-bold transition-colors ${
                    theme === 'light'
                      ? 'text-slate-900 group-hover:text-amber-600'
                      : 'text-white group-hover:text-sky-400'
                  }`}>
                    {cat.title}
                  </h3>
                </div>
                <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  {cat.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Provider Incentive & Onboarding Callout Banner */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t transition-colors duration-300 ${
        theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className={`rounded-3xl p-8 sm:p-14 relative overflow-hidden backdrop-blur-2xl border shadow-2xl transition-colors duration-300 ${
          theme === 'light'
            ? 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 text-slate-900 border-amber-500/30 shadow-slate-200/60'
            : 'bg-gradient-to-r from-slate-950/90 via-govnavy-900/90 to-slate-950/90 text-white border-sky-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
        }`}>
          <div className="max-w-2xl relative z-10 space-y-4">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${
              theme === 'light'
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-700'
                : 'bg-sky-500/15 border border-sky-500/30 text-sky-400'
            }`}>
              <Award className="w-3.5 h-3.5" />
              <span>Incentive Engine: Founding Member Cohort</span>
            </div>

            <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              Are you an Advocate, Notary, or Mediator?
            </h2>

            <p className={`text-sm sm:text-base leading-relaxed ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              Join the national digital marketplace without compromising BCI Rule 36 ethics. Earn activity points for pro-bono DLSA cases, unlock free practice management tools, and receive an official &quot;Founding Member&quot; digital credential.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row gap-3">
              <Link
                href="/onboarding"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-saffron-600 via-amber-600 to-orange-600 hover:from-saffron-500 hover:to-orange-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center space-x-2"
              >
                <span>Start LSP Onboarding Wizard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/register?role=LSP"
                className={`px-6 py-3.5 rounded-xl border font-semibold text-sm flex items-center justify-center transition-colors ${
                  theme === 'light'
                    ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                Learn About Tiers &amp; Points
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

