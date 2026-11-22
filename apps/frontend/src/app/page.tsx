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
      {/* Hero Section */}
      <section className="relative bg-[#060a17] text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[760px] lg:min-h-[840px] border-b border-slate-800/80">
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
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/15 rounded-full blur-3xl pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Headline, Services & Search */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* High-Impact Modern Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                Your Legal Rights.{' '}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-saffron-400 via-amber-200 to-sky-400">
                  Always on your side.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                NyayaSetu India connects citizens directly with Bar Council verified advocates, licensed notaries, and accredited mediators—backed by statutory 100% escrow protection and 0% platform fee on professional legal fees.
              </p>

              {/* Interactive Search Bar (Dark Glassmorphic Theme) */}
              <div className="mt-4 bg-slate-900/80 backdrop-blur-xl p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-slate-700/70 text-slate-900">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* Keyword / Issue input */}
                  <div className="sm:col-span-5 relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.hero.searchPlaceholder}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    />
                  </div>

                  {/* Service Type select */}
                  <div className="sm:col-span-3">
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    >
                      <option value="ALL">All Legal Providers</option>
                      <option value="ADVOCATE">Advocates (Civil/Criminal)</option>
                      <option value="NOTARY">Notary Public</option>
                      <option value="MEDIATOR">Accredited Mediator</option>
                      <option value="ARBITRATOR">Arbitrator</option>
                      <option value="DOCUMENT_WRITER">Document Writer</option>
                    </select>
                  </div>

                  {/* State select */}
                  <div className="sm:col-span-2">
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-saffron-500"
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

                  {/* Search CTA */}
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full h-full min-h-[42px] bg-gradient-to-r from-saffron-600 to-amber-600 hover:from-saffron-700 hover:to-amber-700 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-saffron-600/30 transition-all"
                    >
                      <span>Search</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Action Buttons & Social Proof (styled exactly like the reference image) */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/providers"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-saffron-500 to-amber-600 hover:from-saffron-600 hover:to-amber-700 text-white font-bold text-sm shadow-[0_0_25px_rgba(255,153,51,0.35)] transition-all flex items-center space-x-2"
                >
                  <span>Find Verified Counsel</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="#trust-pillars"
                  className="px-5 py-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-700/80 text-slate-200 font-semibold text-sm backdrop-blur-md transition-colors flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>How Escrow Works</span>
                </Link>
              </div>

              {/* Social Proof Avatars & Metric Rating */}
              <div className="flex items-center space-x-3 pt-1">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow">DL</div>
                  <div className="w-7 h-7 rounded-full bg-saffron-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow">MH</div>
                  <div className="w-7 h-7 rounded-full bg-sky-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow">TN</div>
                  <div className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow">UP</div>
                  <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-300 shadow">+</div>
                </div>
                <div className="text-xs">
                  <div className="flex items-center text-amber-400 text-[11px] tracking-widest">
                    ★★★★★
                  </div>
                  <span className="text-slate-400 font-medium text-[11px]">
                    Trusted across <strong className="text-white">680+ Districts</strong> & <strong className="text-white">12,500+ Verified Practitioners</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Lady Justice Main Character & Floating Glass Cards */}
            <div className="lg:col-span-5 relative flex items-center justify-center min-h-[500px] lg:min-h-[620px] select-none">
              {/* Radial Cyan Glow Spotlight behind Lady Justice */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                <div className="w-[380px] h-[480px] bg-gradient-to-tr from-sky-500/20 via-saffron-500/10 to-indigo-500/20 rounded-full blur-3xl" />
              </div>

              {/* Lady Justice Character Image */}
              <div className="relative z-10 flex items-center justify-center max-w-[380px] lg:max-w-[440px]">
                <Image
                  src="/images/lady-justice.png"
                  alt="Statue of Lady Justice - NyayaSetu India"
                  width={440}
                  height={680}
                  priority
                  className="max-h-[540px] lg:max-h-[600px] w-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)] filter contrast-105"
                />
              </div>

              {/* Floating Glassmorphic Card (Bottom-Center/Left): Interactive Citizen Justice Desk */}
              <div className="absolute bottom-4 left-0 sm:-left-6 right-4 sm:right-auto sm:w-[310px] backdrop-blur-2xl bg-slate-950/80 border border-sky-500/35 rounded-2xl p-4 shadow-[0_16px_45px_rgba(0,0,0,0.7)] z-20 text-left">
                <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold mb-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Citizen Legal Assistant</span>
                </div>
                <p className="text-[11px] text-slate-300 mb-2.5">
                  How can verified counsel assist you today?
                </p>
                <div className="space-y-1.5">
                  <Link
                    href="/providers?providerType=DOCUMENT_WRITER"
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-sky-500/15 border border-white/10 hover:border-sky-500/40 text-xs font-medium text-slate-200 hover:text-white transition-all group"
                  >
                    <span>Draft a partnership or property deed</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/providers?providerType=ADVOCATE"
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-sky-500/15 border border-white/10 hover:border-sky-500/40 text-xs font-medium text-slate-200 hover:text-white transition-all group"
                  >
                    <span>Consult High Court / Civil Advocate</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/providers?providerType=NOTARY"
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-sky-500/15 border border-white/10 hover:border-sky-500/40 text-xs font-medium text-slate-200 hover:text-white transition-all group"
                  >
                    <span>Notary Public & Attestation</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Statutory Credentials Ribbon (Matching partner logos ribbon in reference) */}
          <div className="mt-14 pt-8 border-t border-slate-800/80 text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-5">
              BUILT FOR INDIAN CITIZENS & ADVOCATES · MANDATED STATUTORY COMPLIANCE
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-80 hover:opacity-100 transition-opacity text-xs font-semibold text-slate-300">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-saffron-500" />
                <span>Bar Council of India Rule 36</span>
              </div>
              <div className="flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-sky-400" />
                <span>Advocates Act 1961</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>Notaries Act 1952</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users2 className="w-4 h-4 text-amber-400" />
                <span>Mediation Act 2023</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>DPDP Act 2023 Data Vault</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-govnavy-900">
            Four Core Pillars of Judicial Integrity & Trust
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Engineered from ground up to satisfy statutory mandates under the Advocates Act 1961, Notaries Act 1952, and DPDP Act 2023.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-govnavy-50 text-govnavy-700 flex items-center justify-center mb-4">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-govnavy-900 mb-2">Bar Council Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every advocate profile requires verified State Bar Council enrolment certificates and Certificate of Practice (COP) before publication.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-saffron-50 text-saffron-600 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-govnavy-900 mb-2">Escrow Payment Security</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Citizen payments are locked securely in statutory escrow and released only upon verified completion of the consultation or draft delivery.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-govnavy-900 mb-2">Neutral Rule 36 Directory</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No paid rank boosting, no touting, and no commercial bidding. Providers appear strictly based on verified jurisdiction, domain, and availability.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-govnavy-900 mb-2">DPDP 2023 Data Vault</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Confidential case materials and PII are encrypted at rest with AES-256 and hosted within Indian sovereign cloud infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* Practice Areas / Categories Grid */}
      <section id="categories" className="py-16 bg-slate-100 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-govnavy-900">{t.categories.title}</h2>
              <p className="text-sm text-slate-600 mt-1">
                Explore specialized statutory legal domains and connect with certified practitioners.
              </p>
            </div>
            <Link
              href="/providers"
              className="mt-4 sm:mt-0 text-sm font-semibold text-saffron-600 hover:text-saffron-700 flex items-center space-x-1"
            >
              <span>View All 24 Legal Domains</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/providers?practiceArea=Property"
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-saffron-500 transition-colors group shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-saffron-50 text-saffron-600 flex items-center justify-center font-bold">
                  01
                </div>
                <h3 className="font-bold text-govnavy-900 group-hover:text-saffron-600 transition-colors">
                  {t.categories.property}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{t.categories.propertyDesc}</p>
            </Link>

            <Link
              href="/providers?practiceArea=Family"
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-saffron-500 transition-colors group shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-govnavy-50 text-govnavy-700 flex items-center justify-center font-bold">
                  02
                </div>
                <h3 className="font-bold text-govnavy-900 group-hover:text-saffron-600 transition-colors">
                  {t.categories.family}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{t.categories.familyDesc}</p>
            </Link>

            <Link
              href="/providers?practiceArea=Criminal"
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-saffron-500 transition-colors group shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  03
                </div>
                <h3 className="font-bold text-govnavy-900 group-hover:text-saffron-600 transition-colors">
                  {t.categories.criminal}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{t.categories.criminalDesc}</p>
            </Link>

            <Link
              href="/providers?providerType=NOTARY"
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-saffron-500 transition-colors group shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  04
                </div>
                <h3 className="font-bold text-govnavy-900 group-hover:text-saffron-600 transition-colors">
                  {t.categories.notary}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{t.categories.notaryDesc}</p>
            </Link>

            <Link
              href="/providers?providerType=MEDIATOR"
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-saffron-500 transition-colors group shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  05
                </div>
                <h3 className="font-bold text-govnavy-900 group-hover:text-saffron-600 transition-colors">
                  {t.categories.mediation}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{t.categories.mediationDesc}</p>
            </Link>

            <Link
              href="/providers?providerType=DOCUMENT_WRITER"
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-saffron-500 transition-colors group shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  06
                </div>
                <h3 className="font-bold text-govnavy-900 group-hover:text-saffron-600 transition-colors">
                  {t.categories.documents}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{t.categories.documentsDesc}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Provider Incentive & Onboarding Callout Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-govnavy-900 to-govnavy-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl border border-govnavy-700">
          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-saffron-500/20 text-saffron-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Incentive Engine: Founding Member Cohort</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
              Are you an Advocate, Notary, or Mediator?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Join the national digital marketplace without compromising BCI Rule 36 ethics. Earn activity points for pro-bono DLSA cases, unlock free practice management tools, and receive an official &quot;Founding Member&quot; digital credential.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href="/onboarding"
                className="px-6 py-3 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white font-bold text-sm shadow transition-colors flex items-center justify-center space-x-2"
              >
                <span>Start LSP Onboarding Wizard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/register?role=LSP"
                className="px-6 py-3 rounded-xl bg-govnavy-800 hover:bg-govnavy-700 text-slate-200 border border-govnavy-600 font-semibold text-sm flex items-center justify-center"
              >
                Learn About Tiers & Points
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

