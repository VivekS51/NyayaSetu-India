export interface ProviderSummary {
  id: string;
  fullName: string;
  providerType: 'ADVOCATE' | 'NOTARY' | 'MEDIATOR' | 'ARBITRATOR' | 'DOCUMENT_WRITER';
  stateBarCouncil?: string;
  barRegistrationNo?: string;
  notaryAppointmentNo?: string;
  primaryCourt: string;
  district: string;
  state: string;
  experienceYears: number;
  practiceAreas: string[];
  languagesSpoken: string[];
  consultationFeeINR: number;
  isAvailableForProBono: boolean;
  verificationStatus: 'APPROVED' | 'PENDING' | 'UNDER_REVIEW';
  tier: {
    level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    name: string;
  };
  badges: Array<{
    code: string;
    title: string;
  }>;
  rating: number;
  totalConsultations: number;
  bio: string;
}

export const MOCK_PROVIDERS: ProviderSummary[] = [
  {
    id: 'prof-lsp-003',
    fullName: 'Adv. Rajesh Varma',
    providerType: 'ADVOCATE',
    stateBarCouncil: 'Bar Council of Delhi',
    barRegistrationNo: 'D/1428/2012',
    primaryCourt: 'Delhi High Court & Tis Hazari District Courts',
    district: 'Central Delhi',
    state: 'Delhi',
    experienceYears: 14,
    practiceAreas: ['Civil Litigation', 'Property & Revenue Disputes', 'Consumer Protection', 'Cyber Law'],
    languagesSpoken: ['en', 'hi', 'pa'],
    consultationFeeINR: 800,
    isAvailableForProBono: true,
    verificationStatus: 'APPROVED',
    tier: {
      level: 'SILVER',
      name: 'Silver Advocate',
    },
    badges: [
      { code: 'VERIFIED_PROVIDER', title: 'Bar Council Verified' },
      { code: 'FOUNDING_MEMBER', title: 'Founding Member' },
    ],
    rating: 4.9,
    totalConsultations: 142,
    bio: 'Practicing advocate at Delhi High Court with over 14 years of courtroom experience in property title disputes, inheritance partitions, and consumer disputes. Committed to accessible justice.',
  },
  {
    id: 'prof-lsp-004',
    fullName: 'Adv. Harpreet Singh',
    providerType: 'ADVOCATE',
    stateBarCouncil: 'Bar Council of Punjab & Haryana',
    barRegistrationNo: 'P/2491/2016',
    primaryCourt: 'Amritsar District & Sessions Court',
    district: 'Amritsar',
    state: 'Punjab',
    experienceYears: 10,
    practiceAreas: ['Revenue & Land Matters', 'Family Law', 'Arbitration'],
    languagesSpoken: ['pa', 'hi', 'en'],
    consultationFeeINR: 600,
    isAvailableForProBono: true,
    verificationStatus: 'APPROVED',
    tier: {
      level: 'SILVER',
      name: 'Silver Advocate',
    },
    badges: [
      { code: 'VERIFIED_PROVIDER', title: 'Bar Council Verified' },
      { code: 'LEGAL_AID_CHAMPION', title: 'DLSA Legal Aid Volunteer' },
    ],
    rating: 4.8,
    totalConsultations: 98,
    bio: 'Practicing advocate at District Courts Amritsar with focus on agricultural land partitions, mutation appeals, and family settlements.',
  },
  {
    id: 'prof-lsp-005',
    fullName: 'Shri Ramesh Chawla',
    providerType: 'NOTARY',
    notaryAppointmentNo: 'NOTARY/GOI/DL/8821',
    primaryCourt: 'Patiala House Courts & Tehsil Sub-Registrar',
    district: 'New Delhi',
    state: 'Delhi',
    experienceYears: 18,
    practiceAreas: ['Statutory Affidavits', 'Power of Attorney', 'Notarial Attestation', 'Commercial Agreements'],
    languagesSpoken: ['hi', 'en'],
    consultationFeeINR: 250,
    isAvailableForProBono: false,
    verificationStatus: 'APPROVED',
    tier: {
      level: 'GOLD',
      name: 'Gold Practitioner',
    },
    badges: [{ code: 'VERIFIED_PROVIDER', title: 'Gazette Commissioned Notary' }],
    rating: 4.9,
    totalConsultations: 310,
    bio: 'Government of India appointed Notary Public. Strict adherence to Notaries Act 1952 statutory fee schedule.',
  },
  {
    id: 'prof-lsp-006',
    fullName: 'Adv. Meenakshi Sundaram',
    providerType: 'MEDIATOR',
    stateBarCouncil: 'Bar Council of Tamil Nadu & Puducherry',
    barRegistrationNo: 'TN/892/2008',
    primaryCourt: 'Madras High Court Mediation Centre',
    district: 'Chennai',
    state: 'Tamil Nadu',
    experienceYears: 16,
    practiceAreas: ['Commercial Mediation', 'Family Dispute Conciliation', 'Mediation Act 2023'],
    languagesSpoken: ['en', 'ta', 'hi'],
    consultationFeeINR: 1200,
    isAvailableForProBono: true,
    verificationStatus: 'APPROVED',
    tier: {
      level: 'PLATINUM',
      name: 'Platinum Senior Fellow',
    },
    badges: [
      { code: 'VERIFIED_PROVIDER', title: 'Accredited Mediator' },
      { code: 'FOUNDING_MEMBER', title: 'Founding Member' },
    ],
    rating: 5.0,
    totalConsultations: 220,
    bio: 'Court-annexed mediator trained under Mediation Act 2023 guidelines. Specializes in amicable pre-litigation commercial and family settlement.',
  },
];

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'VERIFICATION' | 'BOOKING' | 'ESCROW' | 'DISPUTE' | 'INCENTIVE' | 'SYSTEM';
  metadata?: any;
  isRead: boolean;
  createdAt: string;
}

