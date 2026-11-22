'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useI18n } from '../lib/i18n';
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
  Sparkles,
  ChevronRight,
  Play,
  CheckCircle2,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { ConstellationField } from '../components/effects/constellation-field/ConstellationField';

export default function HomePage() {
  const { t } = useI18n();
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
    <div className="min-h-screen bg-[#060a17] text-white">
      {/* Hero Section - Compact Viewport Layout matching reference */}
      <section className="relative bg-[#060a17] text-white pt-14 sm:pt-16 pb-3 sm:pb-4 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[calc(100vh-65px)] lg:h-[calc(100vh-65px)] flex flex-col justify-between border-b border-slate-800/80">
        {/* Constellation Field Isolated Canvas Effect */}
        <div className="absolute inset-0 z-0">
          <ConstellationField
            variant="constellation-field"
            speed={1.0}
            density={1.15}
            length={1.1}
            strokeWidth={1}
            size={1}
            opacity={0.85}
            palette="tricolor"
            mode="dark"
            interactive={true}
          />
        </div>

        {/* Ambient Radial Glow Lighting */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[550px] h-[550px] bg-sky-500/20 rounded-full blur-3xl pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto w-full relative z-10 my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Column: Headline, Features, CTAs & Social Proof */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-3 sm:space-y-3.5 text-left relative z-20">
              {/* High-Impact Modern Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-[1.12] text-white">
                Your Legal Rights.{' '}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
                  Always on your side.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                NyayaSetu India connects citizens directly with Bar Council verified advocates, licensed notaries, and accredited mediators—backed by statutory 100% escrow protection and 0% platform fee on professional legal fees.
              </p>

              {/* 4 Feature Items in horizontal grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-0.5">
                <div className="flex flex-col items-start space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200">Instant Legal Answers</span>
                </div>
                <div className="flex flex-col items-start space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200">Smart Document Drafting</span>
                </div>
                <div className="flex flex-col items-start space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200">Case Law Research</span>
                </div>
                <div className="flex flex-col items-start space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200">Secure &amp; Confidential</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/providers"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center space-x-2 group"
                >
                  <span>Find Verified Counsel</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="#trust-pillars"
                  className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-white font-medium text-xs backdrop-blur-md transition-all flex items-center space-x-2 group"
                >
                  <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <Play className="w-2.5 h-2.5 fill-white text-white ml-0.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-xs text-white">See how it works</div>
                    <div className="text-[10px] text-slate-400">2 min overview</div>
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
                  <div className="flex items-center text-amber-400 text-[10px] tracking-widest leading-none">
                    ★★★★★
                  </div>
                  <span className="text-slate-400 font-medium text-[10px] sm:text-[11px]">
                    Trusted across <strong className="text-white">680+ Districts</strong> &amp; <strong className="text-white">12,500+ Verified Practitioners</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Prominent Lady Justice in Gold & Blue + Glass Assistant Card */}
            <div className="lg:col-span-6 xl:col-span-6 relative flex items-end justify-center min-h-[460px] sm:min-h-[520px] lg:min-h-[calc(100vh-120px)] xl:min-h-[calc(100vh-115px)] select-none">
              {/* Radial Cyan & Indigo Glow Spotlight behind Lady Justice */}
              <div className="absolute inset-0 flex items-center justify-center lg:-translate-x-10 xl:-translate-x-14 pointer-events-none -z-10">
                <div className="w-[520px] h-[580px] lg:w-[620px] lg:h-[700px] bg-gradient-to-tr from-sky-500/30 via-indigo-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />
              </div>

              {/* Lady Justice Character Image (Enlarged to fit from navbar to bottom) */}
              <div className="relative z-10 flex items-end justify-center w-full lg:-translate-x-10 xl:-translate-x-14">
                <Image
                  src="/images/lady-justice.png"
                  alt="Statue of Lady Justice - NyayaSetu India"
                  width={850}
                  height={1260}
                  priority
                  className="h-[460px] sm:h-[520px] lg:h-[calc(100vh-120px)] xl:h-[calc(100vh-115px)] max-h-[850px] w-auto object-contain object-bottom drop-shadow-[0_25px_60px_rgba(0,0,0,0.95)] drop-shadow-[0_0_45px_rgba(56,189,248,0.30)]"
                />
              </div>

              {/* Floating Glassmorphic Card (Center-Left): Interactive Citizen Justice Desk */}
              <div className="absolute bottom-1 sm:bottom-2 lg:bottom-3 left-0 sm:-left-4 lg:-left-12 sm:w-[280px] lg:w-[305px] backdrop-blur-2xl bg-slate-950/90 border border-sky-500/40 rounded-2xl p-2.5 sm:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-20 text-left">
                <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Citizen Legal Assistant</span>
                </div>
                <p className="text-[10px] sm:text-[10.5px] text-slate-300 mb-1.5 leading-tight">
                  How can verified counsel assist you today?
                </p>
                <div className="space-y-1">
                  <Link
                    href="/providers?providerType=DOCUMENT_WRITER"
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/5 hover:bg-sky-500/15 border border-white/10 hover:border-sky-500/40 text-[10.5px] font-medium text-slate-200 hover:text-white transition-all group"
                  >
                    <span>Draft a partnership or property deed</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/providers?providerType=ADVOCATE"
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/5 hover:bg-sky-500/15 border border-white/10 hover:border-sky-500/40 text-[10.5px] font-medium text-slate-200 hover:text-white transition-all group"
                  >
                    <span>Consult High Court / Civil Advocate</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/providers?providerType=NOTARY"
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/5 hover:bg-sky-500/15 border border-white/10 hover:border-sky-500/40 text-[10.5px] font-medium text-slate-200 hover:text-white transition-all group"
                  >
                    <span>Notary Public &amp; Attestation</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Statutory Credentials Ribbon (Inside Hero, cleanly pinned at base) */}
        <div className="w-full max-w-7xl mx-auto pt-3 pb-1 border-t border-slate-800/80 text-center relative z-10 flex-shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
            BUILT FOR INDIAN CITIZENS &amp; ADVOCATES · MANDATED STATUTORY COMPLIANCE
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 opacity-85 hover:opacity-100 transition-opacity text-[10.5px] font-semibold text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Scale className="w-3 h-3 text-saffron-500" />
              <span>Bar Council of India Rule 36</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Landmark className="w-3 h-3 text-sky-400" />
              <span>Advocates Act 1961</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <FileCheck2 className="w-3 h-3 text-emerald-400" />
              <span>Notaries Act 1952</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Users2 className="w-3 h-3 text-amber-400" />
              <span>Mediation Act 2023</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              <span>DPDP Act 2023 Data Vault</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Fast Search Section (Sleek Dark Glassmorphic Bar right below hero) */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto bg-slate-900/80 backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-700/70 text-slate-900">
          <div className="text-left px-1 pb-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Fast Practitioner Search</span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">Advocates, Notaries, Mediators &amp; Arbitrators across 680+ Districts</span>
          </div>
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-5 relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.hero.searchPlaceholder}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full h-full min-h-[42px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-600/30 transition-all"
              >
                <span>Search</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Trust Pillars */}
      <section id="trust-pillars" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Four Core Pillars of Judicial Integrity &amp; Trust
          </h2>
          <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
            Engineered from ground up to satisfy statutory mandates under the Advocates Act 1961, Notaries Act 1952, and DPDP Act 2023.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/90 shadow-xl backdrop-blur-xl transition-all">
            <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center mb-4">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Bar Council Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every advocate profile requires verified State Bar Council enrolment certificates and Certificate of Practice (COP) before publication.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/90 shadow-xl backdrop-blur-xl transition-all">
            <div className="w-12 h-12 rounded-xl bg-saffron-500/15 border border-saffron-500/30 text-saffron-400 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Escrow Payment Security</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Citizen payments are locked securely in statutory escrow and released only upon verified completion of the consultation or draft delivery.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/90 shadow-xl backdrop-blur-xl transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Neutral Rule 36 Directory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No paid rank boosting, no touting, and no commercial bidding. Providers appear strictly based on verified jurisdiction, domain, and availability.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/90 shadow-xl backdrop-blur-xl transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">DPDP 2023 Data Vault</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Confidential case materials and PII are encrypted at rest with AES-256 and hosted within Indian sovereign cloud infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* Practice Areas / Categories Grid */}
      <section id="categories" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{t.categories.title}</h2>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Explore specialized statutory legal domains and connect with certified practitioners.
              </p>
            </div>
            <Link
              href="/providers"
              className="mt-4 sm:mt-0 text-sm font-semibold text-sky-400 hover:text-sky-300 flex items-center space-x-1 transition-colors"
            >
              <span>View All 24 Legal Domains</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/providers?practiceArea=Property"
              className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 hover:border-sky-500/50 hover:bg-slate-900/90 transition-all group shadow-xl backdrop-blur-xl"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-sky-400 flex items-center justify-center font-bold">
                  01
                </div>
                <h3 className="font-bold text-white group-hover:text-sky-400 transition-colors">
                  {t.categories.property}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.categories.propertyDesc}</p>
            </Link>

            <Link
              href="/providers?practiceArea=Family"
              className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 hover:border-sky-500/50 hover:bg-slate-900/90 transition-all group shadow-xl backdrop-blur-xl"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-sky-400 flex items-center justify-center font-bold">
                  02
                </div>
                <h3 className="font-bold text-white group-hover:text-sky-400 transition-colors">
                  {t.categories.family}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.categories.familyDesc}</p>
            </Link>

            <Link
              href="/providers?practiceArea=Criminal"
              className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 hover:border-sky-500/50 hover:bg-slate-900/90 transition-all group shadow-xl backdrop-blur-xl"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-sky-400 flex items-center justify-center font-bold">
                  03
                </div>
                <h3 className="font-bold text-white group-hover:text-sky-400 transition-colors">
                  {t.categories.criminal}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.categories.criminalDesc}</p>
            </Link>

            <Link
              href="/providers?providerType=NOTARY"
              className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 hover:border-sky-500/50 hover:bg-slate-900/90 transition-all group shadow-xl backdrop-blur-xl"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-sky-400 flex items-center justify-center font-bold">
                  04
                </div>
                <h3 className="font-bold text-white group-hover:text-sky-400 transition-colors">
                  {t.categories.notary}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.categories.notaryDesc}</p>
            </Link>

            <Link
              href="/providers?providerType=MEDIATOR"
              className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 hover:border-sky-500/50 hover:bg-slate-900/90 transition-all group shadow-xl backdrop-blur-xl"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-sky-400 flex items-center justify-center font-bold">
                  05
                </div>
                <h3 className="font-bold text-white group-hover:text-sky-400 transition-colors">
                  {t.categories.mediation}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.categories.mediationDesc}</p>
            </Link>

            <Link
              href="/providers?providerType=DOCUMENT_WRITER"
              className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 hover:border-sky-500/50 hover:bg-slate-900/90 transition-all group shadow-xl backdrop-blur-xl"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-sky-400 flex items-center justify-center font-bold">
                  06
                </div>
                <h3 className="font-bold text-white group-hover:text-sky-400 transition-colors">
                  {t.categories.documents}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.categories.documentsDesc}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Provider Incentive & Onboarding Callout Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="bg-gradient-to-r from-slate-950/90 via-govnavy-900/90 to-slate-950/90 rounded-3xl p-8 sm:p-14 text-white relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-sky-500/30 backdrop-blur-2xl">
          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Incentive Engine: Founding Member Cohort</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Are you an Advocate, Notary, or Mediator?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Join the national digital marketplace without compromising BCI Rule 36 ethics. Earn activity points for pro-bono DLSA cases, unlock free practice management tools, and receive an official &quot;Founding Member&quot; digital credential.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row gap-3">
              <Link
                href="/onboarding"
                className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center space-x-2"
              >
                <span>Start LSP Onboarding Wizard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/register?role=LSP"
                className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center justify-center transition-colors"
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

