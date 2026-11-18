'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiClient, ProviderSummary, MOCK_PROVIDERS } from '../../lib/api-client';
import { formatINR } from '../../lib/utils';
import {
  Search,
  ShieldCheck,
  Scale,
  MapPin,
  Globe,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Award,
  Sparkles,
} from 'lucide-react';

function ProvidersDirectoryContent() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [providerType, setProviderType] = useState(searchParams.get('providerType') || 'ALL');
  const [state, setState] = useState(searchParams.get('state') || 'ALL');
  const [practiceArea, setPracticeArea] = useState(searchParams.get('practiceArea') || 'ALL');
  const [language, setLanguage] = useState(searchParams.get('language') || 'ALL');
  const [proBonoOnly, setProBonoOnly] = useState(false);

  const [providers, setProviders] = useState<ProviderSummary[]>(MOCK_PROVIDERS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProviders = async () => {
      setLoading(true);
      const results = await ApiClient.fetchProviders({
        providerType,
        state,
        practiceArea,
        language,
        query,
      });

      let filtered = results;
      if (proBonoOnly) {
        filtered = filtered.filter((p) => p.isAvailableForProBono);
      }
      setProviders(filtered);
      setLoading(false);
    };

    loadProviders();
  }, [query, providerType, state, practiceArea, language, proBonoOnly]);

  const resetFilters = () => {
    setQuery('');
    setProviderType('ALL');
    setState('ALL');
    setPracticeArea('ALL');
    setLanguage('ALL');
    setProBonoOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Title & BCI Rule 36 Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-govnavy-100 border border-govnavy-200 text-govnavy-800 text-xs font-semibold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-govgreen-600" />
            <span>Bar Council of India Rule 36 Compliant Legal Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-govnavy-900">
            Verified Legal Service Providers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Factual directory sorted strictly by statutory criteria, jurisdiction, and verified availability.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl max-w-sm text-[11px] text-amber-900 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Neutral Indexing:</strong> No sponsored placements. Providers cannot pay for ranking boosts.
          </span>
        </div>
      </div>

      {/* Search Bar & Instant Query Input */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-6 flex items-center space-x-3">
        <Search className="w-5 h-5 text-slate-400 shrink-0 ml-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by advocate name, court jurisdiction, or legal problem (e.g. partition suit, bail)..."
          className="w-full text-sm py-1.5 bg-transparent focus:outline-none text-slate-800"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Content Layout: Filters + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-govnavy-900 flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filters</span>
              </span>
              <button onClick={resetFilters} className="text-xs text-saffron-600 font-semibold hover:underline">
                Reset All
              </button>
            </div>

            {/* Service / Provider Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Provider Category</label>
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-saffron-500 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="ADVOCATE">Advocate (Civil & Criminal)</option>
                <option value="NOTARY">Notary Public</option>
                <option value="MEDIATOR">Accredited Mediator</option>
                <option value="ARBITRATOR">Arbitrator</option>
                <option value="DOCUMENT_WRITER">Document Writer</option>
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">State Jurisdiction</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-saffron-500 focus:outline-none"
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

            {/* Practice Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Legal Domain</label>
              <select
                value={practiceArea}
                onChange={(e) => setPracticeArea(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-saffron-500 focus:outline-none"
              >
                <option value="ALL">All Domains</option>
                <option value="Civil Litigation">Civil Litigation</option>
                <option value="Property">Property & Land Disputes</option>
                <option value="Family">Family & Matrimonial</option>
                <option value="Consumer">Consumer Protection</option>
                <option value="Criminal">Criminal Defense & Bail</option>
                <option value="Mediation">Mediation & Conciliation</option>
                <option value="Statutory Affidavits">Notarial Affidavits</option>
              </select>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Consultation Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-saffron-500 focus:outline-none"
              >
                <option value="ALL">Any Language</option>
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>

            {/* Pro-Bono Checkbox */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={proBonoOnly}
                  onChange={(e) => setProBonoOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-saffron-600 focus:ring-saffron-500"
                />
                <span className="text-xs font-medium text-slate-700">
                  Show Legal Aid / Pro-Bono Available Only
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Search Results List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Showing {providers.length} verified legal practitioners</span>
            <span>Sorted neutrally by jurisdiction and practice area</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading verified directory...</div>
          ) : providers.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No practitioners matched this criteria</h3>
              <p className="text-xs text-slate-500">
                Try broadening your state, district, or language filter options.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-govnavy-900 text-white rounded-xl text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            providers.map((p) => (
              <div
                key={p.id}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-govnavy-900">{p.fullName}</h2>
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Bar Verified</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-govnavy-100 text-govnavy-800 text-[11px] font-semibold">
                        {p.providerType}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-saffron-100 text-saffron-800 text-[11px] font-semibold">
                        {p.tier.name}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center text-xs text-slate-500 gap-x-4 gap-y-1">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {p.district}, {p.state}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.experienceYears} Years Exp</span>
                      </div>
                      {p.barRegistrationNo && (
                        <div className="text-slate-600 font-medium">
                          Roll: <code className="bg-slate-100 px-1 py-0.5 rounded">{p.barRegistrationNo}</code>
                        </div>
                      )}
                      {p.notaryAppointmentNo && (
                        <div className="text-slate-600 font-medium">
                          Notary Reg: <code className="bg-slate-100 px-1 py-0.5 rounded">{p.notaryAppointmentNo}</code>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{p.bio}</p>

                    {/* Practice Areas */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.practiceAreas.map((area, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium"
                        >
                          {area}
                        </span>
                      ))}
                    </div>

                    {/* Languages */}
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 pt-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>Languages: {p.languagesSpoken.join(', ').toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Right Action / Pricing Block */}
                  <div className="sm:text-right shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col justify-between items-center sm:items-end gap-2">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Statutory Consultation</div>
                      <div className="text-lg font-extrabold text-govnavy-900">
                        {formatINR(p.consultationFeeINR)}
                      </div>
                      {p.isAvailableForProBono && (
                        <div className="text-[10px] font-bold text-govgreen-600">Pro-Bono Available</div>
                      )}
                    </div>

                    <div className="flex sm:flex-col gap-2">
                      <Link
                        href={`/providers/${p.id}`}
                        className="px-4 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold shadow transition-colors text-center"
                      >
                        View Factual Profile
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProvidersSearchPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center py-12 text-slate-500 text-sm">Loading directory...</div>}>
        <ProvidersDirectoryContent />
      </Suspense>
    </div>
  );
}
