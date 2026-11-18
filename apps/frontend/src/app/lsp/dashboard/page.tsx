'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatINR } from '../../../lib/utils';
import {
  Scale,
  Award,
  ShieldCheck,
  TrendingUp,
  Users,
  Copy,
  Check,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Gift,
  FileCheck2,
  HeartHandshake,
} from 'lucide-react';

export default function LspDashboardPage() {
  const [copiedReferral, setCopiedReferral] = useState(false);

  const referralCode = 'REF-VARMA-1428';
  const referralLink = `https://nyayasetu.gov.in/onboarding?ref=${referralCode}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Profile Banner */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-govnavy-900">Adv. Rajesh Varma</h1>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bar Council Verified</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-saffron-100 text-saffron-800 border border-saffron-200 text-xs font-bold">
                Silver Advocate
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Delhi High Court & Tis Hazari Courts • Bar Roll: <code className="bg-slate-100 px-1 py-0.5 rounded">D/1428/2012</code>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/rewards"
              className="px-4 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center space-x-1.5"
            >
              <Gift className="w-4 h-4" />
              <span>Redeem Points</span>
            </Link>
            <Link
              href="/providers/prof-lsp-003"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
            >
              <span>View Public Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 font-semibold">Settled Earnings (Monetary Wallet)</div>
            <div className="text-2xl font-extrabold text-govnavy-900">{formatINR(4200)}</div>
            <div className="text-[11px] text-emerald-600 font-medium">100% Direct Escrow Releases</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 font-semibold">Escrow in Hold (Ongoing Cases)</div>
            <div className="text-2xl font-extrabold text-saffron-600">{formatINR(859)}</div>
            <div className="text-[11px] text-slate-500">Auto-release upon completion</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 font-semibold">Reward Points Balance</div>
            <div className="text-2xl font-extrabold text-blue-700">250 pts</div>
            <div className="text-[11px] text-slate-500">+175 points earned this month</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 font-semibold">Pro-Bono / DLSA Cases</div>
            <div className="text-2xl font-extrabold text-emerald-700">2 Cases</div>
            <div className="text-[11px] text-emerald-600 font-medium">6.5 Legal Aid Hours logged</div>
          </div>
        </div>

        {/* Middle Section: Tier Progress & Impact Report */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tier Progress Card (2 Cols) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-govnavy-900 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-saffron-600" />
                  <span>Tier Progression & Unlocked Benefits</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Based on quality metrics, pro-bono service, and response rate.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-saffron-50 text-saffron-800 text-xs font-bold border border-saffron-200">
                Current: Silver Advocate
              </span>
            </div>

            {/* Progress bar to Gold */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Silver (100 pts)</span>
                <span className="text-saffron-600">250 / 300 pts (75% to Gold)</span>
                <span>Gold Practitioner (300 pts)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-saffron-500 to-amber-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: '75%' }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Earn <strong>50 more points</strong> (e.g. 1 pro-bono case or 2 completed consultations) to unlock <strong>Gold Practitioner</strong>.
              </p>
            </div>

            {/* Unlocked Perks Matrix */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Active Tier Perks Unlocked
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-2">
                  <Check className="w-4 h-4 text-govgreen-600 shrink-0" />
                  <span>2.5% Platform Tech Fee Discount</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-2">
                  <Check className="w-4 h-4 text-govgreen-600 shrink-0" />
                  <span>5 Free Monthly Aadhaar eSigns</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-2">
                  <Check className="w-4 h-4 text-govgreen-600 shrink-0" />
                  <span>Weekend Consultation Badge</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-2">
                  <Check className="w-4 h-4 text-govgreen-600 shrink-0" />
                  <span>Direct DLSA Pro-Bono Referral Pipeline</span>
                </div>
              </div>
            </div>

            {/* Badges Gallery */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Statutory Trust Badges Bestowed
              </h4>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Bar Council Verified</span>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-saffron-50 text-saffron-800 border border-saffron-200 text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-saffron-600" />
                  <span>Founding Member</span>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                  <HeartHandshake className="w-4 h-4 text-blue-600" />
                  <span>DLSA Legal Aid Volunteer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Impact Report (1 Col) */}
          <div className="bg-gradient-to-br from-govnavy-900 to-govnavy-800 text-white p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-saffron-400 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Monthly Impact Report</span>
            </div>
            <h3 className="text-lg font-bold">November 2026 Summary</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your pro-bono consultations facilitated essential legal aid for 2 rural families in land inheritance matters without any tout exploitation.
            </p>

            <div className="space-y-2 pt-2 border-t border-govnavy-700 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Consultations Concluded:</span>
                <span className="font-bold text-white">4 Cases</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DLSA Pro-Bono Hours:</span>
                <span className="font-bold text-emerald-400">6.5 Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Response Rate:</span>
                <span className="font-bold text-white">96% (within 1 hr)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Client Rating:</span>
                <span className="font-bold text-amber-400">4.9 ★★★★★</span>
              </div>
            </div>

            {/* Referral Banner */}
            <div className="pt-4 border-t border-govnavy-700 space-y-2">
              <div className="text-xs font-bold text-saffron-400 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5" />
                <span>Colleague Referral Program</span>
              </div>
              <div className="flex items-center space-x-1">
                <code className="flex-1 p-2 bg-govnavy-950 rounded-lg text-xs font-mono text-saffron-300 truncate">
                  {referralCode}
                </code>
                <button
                  onClick={copyReferral}
                  className="p-2 bg-govnavy-700 hover:bg-govnavy-600 rounded-lg text-white"
                  title="Copy link"
                >
                  {copiedReferral ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Earn +50 points when a verified colleague completes their 1st consultation.
              </p>
            </div>
          </div>
        </div>

        {/* Appointments & Consultations Schedule */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-govnavy-900">Upcoming Appointments & Active Consultations</h3>
              <p className="text-xs text-slate-500">Direct access to end-to-end encrypted consultation rooms.</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">2 Bookings Scheduled</span>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-govnavy-900">Sunita Devi</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    IN PROGRESS • ESCROW HELD
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Land Title Search & Partition Consultation • Mode: <strong>Online Video Call</strong>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Today, 10:30 AM - 11:00 AM</span>
                  </span>
                  <span>Fee: <strong>{formatINR(800)}</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  href="/consultation/bk-seed-001"
                  className="px-4 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center space-x-1"
                >
                  <span>Open Consultation Room</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-govnavy-900">Gurpreet Singh</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    CONFIRMED
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    PRO-BONO (DLSA)
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Agricultural Revenue Dispute Review • Mode: <strong>Online Chat & Document Review</strong>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tomorrow, 02:30 PM - 03:00 PM</span>
                  </span>
                  <span>Incentive: <strong>+75 Points</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  href="/consultation/bk-seed-001"
                  className="px-4 py-2 bg-govnavy-900 hover:bg-govnavy-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  View Case Dossier
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

