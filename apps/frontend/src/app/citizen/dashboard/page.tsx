'use client';

import React from 'react';
import Link from 'next/link';
import { formatINR } from '../../../lib/utils';
import {
  ShieldCheck,
  Scale,
  Calendar,
  Lock,
  ArrowRight,
  Gift,
  FileText,
  CheckCircle2,
  AlertCircle,
  Video,
} from 'lucide-react';

export default function CitizenDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-govnavy-900">Citizen Legal Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome Sunita Devi • Manage your verified consultations, escrow protection, and case documents.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/providers"
              className="px-4 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center space-x-1"
            >
              <span>Book New Consultation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3 Citizen Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 font-semibold">Active Escrow Protection</div>
            <div className="text-2xl font-extrabold text-govgreen-700">{formatINR(859)}</div>
            <div className="text-[11px] text-slate-500">Held in statutory escrow until you confirm completion</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 font-semibold">Citizen Loyalty Points</div>
            <div className="text-2xl font-extrabold text-saffron-600">35 pts</div>
            <div className="text-[11px] text-slate-500">Redeemable for platform tech fee discounts</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 font-semibold">Total Verified Consultations</div>
            <div className="text-2xl font-extrabold text-govnavy-900">1 Completed</div>
            <div className="text-[11px] text-emerald-600 font-medium">100% Verified Advocates</div>
          </div>
        </div>

        {/* Active Cases & Appointments Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-govnavy-900">Your Legal Consultations & Case Records</h3>
              <p className="text-xs text-slate-500">All sessions are covered by platform escrow and confidentiality guarantees.</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">1 Active • 1 Concluded</span>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Active Consultation Row */}
            <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-govnavy-900">
                    Adv. Rajesh Varma (Delhi High Court)
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    SLOT LOCKED • IN PROGRESS
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Land Title Search & Partition Consultation • Mode: <strong>Online Video Conference</strong>
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <span>Scheduled: <strong>Today, 10:30 AM</strong></span>
                  <span>Amount in Escrow: <strong>{formatINR(859)}</strong></span>
                  <span className="text-govgreen-700 font-semibold">✓ GST Invoice Generated</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  href="/consultation/bk-seed-001"
                  className="px-4 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center space-x-1.5"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Consultation Room</span>
                </Link>
              </div>
            </div>

            {/* Completed Consultation Row */}
            <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-govnavy-900">
                    Shri Ramesh Chawla (Govt Commissioned Notary)
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    COMPLETED • ESCROW SETTLED
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  General Power of Attorney Attestation • Mode: <strong>Chamber Notarial Execution</strong>
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <span>Completed on: <strong>14 Nov 2026</strong></span>
                  <span>Fee: <strong>{formatINR(250)}</strong></span>
                  <span className="text-amber-500 font-semibold">Review: 5.0 ★★★★★ Submitted</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => alert('Viewing archived case notes and signed notarial affidavit.')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Attested Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

