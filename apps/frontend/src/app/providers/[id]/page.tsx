'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ApiClient, ProviderSummary, MOCK_PROVIDERS } from '../../../lib/api-client';
import { formatINR } from '../../../lib/utils';
import {
  ShieldCheck,
  Scale,
  MapPin,
  Calendar,
  Globe,
  Award,
  AlertCircle,
  FileText,
  Clock,
  Video,
  MessageSquare,
  Building,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

export default function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const providerId = (params?.id as string) || 'prof-lsp-003';

  const [provider, setProvider] = useState<ProviderSummary | null>(null);
  const [selectedMode, setSelectedMode] = useState<'ONLINE_VIDEO' | 'ONLINE_CHAT' | 'OFFLINE_IN_PERSON'>('ONLINE_VIDEO');
  const [selectedSlot, setSelectedSlot] = useState<string>('Tomorrow, 10:30 AM');
  const [bookingInitiated, setBookingInitiated] = useState(false);

  useEffect(() => {
    const p = MOCK_PROVIDERS.find((item) => item.id === providerId) || MOCK_PROVIDERS[0];
    setProvider(p);
  }, [providerId]);

  if (!provider) {
    return <div className="text-center py-20 text-slate-500 text-sm">Loading factual profile...</div>;
  }

  const handleBookingClick = () => {
    setBookingInitiated(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Link href="/providers" className="hover:text-saffron-600 flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Legal Directory</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800">{provider.fullName}</span>
        </div>

        {/* Mandatory BCI Rule 36 Statutory Banner */}
        <div className="bg-govnavy-900 text-slate-300 p-4 rounded-2xl border border-govnavy-700 text-xs flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-saffron-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-white font-bold">
              Bar Council of India Rule 36 Compliance Notice
            </div>
            <p className="leading-relaxed text-slate-300">
              This profile contains strictly factual, non-promotional information published in accordance with the
              amended Rule 36 of Bar Council of India Rules. It does not constitute legal advertisement, subjective ranking,
              or solicitation of work. The platform acts solely as a neutral technology infrastructure directory.
            </p>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-govnavy-900">{provider.fullName}</h1>
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>State Bar Roll Verified</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-govnavy-100 text-govnavy-800 text-xs font-bold">
                  {provider.providerType}
                </span>
              </div>

              {/* Verified Credentials Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                {provider.stateBarCouncil && (
                  <div className="flex items-center space-x-1.5">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>State Bar: <strong className="text-slate-800">{provider.stateBarCouncil}</strong></span>
                  </div>
                )}
                {provider.barRegistrationNo && (
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Enrolment Roll: <strong className="text-slate-800">{provider.barRegistrationNo}</strong></span>
                  </div>
                )}
                {provider.notaryAppointmentNo && (
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Notary Commission: <strong className="text-slate-800">{provider.notaryAppointmentNo}</strong></span>
                  </div>
                )}
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>District: <strong className="text-slate-800">{provider.district}, {provider.state}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-slate-400" />
                  <span>Experience: <strong className="text-slate-800">{provider.experienceYears} Years Standing</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>Languages: <strong className="text-slate-800">{provider.languagesSpoken.join(', ').toUpperCase()}</strong></span>
                </div>
              </div>

              {/* Earned Platform Trust Badges */}
              <div className="pt-2 flex flex-wrap gap-2">
                {provider.badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-saffron-50 text-saffron-800 border border-saffron-200 text-xs font-semibold"
                  >
                    <Award className="w-3.5 h-3.5 text-saffron-600" />
                    <span>{badge.title}</span>
                  </span>
                ))}
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tier: {provider.tier.name}</span>
                </span>
              </div>
            </div>

            {/* Statutory Consultation Rate Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left md:text-right shrink-0 space-y-1">
              <div className="text-xs text-slate-500 font-medium">Statutory Professional Fee</div>
              <div className="text-3xl font-extrabold text-govnavy-900">{formatINR(provider.consultationFeeINR)}</div>
              <div className="text-[11px] text-slate-500">Fixed rate • Protected by Escrow</div>
              {provider.isAvailableForProBono && (
                <div className="text-[11px] font-bold text-govgreen-700 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1">
                  Pro-Bono / Legal Aid Volunteer
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Factual Statement & Practice Courts */}
          <div className="md:col-span-2 space-y-6">
            {/* Factual Statement */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-base font-bold text-govnavy-900">Factual Practice Statement</h3>
              <p className="text-xs text-slate-700 leading-relaxed">{provider.bio}</p>
            </div>

            {/* Primary Courts of Practice */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-base font-bold text-govnavy-900">Courts & Jurisdictions Admitted</h3>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800">
                {provider.primaryCourt}
              </div>
            </div>

            {/* Practice Areas */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-base font-bold text-govnavy-900">Statutory Areas of Practice</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {provider.practiceAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-govgreen-600 shrink-0" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Consultation Booking Card */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200 space-y-5 sticky top-24">
              <h3 className="text-base font-bold text-govnavy-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-saffron-600" />
                <span>Schedule Consultation</span>
              </h3>

              {!bookingInitiated ? (
                <>
                  {/* Delivery Mode Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Consultation Mode</label>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedMode('ONLINE_VIDEO')}
                        className={`p-2 rounded-xl border font-bold flex flex-col items-center space-y-1 transition-colors ${
                          selectedMode === 'ONLINE_VIDEO'
                            ? 'bg-govnavy-900 border-govnavy-900 text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Video className="w-4 h-4" />
                        <span className="text-[10px]">Video Call</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMode('ONLINE_CHAT')}
                        className={`p-2 rounded-xl border font-bold flex flex-col items-center space-y-1 transition-colors ${
                          selectedMode === 'ONLINE_CHAT'
                            ? 'bg-govnavy-900 border-govnavy-900 text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-[10px]">Chat / Docs</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMode('OFFLINE_IN_PERSON')}
                        className={`p-2 rounded-xl border font-bold flex flex-col items-center space-y-1 transition-colors ${
                          selectedMode === 'OFFLINE_IN_PERSON'
                            ? 'bg-govnavy-900 border-govnavy-900 text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Building className="w-4 h-4" />
                        <span className="text-[10px]">Chamber</span>
                      </button>
                    </div>
                  </div>

                  {/* Available Time Slots */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Select Available Slot</label>
                    <div className="space-y-1.5">
                      {[
                        'Tomorrow, 10:30 AM - 11:00 AM',
                        'Tomorrow, 02:00 PM - 02:30 PM',
                        'Thursday, 11:00 AM - 11:30 AM',
                        'Thursday, 04:30 PM - 05:00 PM',
                      ].map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-colors ${
                            selectedSlot === slot
                              ? 'bg-saffron-50 border-saffron-500 text-saffron-900 ring-1 ring-saffron-500'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{slot}</span>
                          </div>
                          {selectedSlot === slot && <CheckCircle2 className="w-4 h-4 text-saffron-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Advocate Consultation Fee:</span>
                      <span>{formatINR(provider.consultationFeeINR)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Platform Facilitation & Escrow:</span>
                      <span>{formatINR(50)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST (18% on Platform Fee):</span>
                      <span>{formatINR(9)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-govnavy-900 text-sm">
                      <span>Total Escrow Amount:</span>
                      <span>{formatINR(provider.consultationFeeINR + 59)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBookingClick}
                    className="w-full py-3 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <span>Proceed to Secure Booking</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                /* Booking Slot Locked Screen */
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-govnavy-900">Slot Locked for 15 Minutes</h4>
                  <p className="text-xs text-slate-600">
                    Your appointment for <strong>{selectedSlot}</strong> via <strong>{selectedMode}</strong> is locked.
                  </p>
                  <div className="p-3 bg-govnavy-50 rounded-xl border border-govnavy-200 text-xs text-govnavy-900 font-bold">
                    Escrow Reference: IN-LEG-ESC-2026-X89
                  </div>
                  <button
                    onClick={() => router.push('/providers')}
                    className="w-full py-2.5 bg-govnavy-900 hover:bg-govnavy-800 text-white rounded-xl text-xs font-bold shadow transition-colors"
                  >
                    Continue in Phase 4 Booking Flow
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