export interface AdminAnalyticsData {
  summaryCards: {
    totalCitizens: number;
    totalProviders: number;
    activeEscrowHeldINR: number;
    totalSettledEarningsINR: number;
    platformTechFeeRevenueINR: number;
    gstCollectedINR: number;
    activeDisputes: number;
    averageClientRating: number;
    proBonoLegalAidSessions: number;
  };
  onboardingFunnel: {
    totalRegistered: number;
    overallConversionPercent: number;
    stages: Array<{ stage: string; count: number; dropOffPercent: number }>;
  };
  financialTelemetry: {
    totalGMV: number;
    activeEscrowHeld: number;
    settledProviderEarnings: number;
    platformRevenue: number;
    gstCollected: number;
  };
  providerCategories: {
    advocates: number;
    notaries: number;
    arbitrators: number;
    mediators: number;
    documentWriters: number;
    legalConsultants: number;
  };
  incentiveEngine: {
    totalPointsAwarded: number;
    totalPointsRedeemed: number;
    inCirculationPoints: number;
    tierBreakdown: { bronze: number; silver: number; gold: number; platinum: number };
    rules: Array<{
      ruleId: string;
      ruleCode: string;
      name: string;
      category: string;
      abGroup: string;
      pointsAwarded: number;
      isActive: boolean;
      timesTriggered: number;
      totalPointsIssued: number;
    }>;
  };
  trustAndDisputes: {
    totalBookings: number;
    totalDisputes: number;
    pendingDisputes: number;
    resolvedDisputes: number;
    disputeRatePercent: number;
    averageRating: number;
  };
}

export interface DisputeItem {
  id: string;
  bookingId: string;
  bookingReference: string;
  serviceTitle: string;
  escrowAmountINR: number;
  providerEarningsINR: number;
  raisedBy: { id?: string; name: string; phone?: string };
  provider: { id?: string; name: string; providerType?: string };
  reasonCode: string;
  description: string;
  status: string;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  diffPayload?: any;
  createdAt: string;
}

