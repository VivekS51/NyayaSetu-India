'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Layers,
  Activity,
} from 'lucide-react';
import { ConstellationField, ConstellationVariant } from '../components/effects/constellation-field/ConstellationField';

export default function HomePage() {
  const { t } = useI18n();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');
  const [activeVariant, setActiveVariant] = useState<ConstellationVariant>('constellation-field');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('query', searchQuery.trim());
    if (selectedService !== 'ALL') params.append('providerType', selectedService);
    if (selectedState !== 'ALL') params.append('state', selectedState);
    router.push(`/providers?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-govnavy-900 via-govnavy-800 to-govnavy-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[560px]">
        {/* Constellation Field Isolated Canvas Effect */}
        <div className="absolute inset-0 z-0">
          <ConstellationField
            variant={activeVariant}
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

        {/* Subtle geometric background watermark */}
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center z-0">
          <Scale className="w-[600px] h-[600px] text-white" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          {/* Badge & Interactive Effect Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-saffron-500/10 border border-saffron-500/30 text-saffron-500 text-xs font-semibold tracking-wide backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BCI Rule 36 & DPDP Act 2023 Compliant Citizen Justice Portal</span>
            </div>

            {/* Quick Effect Mode Switcher */}
            <div className="hidden sm:inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-govnavy-950/60 border border-govnavy-700/60 backdrop-blur-md text-[11px] text-slate-300">
              <span className="text-slate-400 pl-1 pr-1 font-medium flex items-center gap-1">
                <Layers className="w-3 h-3 text-saffron-400" /> Mesh:
              </span>
              {(
                [
                  { id: 'constellation-field', label: 'Constellation' },
                  { id: 'topo-field', label: 'Topo Wave' },
                  { id: 'gateway-flow', label: 'Gateway' },
                  { id: 'connectivity-graph', label: 'Hub Graph' },
                  { id: 'defense-lines', label: 'Statutory Shield' },
                ] as { id: ConstellationVariant; label: string }[]
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setActiveVariant(mode.id)}
                  className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                    activeVariant === mode.id
                      ? 'bg-saffron-500 text-slate-900 font-bold shadow-sm'
                      : 'hover:text-white hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
            {t.hero.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {t.hero.subtitle}
          </p>

          {/* Interactive Search Bar */}
          <div className="max-w-4xl mx-auto mt-8 bg-white p-2.5 sm:p-3 rounded-2xl shadow-2xl border border-slate-200 text-slate-900">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Keyword / Issue input */}
              <div className="sm:col-span-5 relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.hero.searchPlaceholder}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500"
                />
              </div>

              {/* Service Type select */}
              <div className="sm:col-span-3">
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500 text-slate-700"
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
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500 text-slate-700"
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
                  className="w-full h-full min-h-[42px] bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-1.5 shadow transition-colors"
                >
                  <span>Search</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Real-time Impact Metrics */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="bg-govnavy-800/60 border border-govnavy-700/60 p-3 rounded-xl">
              <div className="text-xl font-bold text-white">12,500+</div>
              <div className="text-xs text-slate-400">Verified Practitioners</div>
            </div>
            <div className="bg-govnavy-800/60 border border-govnavy-700/60 p-3 rounded-xl">
              <div className="text-xl font-bold text-white">680+</div>
              <div className="text-xs text-slate-400">Districts Covered</div>
            </div>
            <div className="bg-govnavy-800/60 border border-govnavy-700/60 p-3 rounded-xl">
              <div className="text-xl font-bold text-saffron-500">0%</div>
              <div className="text-xs text-slate-400">Commission on Legal Fees</div>
            </div>
            <div className="bg-govnavy-800/60 border border-govnavy-700/60 p-3 rounded-xl">
              <div className="text-xl font-bold text-govgreen-600">100%</div>
              <div className="text-xs text-slate-400">Escrow Protected</div>
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

