'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  Users,
  Award,
  AlertTriangle,
  IndianRupee,
  Activity,
  FileCheck2,
  Sliders,
  History,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  ExternalLink,
  RefreshCw,
  Building2,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  ApiClient,
  AdminAnalyticsData,
  DisputeItem,
  AuditLogItem,
} from '../../lib/api-client';

type TabKey = 'overview' | 'verification' | 'disputes' | 'incentives' | 'audit';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [incentiveRules, setIncentiveRules] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [rejectionReasonCode, setRejectionReasonCode] = useState('INVALID_BAR_COUNCIL_REGISTRATION');
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Dispute Resolution Modal State
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [disputeResolutionNotes, setDisputeResolutionNotes] = useState('');

  // Audit filter state
  const [auditSearch, setAuditSearch] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [analyticsData, vQueue, disputesData, rulesData, auditData] = await Promise.all([
        ApiClient.fetchAdminAnalytics(),
        ApiClient.fetchAdminVerificationQueue(),
        ApiClient.fetchAdminDisputes(),
        ApiClient.fetchAdminIncentiveRules(),
        ApiClient.fetchAdminAuditLogs(),
      ]);

      setAnalytics(analyticsData);
      setVerificationQueue(vQueue);
      setDisputes(disputesData);
      setIncentiveRules(rulesData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error('Failed to load admin telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 5000);
  };

  // 1. Verification Handlers
  const handleApproveVerification = async (profileId: string, name: string) => {
    await ApiClient.processVerificationDecision(profileId, 'APPROVE', undefined, 'Bar Council credentials approved');
    setVerificationQueue((prev) => prev.filter((p) => p.providerProfileId !== profileId));
    showNotification(`✅ Successfully approved credentials for ${name}. Verified badge and 100 points bestowed.`);
  };

  const openRejectModal = (profileId: string) => {
    setSelectedProfileId(profileId);
    setRejectionReasonCode('INVALID_BAR_COUNCIL_REGISTRATION');
    setRejectionNotes('');
    setRejectModalOpen(true);
  };

  const handleConfirmRejection = async () => {
    if (!selectedProfileId) return;
    await ApiClient.processVerificationDecision(selectedProfileId, 'REJECT', rejectionReasonCode, rejectionNotes);
    setVerificationQueue((prev) => prev.filter((p) => p.providerProfileId !== selectedProfileId));
    setRejectModalOpen(false);
    showNotification(`⚠️ Application rejected under statutory code: ${rejectionReasonCode}`);
  };

  // 2. Dispute Handlers
  const openDisputeModal = (dispute: DisputeItem) => {
    setSelectedDispute(dispute);
    setDisputeResolutionNotes('');
    setDisputeModalOpen(true);
  };

  const handleResolveDispute = async (action: 'REFUND_CITIZEN' | 'RELEASE_TO_PROVIDER') => {
    if (!selectedDispute) return;
    await ApiClient.resolveAdminDispute(selectedDispute.id, action, disputeResolutionNotes || 'Resolved as per investigation');
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === selectedDispute.id
          ? { ...d, status: action === 'REFUND_CITIZEN' ? 'RESOLVED_REFUNDED' : 'RESOLVED_SETTLED' }
          : d
      )
    );
    setDisputeModalOpen(false);
    showNotification(
      action === 'REFUND_CITIZEN'
        ? `💳 Sovereign Escrow refund of ₹${selectedDispute.escrowAmountINR} approved and returned to Citizen.`
        : `⚖️ Escrow payment of ₹${selectedDispute.escrowAmountINR} released to provider wallet.`
    );
  };

  // 3. Incentive Rule Handlers
  const handleToggleRuleActive = async (ruleId: string, currentState: boolean) => {
    await ApiClient.updateAdminIncentiveRule(ruleId, { isActive: !currentState });
    setIncentiveRules((prev) =>
      prev.map((r) => (r.ruleId === ruleId ? { ...r, isActive: !currentState } : r))
    );
    showNotification(`Incentive rule status toggled: ${!currentState ? 'ACTIVE' : 'PAUSED'}`);
  };

  const handleChangeAbGroup = async (ruleId: string, group: string) => {
    await ApiClient.updateAdminIncentiveRule(ruleId, { abTestGroup: group });
    setIncentiveRules((prev) =>
      prev.map((r) => (r.ruleId === ruleId ? { ...r, abGroup: group } : r))
    );
    showNotification(`Rule cohort allocation updated to: Group ${group}`);
  };

  const handleChangeRulePoints = async (ruleId: string, points: number) => {
    await ApiClient.updateAdminIncentiveRule(ruleId, { pointsAwarded: points });
    setIncentiveRules((prev) =>
      prev.map((r) => (r.ruleId === ruleId ? { ...r, pointsAwarded: points } : r))
    );
    showNotification(`Points allocation updated to ${points} pts`);
  };

  const filteredAuditLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.resourceId.toLowerCase().includes(auditSearch.toLowerCase()) ||
      (l.userId && l.userId.toLowerCase().includes(auditSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Executive GovTech Header */}
        <div className="bg-govnavy-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-saffron-500/20 text-saffron-400 text-xs font-bold uppercase tracking-wider border border-saffron-500/30">
                  GovTech Command Desk
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-govgreen-600/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                  BCI Rule 36 Compliant
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                NyayaSetu India — Central Statutory Administration
              </h1>
              <p className="text-sm text-slate-300">
                Official verification desk, sovereign escrow redressal, and incentive telemetry for legal service providers.
              </p>
            </div>

            {/* Admin identity badge */}
            <div className="flex items-center space-x-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
              <div className="w-10 h-10 rounded-full bg-saffron-600 flex items-center justify-center font-bold text-white shadow">
                PS
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Smt. Priya Sharma</p>
                <p className="text-[11px] text-slate-400">Joint Registrar / Chief Verifier</p>
              </div>
            </div>
          </div>

          {/* Action toast */}
          {actionMessage && (
            <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-600/50 rounded-xl text-emerald-300 text-xs font-medium flex items-center space-x-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>

        {/* Top KPI Telemetry Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium">Citizens</span>
              <p className="text-xl font-black text-white mt-1">
                {analytics.summaryCards.totalCitizens.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-emerald-400 font-medium">+14% MoM</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium">Verified Providers</span>
              <p className="text-xl font-black text-saffron-400 mt-1">
                {analytics.summaryCards.totalProviders.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">6 Categories</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium">Escrow Protected</span>
              <p className="text-xl font-black text-white mt-1">
                ₹{analytics.summaryCards.activeEscrowHeldINR.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-amber-400 font-medium">100% Secured</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium">Settled Earnings</span>
              <p className="text-xl font-black text-emerald-400 mt-1">
                ₹{analytics.summaryCards.totalSettledEarningsINR.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">0% Commission</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium">Platform Fee & GST</span>
              <p className="text-xl font-black text-sky-400 mt-1">
                ₹{(analytics.summaryCards.platformTechFeeRevenueINR + analytics.summaryCards.gstCollectedINR).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">Flat ₹50 + 18%</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium">Active Disputes</span>
              <p className="text-xl font-black text-rose-400 mt-1">
                {analytics.summaryCards.activeDisputes}
              </p>
              <span className="text-[10px] text-slate-400">
                {analytics.trustAndDisputes.disputeRatePercent}% rate
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium">Legal Aid Hours</span>
              <p className="text-xl font-black text-purple-400 mt-1">
                {analytics.summaryCards.proBonoLegalAidSessions}
              </p>
              <span className="text-[10px] text-emerald-400 font-medium">NALSA/DLSA</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-700 space-x-1 pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-saffron-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Funnel & Platform Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'verification'
                ? 'bg-saffron-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Provider Verification Desk ({verificationQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'disputes'
                ? 'bg-saffron-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Dispute Redressal ({disputes.filter((d) => d.status === 'PENDING_ADMIN_REVIEW').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('incentives')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'incentives'
                ? 'bg-saffron-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Incentive Engine & A/B Toggles</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-saffron-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>DPDP Act Audit Feed</span>
          </button>
        </div>

        {/* Tab 1: Funnel & Platform Telemetry */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            {/* Onboarding Funnel Visualizer */}
            <div className="bg-govnavy-900 border border-slate-700 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Provider Onboarding Funnel</h2>
                  <p className="text-xs text-slate-400">
                    Statutory multi-stage progression from mobile OTP to first verified client consultation.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
                  Overall Conversion: {analytics.onboardingFunnel.overallConversionPercent}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                {analytics.onboardingFunnel.stages.map((stage, idx) => {
                  const maxCount = analytics.onboardingFunnel.stages[0].count;
                  const percent = Math.round((stage.count / maxCount) * 100);
                  return (
                    <div
                      key={idx}
                      className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Stage {idx + 1}
                        </span>
                        <p className="text-xs font-semibold text-white mt-1 leading-snug">
                          {stage.stage.replace(/^\d+\.\s*/, '')}
                        </p>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between items-baseline text-xs mb-1">
                          <span className="text-lg font-black text-white">{stage.count}</span>
                          <span className="text-[11px] text-slate-400">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-saffron-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        {stage.dropOffPercent > 0 && (
                          <span className="text-[10px] text-rose-400 mt-1 block">
                            -{stage.dropOffPercent}% drop-off
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Telemetry & Statutory Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-govnavy-900 border border-slate-700 rounded-2xl p-6 shadow-md">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                  <span>Sovereign Financial Decoupling Model</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Strictly prevents fee-splitting under Section 35 of the Advocates Act 1961. The client fee is 100% credited to the provider; NyayaSetu charges only a flat technology facilitation fee.
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                    <span className="text-slate-300">Total Gross Merchandise Value (GMV)</span>
                    <span className="font-bold text-white font-mono">
                      ₹{analytics.financialTelemetry.totalGMV.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                    <span className="text-emerald-300">Settled to Legal Service Providers (100%)</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      ₹{analytics.financialTelemetry.settledProviderEarnings.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                    <span className="text-amber-300">Currently Held in RBI Sovereign Escrow</span>
                    <span className="font-bold text-amber-400 font-mono">
                      ₹{analytics.financialTelemetry.activeEscrowHeld.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                    <span className="text-sky-300">Platform Technology Revenue (Flat ₹50/consultation)</span>
                    <span className="font-bold text-sky-400 font-mono">
                      ₹{analytics.financialTelemetry.platformRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                    <span className="text-slate-300">Statutory 18% GST (Remitted to Govt of India)</span>
                    <span className="font-bold text-white font-mono">
                      ₹{analytics.financialTelemetry.gstCollected.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Provider Category Distribution */}
              <div className="bg-govnavy-900 border border-slate-700 rounded-2xl p-6 shadow-md">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-saffron-400" />
                  <span>Enrolled Legal Professionals by Statutory Category</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Distribution across courts, tribunals, and registration authorities in India.
                </p>

                <div className="mt-4 space-y-2.5">
                  {[
                    { label: 'Advocates (Bar Council of India / State Bars)', count: analytics.providerCategories.advocates, color: 'bg-saffron-500' },
                    { label: 'Notaries (Notaries Act 1952 / Central Govt)', count: analytics.providerCategories.notaries, color: 'bg-emerald-500' },
                    { label: 'Arbitrators (Arbitration & Conciliation Act 1996)', count: analytics.providerCategories.arbitrators, color: 'bg-sky-500' },
                    { label: 'Mediators (Mediation Act 2023 / High Court Annexed)', count: analytics.providerCategories.mediators, color: 'bg-purple-500' },
                    { label: 'Document Writers & Petition Writers', count: analytics.providerCategories.documentWriters, color: 'bg-amber-500' },
                    { label: 'Legal Consultants & Corporate Advisors', count: analytics.providerCategories.legalConsultants, color: 'bg-slate-400' },
                  ].map((cat, idx) => {
                    const total = analytics.summaryCards.totalProviders || 1;
                    const percent = Math.round((cat.count / total) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium">{cat.label}</span>
                          <span className="text-white font-bold">{cat.count} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`${cat.color} h-full rounded-full`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Provider Verification Desk */}
        {activeTab === 'verification' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Provider Verification Queue</h2>
                <p className="text-xs text-slate-400">
                  Verify Bar Council enrolment certificates, Notary gazette notifications, and government identity before conferring the "Verified" badge.
                </p>
              </div>
              <button
                onClick={loadAllData}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center space-x-1 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Queue</span>
              </button>
            </div>

            {verificationQueue.length === 0 ? (
              <div className="bg-govnavy-900 border border-slate-700 rounded-2xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Queue Clear!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  All submitted legal service provider dossiers have been verified.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {verificationQueue.map((item) => (
                  <div
                    key={item.requestId}
                    className="bg-govnavy-900 border border-slate-700 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-saffron-500/20 text-saffron-400 text-[11px] font-bold border border-saffron-500/30">
                          {item.providerType}
                        </span>
                        <h3 className="text-base font-bold text-white">{item.providerName}</h3>
                        <span className="text-xs text-slate-400">• {item.district}, {item.state}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Bar Council / Authority</span>
                          <span className="font-semibold text-slate-200">
                            {item.stateBarCouncil || 'Notaries Cell, Ministry of Law'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Registration / Gazette No.</span>
                          <span className="font-mono text-saffron-400 font-semibold">
                            {item.barRegistrationNo || item.notaryAppointmentNo}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">OCR Matching Score</span>
                          <span className="inline-flex items-center text-emerald-400 font-bold">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {item.ocrPayload?.confidenceScore ? `${Math.round(item.ocrPayload.confidenceScore * 100)}% Match` : '96% Match'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 pt-1 text-xs">
                        <span className="text-slate-400">
                          Submitted: {new Date(item.submittedAt).toLocaleString()}
                        </span>
                        <a
                          href="https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com/credentials/sample_enrolment.pdf"
                          target="_blank"
                          rel="noreferrer"
                          className="text-saffron-400 hover:underline flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Inspect Vault Document ({item.credentialsCount} file)</span>
                        </a>
                      </div>
                    </div>

                    {/* Verification Actions */}
                    <div className="flex md:flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApproveVerification(item.providerProfileId, item.providerName)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Verify</span>
                      </button>

                      <button
                        onClick={() => openRejectModal(item.providerProfileId)}
                        className="px-4 py-2 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 font-medium text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Statutory Rejection</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Citizen Escrow Dispute Redressal Desk */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Citizen Escrow Grievance Redressal</h2>
              <p className="text-xs text-slate-400">
                Independent grievance officer portal for resolving service disputes and releasing or refunding escrow funds.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {disputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="bg-govnavy-900 border border-slate-700 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        dispute.status === 'PENDING_ADMIN_REVIEW'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {dispute.status}
                      </span>
                      <span className="font-mono text-xs text-slate-400">{dispute.bookingReference}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-white">{dispute.serviceTitle}</span>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Grievance Code: <b className="text-rose-400 font-mono">{dispute.reasonCode}</b></span>
                        <span className="text-amber-400 font-bold">Escrow Locked: ₹{dispute.escrowAmountINR}</span>
                      </div>
                      <p className="text-slate-200 mt-1 italic">
                        "{dispute.description}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                      <div>Citizen: <b className="text-white">{dispute.raisedBy.name}</b> ({dispute.raisedBy.phone})</div>
                      <div>Provider: <b className="text-white">{dispute.provider.name}</b> ({dispute.provider.providerType})</div>
                    </div>
                  </div>

                  {/* Dispute Action */}
                  <div className="flex-shrink-0">
                    {dispute.status === 'PENDING_ADMIN_REVIEW' ? (
                      <button
                        onClick={() => openDisputeModal(dispute)}
                        className="px-4 py-2 bg-saffron-600 hover:bg-saffron-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-1.5"
                      >
                        <Scale className="w-4 h-4" />
                        <span>Adjudicate & Resolve</span>
                      </button>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Case Closed</span>
                        </span>
                        {dispute.resolutionNotes && (
                          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{dispute.resolutionNotes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Incentive Rule & A/B Experimentation Engine */}
        {activeTab === 'incentives' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Configurable Incentive Rules & A/B Toggles</h2>
              <p className="text-xs text-slate-400">
                Administratively edit point values, toggle rules, and run A/B cohort experiments without code modifications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incentiveRules.map((rule) => (
                <div
                  key={rule.ruleId}
                  className="bg-govnavy-900 border border-slate-700 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase font-bold">
                        {rule.category || 'INCENTIVE'}
                      </span>
                      <button
                        onClick={() => handleToggleRuleActive(rule.ruleId, rule.isActive)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                          rule.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Paused'}
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                    <p className="text-[11px] font-mono text-slate-400">{rule.ruleCode}</p>

                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Reward Points:</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleChangeRulePoints(rule.ruleId, Math.max(0, rule.pointsAwarded - 10))}
                            className="w-5 h-5 rounded bg-slate-700 text-white font-bold flex items-center justify-center text-xs hover:bg-slate-600"
                          >
                            -
                          </button>
                          <span className="font-bold text-saffron-400 font-mono w-12 text-center">
                            +{rule.pointsAwarded}
                          </span>
                          <button
                            onClick={() => handleChangeRulePoints(rule.ruleId, rule.pointsAwarded + 10)}
                            className="w-5 h-5 rounded bg-slate-700 text-white font-bold flex items-center justify-center text-xs hover:bg-slate-600"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700">
                        <span className="text-slate-400">A/B Testing Cohort:</span>
                        <select
                          value={rule.abGroup || 'ALL'}
                          onChange={(e) => handleChangeAbGroup(rule.ruleId, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white"
                        >
                          <option value="ALL">All Providers (100%)</option>
                          <option value="A">Cohort A (Control)</option>
                          <option value="B">Cohort B (Boosted)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                    <span>Triggered: <b className="text-white">{rule.timesTriggered || 0} times</b></span>
                    <span>Disbursed: <b className="text-saffron-400">{rule.totalPointsIssued || 0} pts</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: DPDP Act & Statutory Audit Logs Feed */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">DPDP Act 2023 & IT Act Statutory Audit Feed</h2>
                <p className="text-xs text-slate-400">
                  Append-only immutable event log documenting citizen consent, administrator decisions, and escrow movements.
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by action or ID..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-govnavy-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-saffron-500 w-64"
                />
              </div>
            </div>

            <div className="bg-govnavy-900 border border-slate-700 rounded-2xl overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3">Timestamp (IST)</th>
                      <th className="p-3">Statutory Event</th>
                      <th className="p-3">Resource Type & ID</th>
                      <th className="p-3">Actor ID</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Integrity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-slate-300">
                          {new Date(log.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-saffron-500/10 text-saffron-400 font-bold border border-saffron-500/20">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">
                          <span className="text-slate-400">{log.resourceType}:</span> {log.resourceId}
                        </td>
                        <td className="p-3 text-slate-400">{log.userId || 'SYSTEM'}</td>
                        <td className="p-3 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                        <td className="p-3">
                          <span className="text-[10px] text-emerald-400 font-sans font-bold flex items-center space-x-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>SHA-256 Valid</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Statutory Rejection Reason Modal */}
        {rejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-govnavy-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Statutory Rejection Notice</span>
              </h3>
              <p className="text-xs text-slate-300">
                State Bar Council regulations require precise reason citation when declining verification.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Statutory Reason Code:
                  </label>
                  <select
                    value={rejectionReasonCode}
                    onChange={(e) => setRejectionReasonCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="INVALID_BAR_COUNCIL_REGISTRATION">
                      Invalid / Unmatched Bar Council Enrolment Number
                    </option>
                    <option value="EXPIRED_APPOINTMENT_CERTIFICATE">
                      Expired / Non-Renewed Notary Appointment Certificate
                    </option>
                    <option value="DISCIPLINARY_ACTION_PENDING">
                      Disciplinary Proceedings Pending before State Bar Tribunal
                    </option>
                    <option value="UNAUTHENTICATED_PHOTO_ID">
                      Blurred or Unauthenticated Photo Identity Proof
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Examiner Notes for Applicant:
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Provide guidance on required rectification..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRejection}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  Confirm Statutory Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Resolution Modal */}
        {disputeModalOpen && selectedDispute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-govnavy-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Scale className="w-5 h-5 text-saffron-400" />
                <span>Adjudicate Sovereign Escrow Dispute</span>
              </h3>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Booking: <b className="text-white">{selectedDispute.bookingReference}</b></span>
                  <span className="text-amber-400 font-bold">Escrow: ₹{selectedDispute.escrowAmountINR}</span>
                </div>
                <p className="text-slate-300 italic">"{selectedDispute.description}"</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Investigation & Adjudication Findings:
                </label>
                <textarea
                  rows={3}
                  value={disputeResolutionNotes}
                  onChange={(e) => setDisputeResolutionNotes(e.target.value)}
                  placeholder="Record call logs / video audit findings and reason for judgment..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-saffron-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <button
                  onClick={() => setDisputeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResolveDispute('RELEASE_TO_PROVIDER')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  Release to Provider (₹{selectedDispute.escrowAmountINR})
                </button>
                <button
                  onClick={() => handleResolveDispute('REFUND_CITIZEN')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  Full Refund to Citizen (₹{selectedDispute.escrowAmountINR})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