export const getApiBaseUrl = (): string => {
  // If explicitly configured with a non-localhost remote URL, use that
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl && !envUrl.includes('localhost:5000') && !envUrl.includes('127.0.0.1:5000')) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
  }
  // When running in the browser on a deployed domain (like *.vercel.app or custom domain),
  // use relative '/api/v1' so requests are proxied by Next.js rewrites with zero CORS issues
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export class ApiClient {
  public static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('nyayasetu_token');
  }

  public static setSession(token: string, user: any) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('nyayasetu_token', token);
    localStorage.setItem('nyayasetu_user', JSON.stringify(user));
  }

  public static getStoredUser(): any | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('nyayasetu_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  public static clearSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('nyayasetu_token');
    localStorage.removeItem('nyayasetu_user');
  }

  public static async fetchProviders(filters?: {
    providerType?: string;
    state?: string;
    district?: string;
    practiceArea?: string;
    language?: string;
    query?: string;
  }): Promise<ProviderSummary[]> {
    try {
      const token = this.getToken();
      const params = new URLSearchParams();
      if (filters?.providerType) params.append('providerType', filters.providerType);
      if (filters?.state) params.append('state', filters.state);
      if (filters?.practiceArea) params.append('practiceArea', filters.practiceArea);
      if (filters?.language) params.append('language', filters.language);
      if (filters?.query) params.append('q', filters.query);

      const res = await fetch(`${API_BASE_URL}/discovery/providers?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) return json.data;
      }
    } catch {
      // Fallback to local verified dataset
    }

    // Filter local mock data
    return MOCK_PROVIDERS.filter((p) => {
      if (filters?.providerType && filters.providerType !== 'ALL' && p.providerType !== filters.providerType) {
        return false;
      }
      if (filters?.state && filters.state !== 'ALL' && p.state.toLowerCase() !== filters.state.toLowerCase()) {
        return false;
      }
      if (filters?.language && filters.language !== 'ALL' && !p.languagesSpoken.includes(filters.language)) {
        return false;
      }
      if (
        filters?.practiceArea &&
        filters.practiceArea !== 'ALL' &&
        !p.practiceAreas.some((pa) => pa.toLowerCase().includes(filters.practiceArea!.toLowerCase()))
      ) {
        return false;
      }
      if (filters?.query) {
        const q = filters.query.toLowerCase();
        const matchesName = p.fullName.toLowerCase().includes(q);
        const matchesCourt = p.primaryCourt.toLowerCase().includes(q);
        const matchesBio = p.bio.toLowerCase().includes(q);
        const matchesPractice = p.practiceAreas.some((pa) => pa.toLowerCase().includes(q));
        if (!matchesName && !matchesCourt && !matchesBio && !matchesPractice) return false;
      }
      return true;
    });
  }

  public static async getProviderById(id: string): Promise<ProviderSummary | null> {
    const found = MOCK_PROVIDERS.find((p) => p.id === id);
    return found || null;
  }

  // =========================================================================
  // Notifications APIs
  // =========================================================================
  public static async fetchNotifications(): Promise<{ items: AppNotification[]; unreadCount: number }> {
    try {
      const token = this.getToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) return json.data;
        }
      }
    } catch {
      // Fallback below
    }

    // Default mock notifications for instant interactive demo
    return {
      items: [
        {
          id: 'notif-admin-01',
          userId: 'usr-admin-001',
          title: 'New LSP Verification Request',
          message: 'Adv. Meenakshi Sundaram has submitted credentials (MS/2391/2016) for administrative review.',
          type: 'VERIFICATION',
          isRead: false,
          createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        },
        {
          id: 'notif-admin-02',
          userId: 'usr-admin-001',
          title: 'Escrow Dispute Flagged: #DISP-2026-001',
          message: 'Citizen Sunita Devi flagged Booking IN-LEG-2026-X90 under PROVIDER_NO_SHOW. Escrow ₹409 is held.',
          type: 'DISPUTE',
          isRead: false,
          createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        },
        {
          id: 'notif-lsp-01',
          userId: 'usr-lsp-003',
          title: 'Escrow Released: ₹800.00',
          message: 'Escrow for booking IN-LEG-2026-X89 has been settled into your platform wallet.',
          type: 'ESCROW',
          isRead: true,
          createdAt: new Date(Date.now() - 23 * 3600 * 1000).toISOString(),
        },
        {
          id: 'notif-lsp-02',
          userId: 'usr-lsp-003',
          title: 'Founding Member Badge Unlocked',
          message: 'Congratulations! You have received the early adopter founding member badge with 250 incentive points.',
          type: 'INCENTIVE',
          isRead: false,
          createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        },
      ],
      unreadCount: 3,
    };
  }

  public static async markNotificationRead(id: string): Promise<boolean> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    return true;
  }

  public static async markAllNotificationsRead(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/notifications/read-all`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    return true;
  }

  // =========================================================================
  // Admin & GovTech Analytics APIs
  // =========================================================================
  public static async fetchAdminAnalytics(): Promise<AdminAnalyticsData> {
    try {
      const token = this.getToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/admin/analytics/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) return json.data;
        }
      }
    } catch {
      // Fallback below
    }

    return {
      summaryCards: {
        totalCitizens: 1842,
        totalProviders: 326,
        activeEscrowHeldINR: 84500,
        totalSettledEarningsINR: 524000,
        platformTechFeeRevenueINR: 41250,
        gstCollectedINR: 7425,
        activeDisputes: 2,
        averageClientRating: 4.8,
        proBonoLegalAidSessions: 58,
      },
      onboardingFunnel: {
        totalRegistered: 480,
        overallConversionPercent: 68,
        stages: [
          { stage: '1. Registered (Mobile OTP)', count: 480, dropOffPercent: 0 },
          { stage: '2. Professional Details Filled', count: 410, dropOffPercent: 15 },
          { stage: '3. Credentials Uploaded', count: 375, dropOffPercent: 9 },
          { stage: '4. Verification Submitted', count: 350, dropOffPercent: 7 },
          { stage: '5. Admin Verified (BCI/Notary)', count: 326, dropOffPercent: 7 },
          { stage: '6. First Consultation Completed', count: 284, dropOffPercent: 13 },
        ],
      },
      financialTelemetry: {
        totalGMV: 657175,
        activeEscrowHeld: 84500,
        settledProviderEarnings: 524000,
        platformRevenue: 41250,
        gstCollected: 7425,
      },
      providerCategories: {
        advocates: 215,
        notaries: 48,
        arbitrators: 24,
        mediators: 21,
        documentWriters: 12,
        legalConsultants: 6,
      },
      incentiveEngine: {
        totalPointsAwarded: 142500,
        totalPointsRedeemed: 68200,
        inCirculationPoints: 74300,
        tierBreakdown: { bronze: 140, silver: 110, gold: 52, platinum: 24 },
        rules: [
          {
            ruleId: 'rule-profile-01',
            ruleCode: 'RULE_PROFILE_COMPLETION',
            name: 'Complete Professional Profile Wizard',
            category: 'ONBOARDING',
            abGroup: 'ALL',
            pointsAwarded: 50,
            isActive: true,
            timesTriggered: 375,
            totalPointsIssued: 18750,
          },
          {
            ruleId: 'rule-verification-02',
            ruleCode: 'RULE_VERIFICATION_APPROVED',
            name: 'Official Bar Council Verification Approval',
            category: 'ONBOARDING',
            abGroup: 'ALL',
            pointsAwarded: 100,
            isActive: true,
            timesTriggered: 326,
            totalPointsIssued: 32600,
          },
          {
            ruleId: 'rule-pro-bono-03',
            ruleCode: 'RULE_PRO_BONO_COMPLETED',
            name: 'Completed Pro-Bono or Legal Aid Case',
            category: 'LEGAL_AID',
            abGroup: 'A',
            pointsAwarded: 75,
            isActive: true,
            timesTriggered: 58,
            totalPointsIssued: 4350,
          },
          {
            ruleId: 'rule-referral-04',
            ruleCode: 'RULE_PROVIDER_REFERRAL',
            name: 'Refer Verified Colleague Advocate',
            category: 'REFERRAL',
            abGroup: 'B',
            pointsAwarded: 50,
            isActive: true,
            timesTriggered: 84,
            totalPointsIssued: 4200,
          },
          {
            ruleId: 'rule-high-rating-05',
            ruleCode: 'RULE_HIGH_RATING_SERVICE',
            name: '5-Star Verified Client Review Bonus',
            category: 'QUALITY',
            abGroup: 'ALL',
            pointsAwarded: 25,
            isActive: true,
            timesTriggered: 412,
            totalPointsIssued: 10300,
          },
        ],
      },
      trustAndDisputes: {
        totalBookings: 825,
        totalDisputes: 15,
        pendingDisputes: 2,
        resolvedDisputes: 13,
        disputeRatePercent: 1.8,
        averageRating: 4.8,
      },
    };
  }

  public static async fetchAdminVerificationQueue(): Promise<any[]> {
    try {
      const token = this.getToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/admin/verification/queue`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) return json.data;
        }
      }
    } catch {}

    return [
      {
        requestId: 'vreq-pending-002',
        providerProfileId: 'prof-lsp-004',
        providerName: 'Adv. Meenakshi Sundaram',
        phone: '+919840112233',
        email: 'meenakshi.sundaram@madrasbar.org.in',
        providerType: 'ADVOCATE',
        stateBarCouncil: 'Bar Council of Tamil Nadu & Puducherry',
        barRegistrationNo: 'MS/2391/2016',
        state: 'Tamil Nadu',
        district: 'Chennai',
        status: 'PENDING',
        submittedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        credentialsCount: 1,
        ocrPayload: { barCouncilMatch: true, extractedName: 'Meenakshi Sundaram', extractedEnrolment: 'MS/2391/2016', confidenceScore: 0.96 },
      },
      {
        requestId: 'vreq-pending-003',
        providerProfileId: 'prof-lsp-005',
        providerName: 'Sh. Harpreet Singh',
        phone: '+919814055667',
        email: 'h.singh.notary@punjab.gov.in',
        providerType: 'NOTARY',
        stateBarCouncil: 'Bar Council of Punjab & Haryana',
        barRegistrationNo: 'PH/5120/2014',
        notaryAppointmentNo: 'NOT-PB-8841-2018',
        state: 'Punjab',
        district: 'Jalandhar',
        status: 'PENDING',
        submittedAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
        credentialsCount: 2,
        ocrPayload: { barCouncilMatch: true, extractedName: 'Harpreet Singh', confidenceScore: 0.94 },
      },
    ];
  }

  public static async processVerificationDecision(
    profileId: string,
    action: 'APPROVE' | 'REJECT',
    reasonCode?: string,
    reviewNotes?: string
  ): Promise<boolean> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/admin/verification/${profileId}/decide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action, reasonCode, reviewNotes }),
        });
      }
    } catch {}
    return true;
  }

  public static async fetchAdminDisputes(): Promise<DisputeItem[]> {
    try {
      const token = this.getToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/admin/disputes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.items) return json.data.items;
        }
      }
    } catch {}

    return [
      {
        id: 'disp-seed-001',
        bookingId: 'bk-seed-002',
        bookingReference: 'IN-LEG-2026-X90',
        serviceTitle: 'Urgent Affidavit Attestation for Pension Benefit',
        escrowAmountINR: 409,
        providerEarningsINR: 350,
        raisedBy: { id: 'usr-citizen-002', name: 'Sunita Devi', phone: '+919812345678' },
        provider: { id: 'usr-lsp-notary-005', name: 'Harpreet Singh (Notary Public)', providerType: 'NOTARY' },
        reasonCode: 'PROVIDER_NO_SHOW',
        description: 'The notary did not attend the scheduled online video session for affidavit attestation. I waited 25 minutes. Kindly refund the escrow payment.',
        status: 'PENDING_ADMIN_REVIEW',
        createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
      {
        id: 'disp-seed-002',
        bookingId: 'bk-seed-003',
        bookingReference: 'IN-LEG-2026-X77',
        serviceTitle: 'Commercial Lease Agreement Drafting',
        escrowAmountINR: 1559,
        providerEarningsINR: 1500,
        raisedBy: { id: 'usr-citizen-005', name: 'Ramanathan Iyer', phone: '+919884019283' },
        provider: { id: 'usr-lsp-003', name: 'Adv. Rajesh Varma', providerType: 'ADVOCATE' },
        reasonCode: 'SERVICE_QUALITY_DISPUTE',
        description: 'Draft delivered had conflicting indemnity clauses not aligned with Indian Contract Act 1872.',
        status: 'RESOLVED_SETTLED',
        resolutionNotes: 'Provider submitted revised amended lease draft satisfying citizen requirements.',
        resolvedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      },
    ];
  }

  public static async resolveAdminDispute(
    disputeId: string,
    action: 'REFUND_CITIZEN' | 'RELEASE_TO_PROVIDER',
    resolutionNotes: string
  ): Promise<boolean> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/admin/disputes/${disputeId}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action, resolutionNotes }),
        });
      }
    } catch {}
    return true;
  }

  public static async fetchAdminIncentiveRules(): Promise<any[]> {
    try {
      const token = this.getToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/admin/incentive-rules`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) return json.data;
        }
      }
    } catch {}

    const data = await this.fetchAdminAnalytics();
    return data.incentiveEngine.rules;
  }

  public static async updateAdminIncentiveRule(
    ruleId: string,
    updates: { pointsAwarded?: number; isActive?: boolean; abTestGroup?: string }
  ): Promise<boolean> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/admin/incentive-rules/${ruleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(updates),
        });
      }
    } catch {}
    return true;
  }

  public static async fetchAdminAuditLogs(): Promise<AuditLogItem[]> {
    try {
      const token = this.getToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/admin/audit-logs?limit=25`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.items) return json.data.items;
        }
      }
    } catch {}

    return [
      {
        id: 'audit-log-001',
        userId: 'usr-citizen-002',
        action: 'DPDP_CONSENT_RECORDED',
        resourceType: 'USER_CONSENT',
        resourceId: 'usr-citizen-002',
        ipAddress: '103.212.145.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        diffPayload: { consentType: 'DPDP_ACT_2023_DATA_PROCESSING', version: '2024.1', granted: true },
        createdAt: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
      },
      {
        id: 'audit-log-002',
        userId: 'usr-lsp-pending-004',
        action: 'VERIFICATION_DOSSIER_SUBMITTED',
        resourceType: 'PROVIDER_PROFILE',
        resourceId: 'prof-lsp-004',
        ipAddress: '49.207.180.25',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        diffPayload: { enrolment: 'MS/2391/2016', barCouncil: 'Bar Council of Tamil Nadu & Puducherry' },
        createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
      {
        id: 'audit-log-003',
        userId: 'usr-citizen-002',
        action: 'ESCROW_FUNDS_LOCKED',
        resourceType: 'PAYMENT_ESCROW',
        resourceId: 'pay-seed-002',
        ipAddress: '103.212.145.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        diffPayload: { bookingId: 'bk-seed-002', amountINR: 409, gateway: 'UPI' },
        createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      },
      {
        id: 'audit-log-004',
        userId: 'usr-admin-001',
        action: 'DISPUTE_REFUND_CITIZEN',
        resourceType: 'DISPUTE',
        resourceId: 'disp-seed-001',
        ipAddress: '103.212.145.10',
        diffPayload: { amountINR: 409, reason: 'Provider no-show confirmed' },
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    ];
  }
}


