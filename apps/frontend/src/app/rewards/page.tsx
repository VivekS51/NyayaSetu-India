'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatINR } from '../../lib/utils';
import {
  Award,
  Sparkles,
  Gift,
  ShieldCheck,
  Check,
  Trophy,
  Users,
  HeartHandshake,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function RewardsAndLeaderboardPage() {
  const [redeemedVoucher, setRedeemedVoucher] = useState<string | null>(null);

  const handleRedeem = (title: string, cost: number) => {
    const code = `VCHR-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;
    setRedeemedVoucher(`Successfully redeemed ${cost} points for "${title}". Voucher Code: ${code}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-saffron-50 border border-saffron-200 text-saffron-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ethical Legal Gamification & Social Impact Recognition</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-govnavy-900">
            Provider Tiers, Rewards & Impact Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Designed in strict adherence to Bar Council of India Rule 36: Incentives reward pro-bono service, response speed, and client satisfaction—not commercial bidding.
          </p>
        </div>

        {redeemedVoucher && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-sm">
            <span>{redeemedVoucher}</span>
            <button onClick={() => setRedeemedVoucher(null)} className="font-bold text-emerald-700 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* 4-Tier Hierarchy Comparison Matrix */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-govnavy-900">Platform Tier Hierarchy</h2>
            <p className="text-xs text-slate-500">Tiers unlock automated operational perks and digital practice tools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Bronze Tier */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  BR
                </div>
                <div>
                  <h3 className="font-bold text-sm text-govnavy-900">Bronze Counsel</h3>
                  <div className="text-[10px] text-slate-500">0 - 99 Points</div>
                </div>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-govgreen-600 shrink-0 mt-0.5" />
                  <span>Standard Rule 36 Directory Entry</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-govgreen-600 shrink-0 mt-0.5" />
                  <span>2 Free Monthly Aadhaar eSigns</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-govgreen-600 shrink-0 mt-0.5" />
                  <span>Standard Consultation Room</span>
                </li>
              </ul>
            </div>

            {/* Silver Tier */}
            <div className="bg-white p-5 rounded-2xl border-2 border-saffron-500 shadow-md space-y-3 relative">
              <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-saffron-500 text-white text-[10px] font-bold">
                Most Active
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs">
                  SL
                </div>
                <div>
                  <h3 className="font-bold text-sm text-govnavy-900">Silver Advocate</h3>
                  <div className="text-[10px] text-slate-500">100 - 299 Points</div>
                </div>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-saffron-600 shrink-0 mt-0.5" />
                  <span>Silver Advocate Badge</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-saffron-600 shrink-0 mt-0.5" />
                  <span>2.5% Platform Tech Fee Waiver</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-saffron-600 shrink-0 mt-0.5" />
                  <span>5 Free Monthly Aadhaar eSigns</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-saffron-600 shrink-0 mt-0.5" />
                  <span>Weekend Consultation Badge</span>
                </li>
              </ul>
            </div>

            {/* Gold Tier */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-xs">
                  GD
                </div>
                <div>
                  <h3 className="font-bold text-sm text-govnavy-900">Gold Practitioner</h3>
                  <div className="text-[10px] text-slate-500">300 - 599 Points</div>
                </div>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Gold Practitioner Directory Seal</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>5.0% Platform Tech Fee Waiver</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>15 Free Monthly Aadhaar eSigns</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Direct DLSA Pro-Bono Routing</span>
                </li>
              </ul>
            </div>

            {/* Platinum Tier */}
            <div className="bg-govnavy-900 text-white p-5 rounded-2xl border border-govnavy-700 shadow-sm space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-saffron-400 to-amber-300 text-govnavy-950 flex items-center justify-center font-bold text-xs">
                  PL
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Platinum Senior Fellow</h3>
                  <div className="text-[10px] text-slate-400">600+ Points</div>
                </div>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-govnavy-800">
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Platinum Star Digital Seal</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>10.0% Technology Platform Fee Waiver</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>50 Free Monthly Aadhaar eSigns</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>CPD Masterclass Speaker Faculty</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Points Redemption Catalog */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-govnavy-900">Points Redemption Catalog</h2>
            <p className="text-xs text-slate-500">
              Redeem your accrued activity points for practice tool credits and statutory fee waivers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-saffron-600">100 Points</div>
                <h3 className="font-bold text-sm text-govnavy-900">₹100 Platform Fee Waiver Voucher</h3>
                <p className="text-xs text-slate-500">
                  Applies automatically against technology facilitation fees for your next two consultations.
                </p>
              </div>
              <button
                onClick={() => handleRedeem('₹100 Fee Waiver Voucher', 100)}
                className="w-full py-2 bg-govnavy-900 hover:bg-govnavy-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Redeem 100 pts
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-saffron-600">150 Points</div>
                <h3 className="font-bold text-sm text-govnavy-900">Pack of 10 Extra Aadhaar eSigns</h3>
                <p className="text-xs text-slate-500">
                  Adds 10 cryptographically valid digital signature quota slots for client partition and tehsil deeds.
                </p>
              </div>
              <button
                onClick={() => handleRedeem('10 Extra eSigns Pack', 150)}
                className="w-full py-2 bg-govnavy-900 hover:bg-govnavy-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Redeem 150 pts
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-saffron-600">250 Points</div>
                <h3 className="font-bold text-sm text-govnavy-900">CPD Legal Masterclass Pass</h3>
                <p className="text-xs text-slate-500">
                  Complimentary access to Bar Association accredited continuing legal education webinar on Mediation Act 2023.
                </p>
              </div>
              <button
                onClick={() => handleRedeem('CPD Masterclass Pass', 250)}
                className="w-full py-2 bg-govnavy-900 hover:bg-govnavy-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Redeem 250 pts
              </button>
            </div>
          </div>
        </div>

        {/* Opt-In Anonymized Impact Leaderboard */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-govnavy-900 flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Monthly Pro-Bono & Justice Delivery Leaderboard</span>
              </h2>
              <p className="text-xs text-slate-500">
                Celebrating advocates and mediators contributing volunteer hours under NALSA / DLSA schemes.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              Opt-in / Anonymized Option Available
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Practitioner Display Name</th>
                  <th className="py-2.5 px-3">Current Tier</th>
                  <th className="py-2.5 px-3">Pro-Bono Hours</th>
                  <th className="py-2.5 px-3">Total Activity Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 font-medium">
                  <td className="py-3 px-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold inline-flex items-center justify-center">
                      1
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-govnavy-900">Adv. Rajesh Varma (Delhi)</td>
                  <td className="py-3 px-3">Silver Advocate</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">18.5 Hours</td>
                  <td className="py-3 px-3 font-bold">425 pts</td>
                </tr>

                <tr className="hover:bg-slate-50 font-medium">
                  <td className="py-3 px-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-bold inline-flex items-center justify-center">
                      2
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-govnavy-900">Adv. M. Sundaram (Chennai)</td>
                  <td className="py-3 px-3">Platinum Fellow</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">16.0 Hours</td>
                  <td className="py-3 px-3 font-bold">390 pts</td>
                </tr>

                <tr className="hover:bg-slate-50 font-medium">
                  <td className="py-3 px-3">
                    <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 font-bold inline-flex items-center justify-center">
                      3
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-700">Adv. H. S. (Amritsar - Anonymized)</td>
                  <td className="py-3 px-3">Silver Advocate</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">12.0 Hours</td>
                  <td className="py-3 px-3 font-bold">295 pts</td>
                </tr>

                <tr className="hover:bg-slate-50 font-medium">
                  <td className="py-3 px-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold inline-flex items-center justify-center">
                      4
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-700">Advocate #741 (Lucknow - Anonymized)</td>
                  <td className="py-3 px-3">Bronze Counsel</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">9.5 Hours</td>
                  <td className="py-3 px-3 font-bold">210 pts</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

