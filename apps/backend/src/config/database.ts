import { RoleType, ProviderType, VerificationStatus, CredentialType, TierLevel, AccountStatus, PointsType } from '../common/types';
import bcrypt from 'bcryptjs';
import { resetAllRateLimiters } from '../common/middleware/rate-limiter.middleware';

// In-Memory resilient database store for zero-dependency testability & offline execution
export interface UserRecord {
  id: string;
  phone: string;
  email: string | null;
  passwordHash: string;
  fullName: string;
  avatarUrl?: string | null;
  preferredLanguage: string;
  status: AccountStatus;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleRecord {
  id: string;
  userId: string;
  role: RoleType;
  createdAt: Date;
}

export interface ProviderProfileRecord {
  id: string;
  userId: string;
  providerType: ProviderType;
  enrolmentYear: number | null;
  stateBarCouncil: string | null;
  barRegistrationNo: string | null;
  notaryAppointmentNo: string | null;
  primaryCourt: string | null;
  district: string;
  state: string;
  pincode: string;
  experienceYears: number;
  languagesSpoken: string[];
  practiceAreas: string[];
  bio: string | null;
  consultationFeeINR: number;
  isAvailableForProBono: boolean;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  verifiedAt: Date | null;
  complianceAccepted: boolean;
  complianceAcceptedAt: Date | null;
  totalPoints: number;
  tierId: string | null;
  referredByProfileId?: string | null;
  referralCode?: string | null;
  isReferralQualified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderCredentialRecord {
  id: string;
  providerProfileId: string;
  credentialType: CredentialType;
  certificateNumber: string;
  issuingAuthority: string;
  documentUrl: string;
  validFrom: Date | null;
  validUntil: Date | null;
  isVerified: boolean;
  createdAt: Date;
}

export interface VerificationRequestRecord {
  id: string;
  providerProfileId: string;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedByUserId: string | null;
  status: VerificationStatus;
  reviewNotes: string | null;
  ocrPayload?: any;
}

export interface TierRecord {
  id: string;
  level: TierLevel;
  name: string;
  minPoints: number;
  platformFeeDiscountPercent: number;
  prioritySupportLevel: number;
  freeEsignCreditsMonthly: number;
  perks: any;
  createdAt: Date;
}

export interface BadgeRecord {
  id: string;
  code: string;
  title: string;
  description: string;
  iconSlug: string;
  isSystemIssued: boolean;
  createdAt: Date;
}

export interface ProviderBadgeRecord {
  id: string;
  providerProfileId: string;
  badgeId: string;
  awardedAt: Date;
  metadata?: any;
}

export interface WalletRecord {
  id: string;
  userId: string;
  monetaryBalanceINR: number;
  rewardPointsBalance: number;
  updatedAt: Date;
}

export interface PointsLedgerRecord {
  id: string;
  walletId: string;
  incentiveEventId?: string | null;
  points: number;
  type: PointsType;
  referenceType: string;
  referenceId: string;
  description: string;
  balanceAfter: number;
  createdAt: Date;
}

export interface IncentiveRuleRecord {
  id: string;
  ruleCode: string;
  name: string;
  triggerEvent: string;
  pointsAwarded: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date | null;
  eligibilityCriteria?: any;
  abTestGroup?: 'A' | 'B' | 'ALL';
  category?: string;
  timesTriggered?: number;
  createdAt: Date;
}

export interface AuditLogRecord {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string | null;
  userAgent: string | null;
  diffPayload: any;
  createdAt: Date;
}

export interface BookingRecord {
  id: string;
  bookingReference: string;
  citizenId: string;
  providerProfileId: string;
  serviceId?: string;
  serviceTitle: string;
  deliveryMode: any;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  bookingStatus: any;
  totalAmountINR: number;
  platformFeeINR: number;
  gstAmountINR: number;
  providerEarningsINR: number;
  cancellationReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  amountINR: number;
  status: any;
  gateway: any;
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  escrowCapturedAt?: Date | null;
  escrowReleasedAt?: Date | null;
  refundedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  subTotalINR: number;
  cgstAmountINR: number;
  sgstAmountINR: number;
  totalAmountINR: number;
  sacCode?: string;
  platformGstNumber?: string;
  providerEarningsINR?: number;
  platformFeeINR?: number;
  statutoryNote?: string;
  issuedAt: Date;
}

export interface ConversationRecord {
  id: string;
  bookingId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  senderUserId: string;
  content: string;
  isRead: boolean;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  isAadhaarSigned?: boolean;
  sentAt: Date;
}

export interface ReviewRecord {
  id: string;
  bookingId: string;
  citizenId: string;
  providerProfileId: string;
  rating: number;
  feedbackText: string | null;
  providerResponse: string | null;
  isFlagged: boolean;
  isVerifiedBooking: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisputeRecord {
  id: string;
  bookingId: string;
  raisedByUserId: string;
  reasonCode: string;
  description: string;
  status: any;
  resolutionNotes: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'VERIFICATION' | 'BOOKING' | 'ESCROW' | 'DISPUTE' | 'INCENTIVE' | 'SYSTEM';
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export interface CommunicationLogRecord {
  id: string;
  userId: string;
  channel: 'SMS' | 'EMAIL' | 'IN_APP';
  recipient: string;
  template: string;
  subject?: string;
  content: string;
  status: 'DELIVERED' | 'QUEUED';
  sentAt: Date;
}

export interface LegalCategoryRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  applicableProviderTypes: ProviderType[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class DatabaseStore {
  private static instance: DatabaseStore;

  public users: UserRecord[] = [];
  public userRoles: UserRoleRecord[] = [];
  public categories: LegalCategoryRecord[] = [];
  public providerProfiles: ProviderProfileRecord[] = [];
  public providerCredentials: ProviderCredentialRecord[] = [];
  public verificationRequests: VerificationRequestRecord[] = [];
  public tiers: TierRecord[] = [];
  public badges: BadgeRecord[] = [];
  public providerBadges: ProviderBadgeRecord[] = [];
  public wallets: WalletRecord[] = [];
  public pointsLedger: PointsLedgerRecord[] = [];
  public incentiveRules: IncentiveRuleRecord[] = [];
  public auditLogs: AuditLogRecord[] = [];
  public bookings: BookingRecord[] = [];
  public payments: PaymentRecord[] = [];
  public invoices: InvoiceRecord[] = [];
  public conversations: ConversationRecord[] = [];
  public messages: MessageRecord[] = [];
  public reviews: ReviewRecord[] = [];
  public disputes: DisputeRecord[] = [];
  public notifications: NotificationRecord[] = [];
  public communicationLogs: CommunicationLogRecord[] = [];
  public otps: Map<string, { code: string; expiresAt: Date; attempts: number; lastSentAt?: Date }> = new Map();
  public revokedTokens: Set<string> = new Set();
  public loginAttempts: Map<string, { count: number; lockedUntil: Date | null }> = new Map();
  public processedWebhookEvents: Set<string> = new Set();

  private constructor() {
    this.seedDefaultData();
  }

  public static getInstance(): DatabaseStore {
    if (!DatabaseStore.instance) {
      DatabaseStore.instance = new DatabaseStore();
    }
    return DatabaseStore.instance;
  }

  public resetToDefault(): void {
    this.users = [];
    this.userRoles = [];
    this.categories = [];
    this.providerProfiles = [];
    this.providerCredentials = [];
    this.verificationRequests = [];
    this.tiers = [];
    this.badges = [];
    this.providerBadges = [];
    this.wallets = [];
    this.pointsLedger = [];
    this.incentiveRules = [];
    this.auditLogs = [];
    this.bookings = [];
    this.payments = [];
    this.invoices = [];
    this.conversations = [];
    this.messages = [];
    this.reviews = [];
    this.disputes = [];
    this.notifications = [];
    this.communicationLogs = [];
    this.otps.clear();
    this.revokedTokens.clear();
    this.loginAttempts.clear();
    this.processedWebhookEvents.clear();
    resetAllRateLimiters();
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);
    const now = new Date();

    // 1. Seed Tiers
    this.tiers = [
      {
        id: 'tier-bronze-01',
        level: TierLevel.BRONZE,
        name: 'Bronze Counsel',
        minPoints: 0,
        platformFeeDiscountPercent: 0,
        prioritySupportLevel: 1,
        freeEsignCreditsMonthly: 2,
        perks: ['Standard Directory Listing', 'Basic Chat Consultation'],
        createdAt: now,
      },
      {
        id: 'tier-silver-02',
        level: TierLevel.SILVER,
        name: 'Silver Advocate',
        minPoints: 100,
        platformFeeDiscountPercent: 2.5,
        prioritySupportLevel: 2,
        freeEsignCreditsMonthly: 5,
        perks: ['Enhanced Directory Placement', '5 Free Aadhaar eSigns/mo', 'Weekend Slot Badging'],
        createdAt: now,
      },
      {
        id: 'tier-gold-03',
        level: TierLevel.GOLD,
        name: 'Gold Practitioner',
        minPoints: 300,
        platformFeeDiscountPercent: 5.0,
        prioritySupportLevel: 3,
        freeEsignCreditsMonthly: 15,
        perks: ['Gold Badge', '15 Free eSigns/mo', 'Pro-bono Legal Aid Coordinator Access'],
        createdAt: now,
      },
      {
        id: 'tier-platinum-04',
        level: TierLevel.PLATINUM,
        name: 'Platinum Senior Fellow',
        minPoints: 600,
        platformFeeDiscountPercent: 10.0,
        prioritySupportLevel: 4,
        freeEsignCreditsMonthly: 50,
        perks: ['Platinum Star Seal', 'Unlimited eSigns', 'CPD Masterclass Host', 'Direct DLSA Referral Pipeline'],
        createdAt: now,
      },
    ];

    // 2. Seed Badges
    this.badges = [
      {
        id: 'badge-verified-01',
        code: 'VERIFIED_PROVIDER',
        title: 'Bar Council / Gazette Verified',
        description: 'Identity, Enrolment Certificate and Certificate of Practice independently verified.',
        iconSlug: 'verified-shield',
        isSystemIssued: true,
        createdAt: now,
      },
      {
        id: 'badge-early-adopter-02',
        code: 'FOUNDING_MEMBER',
        title: 'Founding Member / Early Adopter',
        description: 'Joined during national digital marketplace launch phase.',
        iconSlug: 'founding-star',
        isSystemIssued: true,
        createdAt: now,
      },
      {
        id: 'badge-pro-bono-03',
        code: 'LEGAL_AID_CHAMPION',
        title: 'DLSA Legal Aid Champion',
        description: 'Completed 5+ pro-bono consultations for underprivileged citizens.',
        iconSlug: 'hand-heart',
        isSystemIssued: true,
        createdAt: now,
      },
    ];

    // 2.5 Seed Legal Categories
    this.categories = [
      {
        id: 'cat-civil-01',
        code: 'CIVIL_LITIGATION',
        name: 'Civil Litigation & Property Disputes',
        description: 'Land title verification, partition suits, recovery suits, and civil appeals.',
        applicableProviderTypes: [ProviderType.ADVOCATE, ProviderType.DOCUMENT_WRITER],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-family-02',
        code: 'FAMILY_MATRIMONIAL',
        name: 'Family Law & Matrimonial Matters',
        description: 'Mutual consent divorce, maintenance petitions, child custody, and family settlements.',
        applicableProviderTypes: [ProviderType.ADVOCATE, ProviderType.MEDIATOR],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-notarial-03',
        code: 'NOTARIAL_AFFIDAVIT',
        name: 'Notarial Attestation & Affidavits',
        description: 'General power of attorney attestation, sworn affidavits, and gazette notarial verifications.',
        applicableProviderTypes: [ProviderType.NOTARY],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-arbitration-04',
        code: 'ARBITRATION_MEDIATION',
        name: 'Arbitration & Commercial Dispute Resolution',
        description: 'Alternative dispute resolution under Arbitration & Conciliation Act 1996.',
        applicableProviderTypes: [ProviderType.ARBITRATOR, ProviderType.MEDIATOR],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // 3. Seed Incentive Rules
    this.incentiveRules = [
      {
        id: 'rule-profile-01',
        ruleCode: 'RULE_PROFILE_COMPLETION',
        name: 'Complete Professional Profile Wizard',
        triggerEvent: 'PROFILE_COMPLETION',
        pointsAwarded: 50,
        isActive: true,
        validFrom: now,
        validUntil: null,
        category: 'ONBOARDING',
        abTestGroup: 'ALL',
        timesTriggered: 124,
        createdAt: now,
      },
      {
        id: 'rule-verification-02',
        ruleCode: 'RULE_VERIFICATION_APPROVED',
        name: 'Official Bar Council Verification Approval',
        triggerEvent: 'VERIFICATION_APPROVED',
        pointsAwarded: 100,
        isActive: true,
        validFrom: now,
        validUntil: null,
        category: 'ONBOARDING',
        abTestGroup: 'ALL',
        timesTriggered: 89,
        createdAt: now,
      },
      {
        id: 'rule-pro-bono-03',
        ruleCode: 'RULE_PRO_BONO_COMPLETED',
        name: 'Completed Pro-Bono or Legal Aid Case',
        triggerEvent: 'PRO_BONO_CASE_COMPLETED',
        pointsAwarded: 75,
        isActive: true,
        validFrom: now,
        validUntil: null,
        category: 'LEGAL_AID',
        abTestGroup: 'A',
        timesTriggered: 46,
        createdAt: now,
      },
      {
        id: 'rule-referral-04',
        ruleCode: 'RULE_PROVIDER_REFERRAL',
        name: 'Refer Verified Colleague Advocate',
        triggerEvent: 'PROVIDER_REFERRAL_SUCCESS',
        pointsAwarded: 50,
        isActive: true,
        validFrom: now,
        validUntil: null,
        category: 'REFERRAL',
        abTestGroup: 'B',
        timesTriggered: 31,
        createdAt: now,
      },
      {
        id: 'rule-high-rating-05',
        ruleCode: 'RULE_HIGH_RATING_SERVICE',
        name: '5-Star Verified Client Review Bonus',
        triggerEvent: 'RATING_5_STAR_RECEIVED',
        pointsAwarded: 25,
        isActive: true,
        validFrom: now,
        validUntil: null,
        category: 'QUALITY',
        abTestGroup: 'ALL',
        timesTriggered: 78,
        createdAt: now,
      },
      {
        id: 'rule-fast-response-06',
        ruleCode: 'RULE_FAST_RESPONSE_RATE',
        name: 'Fast Client Response Rate (< 15 mins)',
        triggerEvent: 'FAST_RESPONSE_RATE',
        pointsAwarded: 20,
        isActive: true,
        validFrom: now,
        validUntil: null,
        category: 'QUALITY',
        abTestGroup: 'ALL',
        timesTriggered: 52,
        createdAt: now,
      },
      {
        id: 'rule-booking-completed-07',
        ruleCode: 'RULE_BOOKING_COMPLETED',
        name: 'Completed Legal Consultation',
        triggerEvent: 'BOOKING_COMPLETED',
        pointsAwarded: 25,
        isActive: true,
        validFrom: now,
        validUntil: null,
        category: 'ACTIVITY',
        abTestGroup: 'ALL',
        timesTriggered: 110,
        createdAt: now,
      },
      {
        id: 'rule-citizen-first-booking-08',
        ruleCode: 'RULE_CITIZEN_FIRST_BOOKING',
        name: 'Citizen First Consultation Reward',
        triggerEvent: 'CITIZEN_FIRST_BOOKING',
        pointsAwarded: 10,
        isActive: true,
        validFrom: now,
        validUntil: null,
        category: 'CITIZEN',
        abTestGroup: 'ALL',
        timesTriggered: 95,
        createdAt: now,
      },
    ];

    // 4. Seed Platform Users
    // Admin User
    const adminUser: UserRecord = {
      id: 'usr-admin-001',
      phone: '+919876543210',
      email: 'admin@legalmarketplace.gov.in',
      passwordHash: defaultPasswordHash,
      fullName: 'Smt. Priya Sharma (Joint Registrar)',
      preferredLanguage: 'en',
      status: AccountStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(adminUser);
    this.userRoles.push({
      id: 'role-admin-001',
      userId: adminUser.id,
      role: RoleType.ADMIN,
      createdAt: now,
    });
    this.userRoles.push({
      id: 'role-verifier-001',
      userId: adminUser.id,
      role: RoleType.VERIFIER,
      createdAt: now,
    });

    // Seed Citizen User
    const citizenUser: UserRecord = {
      id: 'usr-citizen-002',
      phone: '+919812345678',
      email: 'sunita.devi@example.in',
      passwordHash: defaultPasswordHash,
      fullName: 'Sunita Devi',
      preferredLanguage: 'hi',
      status: AccountStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(citizenUser);
    this.userRoles.push({
      id: 'role-citizen-002',
      userId: citizenUser.id,
      role: RoleType.CITIZEN,
      createdAt: now,
    });
    this.wallets.push({
      id: 'wallet-citizen-002',
      userId: citizenUser.id,
      monetaryBalanceINR: 0,
      rewardPointsBalance: 25,
      updatedAt: now,
    });

    // Seed Advocate Provider (Approved)
    const advocateUser: UserRecord = {
      id: 'usr-lsp-003',
      phone: '+919711223344',
      email: 'rajesh.varma@delhibar.org.in',
      passwordHash: defaultPasswordHash,
      fullName: 'Adv. Rajesh Varma',
      preferredLanguage: 'en',
      status: AccountStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(advocateUser);
    this.userRoles.push({
      id: 'role-lsp-003',
      userId: advocateUser.id,
      role: RoleType.LSP,
      createdAt: now,
    });

    const advocateProfile: ProviderProfileRecord = {
      id: 'prof-lsp-003',
      userId: advocateUser.id,
      providerType: ProviderType.ADVOCATE,
      enrolmentYear: 2012,
      stateBarCouncil: 'Bar Council of Delhi',
      barRegistrationNo: 'D/1428/2012',
      notaryAppointmentNo: null,
      primaryCourt: 'Delhi High Court & Tis Hazari District Courts',
      district: 'Central Delhi',
      state: 'Delhi',
      pincode: '110054',
      experienceYears: 14,
      languagesSpoken: ['en', 'hi', 'pa'],
      practiceAreas: ['Civil Litigation', 'Property & Revenue Disputes', 'Consumer Protection', 'Cyber Law'],
      bio: 'Practicing advocate at Delhi High Court with over 14 years of courtroom experience in property title disputes, inheritance partitions, and consumer disputes. Committed to accessible justice.',
      consultationFeeINR: 800.0,
      isAvailableForProBono: true,
      verificationStatus: VerificationStatus.APPROVED,
      rejectionReason: null,
      verifiedAt: now,
      complianceAccepted: true,
      complianceAcceptedAt: now,
      totalPoints: 250,
      tierId: 'tier-silver-02',
      createdAt: now,
      updatedAt: now,
    };
    this.providerProfiles.push(advocateProfile);

    // Give Advocate Credentials
    this.providerCredentials.push({
      id: 'cred-adv-001',
      providerProfileId: advocateProfile.id,
      credentialType: CredentialType.BAR_COUNCIL_ENROLMENT,
      certificateNumber: 'D/1428/2012',
      issuingAuthority: 'Bar Council of Delhi',
      documentUrl: 'https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com/credentials/d-1428-2012-enrolment.pdf',
      validFrom: new Date('2012-07-15'),
      validUntil: null,
      isVerified: true,
      createdAt: now,
    });

    // Bestow Badges
    this.providerBadges.push({
      id: 'pbadge-001',
      providerProfileId: advocateProfile.id,
      badgeId: 'badge-verified-01',
      awardedAt: now,
    });
    this.providerBadges.push({
      id: 'pbadge-002',
      providerProfileId: advocateProfile.id,
      badgeId: 'badge-early-adopter-02',
      awardedAt: now,
    });

    // Wallet for Advocate
    const advocateWallet: WalletRecord = {
      id: 'wallet-lsp-003',
      userId: advocateUser.id,
      monetaryBalanceINR: 4200.0,
      rewardPointsBalance: 250,
      updatedAt: now,
    };
    this.wallets.push(advocateWallet);

    this.pointsLedger.push({
      id: 'ledger-001',
      walletId: advocateWallet.id,
      points: 100,
      type: PointsType.CREDIT,
      referenceType: 'VERIFICATION',
      referenceId: advocateProfile.id,
      description: 'Awarded 100 points for successful Bar Council credential verification.',
      balanceAfter: 100,
      createdAt: now,
    });

    this.pointsLedger.push({
      id: 'ledger-002',
      walletId: advocateWallet.id,
      points: 150,
      type: PointsType.CREDIT,
      referenceType: 'PRO_BONO',
      referenceId: 'case-pb-102',
      description: 'Completed 2 pro-bono consultations under DLSA legal aid outreach.',
      balanceAfter: 250,
      createdAt: now,
    });

    // 5. Seed Completed Booking, Payment & Review
    const seedBookingId = 'bk-seed-001';
    const seedBooking: BookingRecord = {
      id: seedBookingId,
      bookingReference: 'IN-LEG-2026-X89',
      citizenId: citizenUser.id,
      providerProfileId: advocateProfile.id,
      serviceTitle: 'Land Title Search & Partition Consultation',
      deliveryMode: 'ONLINE_VIDEO',
      scheduledStartTime: new Date(Date.now() - 24 * 3600 * 1000),
      scheduledEndTime: new Date(Date.now() - 23.5 * 3600 * 1000),
      bookingStatus: 'COMPLETED',
      totalAmountINR: 859,
      platformFeeINR: 50,
      gstAmountINR: 9,
      providerEarningsINR: 800,
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 23 * 3600 * 1000),
    };
    this.bookings.push(seedBooking);

    this.payments.push({
      id: 'pay-seed-001',
      bookingId: seedBookingId,
      amountINR: 859,
      status: 'RELEASED_TO_PROVIDER',
      gateway: 'RAZORPAY',
      gatewayOrderId: 'order_rzp_mock_001',
      gatewayPaymentId: 'pay_rzp_mock_001',
      escrowCapturedAt: new Date(Date.now() - 48 * 3600 * 1000),
      escrowReleasedAt: new Date(Date.now() - 23 * 3600 * 1000),
      refundedAt: null,
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 23 * 3600 * 1000),
    });

    this.invoices.push({
      id: 'inv-seed-001',
      invoiceNumber: 'INV-2026-0001',
      bookingId: seedBookingId,
      subTotalINR: 850,
      cgstAmountINR: 4.5,
      sgstAmountINR: 4.5,
      totalAmountINR: 859,
      issuedAt: new Date(Date.now() - 48 * 3600 * 1000),
    });

    const seedConversationId = 'conv-seed-001';
    this.conversations.push({
      id: seedConversationId,
      bookingId: seedBookingId,
      isActive: true,
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
    });

    this.messages.push({
      id: 'msg-seed-001',
      conversationId: seedConversationId,
      senderUserId: citizenUser.id,
      content: 'Namaste Advocate Sir. I have uploaded the Tehsil land mutation copy for your review before our video call.',
      isRead: true,
      attachmentUrl: 'https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com/vault/tehsil_khasra_mutation.pdf',
      attachmentName: 'tehsil_khasra_mutation.pdf',
      isAadhaarSigned: true,
      sentAt: new Date(Date.now() - 25 * 3600 * 1000),
    });

    this.messages.push({
      id: 'msg-seed-002',
      conversationId: seedConversationId,
      senderUserId: advocateUser.id,
      content: 'Received Sunita ji. I have examined the Khasra entries. The partition suit has strong documentary backing. Let us discuss on the video link.',
      isRead: true,
      attachmentUrl: null,
      attachmentName: null,
      sentAt: new Date(Date.now() - 24.5 * 3600 * 1000),
    });

    this.reviews.push({
      id: 'rev-seed-001',
      bookingId: seedBookingId,
      citizenId: citizenUser.id,
      providerProfileId: advocateProfile.id,
      rating: 5,
      feedbackText: 'Very clear legal advice on my ancestral land partition. Honest guidance and zero hidden touting.',
      providerResponse: 'Thank you Sunita ji. Always committed to ethical and accessible legal clarity.',
      isFlagged: false,
      isVerifiedBooking: true,
      createdAt: new Date(Date.now() - 20 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 20 * 3600 * 1000),
    });

    // 6. Seed Pending Verification Provider (Adv. Meenakshi Sundaram)
    const pendingAdvUser: UserRecord = {
      id: 'usr-lsp-pending-004',
      phone: '+919840112233',
      email: 'meenakshi.sundaram@madrasbar.org.in',
      passwordHash: defaultPasswordHash,
      fullName: 'Adv. Meenakshi Sundaram',
      preferredLanguage: 'ta',
      status: AccountStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      createdAt: new Date(Date.now() - 6 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 4 * 3600 * 1000),
    };
    this.users.push(pendingAdvUser);
    this.userRoles.push({
      id: 'role-lsp-004',
      userId: pendingAdvUser.id,
      role: RoleType.LSP,
      createdAt: now,
    });

    const pendingAdvProfile: ProviderProfileRecord = {
      id: 'prof-lsp-004',
      userId: pendingAdvUser.id,
      providerType: ProviderType.ADVOCATE,
      enrolmentYear: 2016,
      stateBarCouncil: 'Bar Council of Tamil Nadu & Puducherry',
      barRegistrationNo: 'MS/2391/2016',
      notaryAppointmentNo: null,
      primaryCourt: 'Madras High Court & City Civil Court',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600104',
      experienceYears: 9,
      languagesSpoken: ['en', 'ta'],
      practiceAreas: ['Family & Matrimonial', 'Consumer Protection', 'Civil Appeals'],
      bio: 'Senior Associate Advocate practicing in family dispute mediation, Hindu Marriage Act petitions, and consumer forum litigations across Chennai jurisdictions.',
      consultationFeeINR: 900.0,
      isAvailableForProBono: true,
      verificationStatus: VerificationStatus.PENDING,
      rejectionReason: null,
      verifiedAt: null,
      complianceAccepted: true,
      complianceAcceptedAt: new Date(Date.now() - 4 * 3600 * 1000),
      totalPoints: 50,
      tierId: 'tier-bronze-01',
      createdAt: new Date(Date.now() - 6 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 4 * 3600 * 1000),
    };
    this.providerProfiles.push(pendingAdvProfile);

    this.providerCredentials.push({
      id: 'cred-adv-002',
      providerProfileId: pendingAdvProfile.id,
      credentialType: CredentialType.BAR_COUNCIL_ENROLMENT,
      certificateNumber: 'MS/2391/2016',
      issuingAuthority: 'Bar Council of Tamil Nadu & Puducherry',
      documentUrl: 'https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com/credentials/ms-2391-2016-enrolment.pdf',
      validFrom: new Date('2016-08-20'),
      validUntil: null,
      isVerified: false,
      createdAt: new Date(Date.now() - 4 * 3600 * 1000),
    });

    this.verificationRequests.push({
      id: 'vreq-pending-002',
      providerProfileId: pendingAdvProfile.id,
      submittedAt: new Date(Date.now() - 4 * 3600 * 1000),
      reviewedAt: null,
      reviewedByUserId: null,
      status: VerificationStatus.PENDING,
      reviewNotes: null,
      ocrPayload: {
        barCouncilMatch: true,
        extractedName: 'Meenakshi Sundaram',
        extractedEnrolment: 'MS/2391/2016',
        confidenceScore: 0.96,
      },
    });

    this.wallets.push({
      id: 'wallet-lsp-004',
      userId: pendingAdvUser.id,
      monetaryBalanceINR: 0,
      rewardPointsBalance: 50,
      updatedAt: now,
    });

    // 7. Seed Notary Provider (Approved)
    const notaryUser: UserRecord = {
      id: 'usr-lsp-notary-005',
      phone: '+919814055667',
      email: 'h.singh.notary@punjab.gov.in',
      passwordHash: defaultPasswordHash,
      fullName: 'Harpreet Singh (Notary Public)',
      preferredLanguage: 'pa',
      status: AccountStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      createdAt: new Date(Date.now() - 72 * 3600 * 1000),
      updatedAt: now,
    };
    this.users.push(notaryUser);
    this.userRoles.push({
      id: 'role-lsp-005',
      userId: notaryUser.id,
      role: RoleType.LSP,
      createdAt: now,
    });

    const notaryProfile: ProviderProfileRecord = {
      id: 'prof-lsp-005',
      userId: notaryUser.id,
      providerType: ProviderType.NOTARY,
      enrolmentYear: 2014,
      stateBarCouncil: 'Bar Council of Punjab & Haryana',
      barRegistrationNo: 'PH/5120/2014',
      notaryAppointmentNo: 'NOT-PB-8841-2018',
      primaryCourt: 'District & Sessions Court, Jalandhar',
      district: 'Jalandhar',
      state: 'Punjab',
      pincode: '144001',
      experienceYears: 11,
      languagesSpoken: ['en', 'pa', 'hi'],
      practiceAreas: ['Affidavit Attestation', 'Commercial Agreements Verification', 'Power of Attorney Authentication'],
      bio: 'Appointed Notary Public under Notaries Act 1952. Authorized by Govt. of India for legal oaths, statutory affidavits, and commercial instrument attestations.',
      consultationFeeINR: 350.0,
      isAvailableForProBono: false,
      verificationStatus: VerificationStatus.APPROVED,
      rejectionReason: null,
      verifiedAt: new Date(Date.now() - 70 * 3600 * 1000),
      complianceAccepted: true,
      complianceAcceptedAt: new Date(Date.now() - 70 * 3600 * 1000),
      totalPoints: 120,
      tierId: 'tier-bronze-01',
      createdAt: new Date(Date.now() - 72 * 3600 * 1000),
      updatedAt: now,
    };
    this.providerProfiles.push(notaryProfile);

    this.wallets.push({
      id: 'wallet-lsp-005',
      userId: notaryUser.id,
      monetaryBalanceINR: 350.0,
      rewardPointsBalance: 120,
      updatedAt: now,
    });

    // 8. Seed Disputed Booking & Active Escrow Lock
    const disputedBookingId = 'bk-seed-002';
    this.bookings.push({
      id: disputedBookingId,
      bookingReference: 'IN-LEG-2026-X90',
      citizenId: citizenUser.id,
      providerProfileId: notaryProfile.id,
      serviceTitle: 'Urgent Affidavit Attestation for Pension Benefit',
      deliveryMode: 'ONLINE_VIDEO',
      scheduledStartTime: new Date(Date.now() - 10 * 3600 * 1000),
      scheduledEndTime: new Date(Date.now() - 9.5 * 3600 * 1000),
      bookingStatus: 'DISPUTED',
      totalAmountINR: 409,
      platformFeeINR: 50,
      gstAmountINR: 9,
      providerEarningsINR: 350,
      createdAt: new Date(Date.now() - 14 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 8 * 3600 * 1000),
    });

    this.payments.push({
      id: 'pay-seed-002',
      bookingId: disputedBookingId,
      amountINR: 409,
      status: 'ESCROW_LOCKED',
      gateway: 'UPI',
      gatewayOrderId: 'order_upi_mock_002',
      gatewayPaymentId: 'pay_upi_mock_002',
      escrowCapturedAt: new Date(Date.now() - 14 * 3600 * 1000),
      escrowReleasedAt: null,
      refundedAt: null,
      createdAt: new Date(Date.now() - 14 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 8 * 3600 * 1000),
    });

    this.disputes.push({
      id: 'disp-seed-001',
      bookingId: disputedBookingId,
      raisedByUserId: citizenUser.id,
      reasonCode: 'PROVIDER_NO_SHOW',
      description: 'The notary did not attend the scheduled online video session for affidavit attestation. I waited 25 minutes. Kindly refund the escrow payment.',
      status: 'PENDING_ADMIN_REVIEW',
      resolutionNotes: null,
      resolvedAt: null,
      createdAt: new Date(Date.now() - 8 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 8 * 3600 * 1000),
    });

    // 9. Seed System Notifications
    this.notifications.push(
      {
        id: 'notif-admin-01',
        userId: adminUser.id,
        title: 'New LSP Verification Request',
        message: 'Adv. Meenakshi Sundaram has submitted credentials (MS/2391/2016) for administrative review.',
        type: 'VERIFICATION',
        metadata: { requestId: 'vreq-pending-002', providerProfileId: 'prof-lsp-004' },
        isRead: false,
        createdAt: new Date(Date.now() - 4 * 3600 * 1000),
      },
      {
        id: 'notif-admin-02',
        userId: adminUser.id,
        title: 'Escrow Dispute Logged: #DISP-2026-001',
        message: 'Citizen Sunita Devi flagged Booking IN-LEG-2026-X90 under PROVIDER_NO_SHOW. Escrow ₹409 is held.',
        type: 'DISPUTE',
        metadata: { disputeId: 'disp-seed-001', bookingId: disputedBookingId },
        isRead: false,
        createdAt: new Date(Date.now() - 8 * 3600 * 1000),
      },
      {
        id: 'notif-lsp-01',
        userId: advocateUser.id,
        title: 'Escrow Released: ₹800.00',
        message: 'Escrow for booking IN-LEG-2026-X89 has been settled into your platform wallet.',
        type: 'ESCROW',
        metadata: { bookingId: seedBookingId },
        isRead: true,
        createdAt: new Date(Date.now() - 23 * 3600 * 1000),
      },
      {
        id: 'notif-lsp-02',
        userId: advocateUser.id,
        title: 'Founding Member Badge Unlocked',
        message: 'Congratulations! You have received the early adopter founding member badge with 250 incentive points.',
        type: 'INCENTIVE',
        metadata: { points: 100 },
        isRead: false,
        createdAt: new Date(Date.now() - 48 * 3600 * 1000),
      },
      {
        id: 'notif-cit-01',
        userId: citizenUser.id,
        title: 'Sovereign Escrow Protection Active',
        message: 'Your fee of ₹859 is held in RBI-compliant escrow until legal service completion.',
        type: 'ESCROW',
        metadata: { bookingId: seedBookingId },
        isRead: true,
        createdAt: new Date(Date.now() - 48 * 3600 * 1000),
      },
      {
        id: 'notif-cit-02',
        userId: citizenUser.id,
        title: 'Dispute Case Registered: DISP-2026-001',
        message: 'Dispute DISP-2026-001 has been logged and assigned to the Grievance Officer for resolution.',
        type: 'DISPUTE',
        metadata: { disputeId: 'disp-seed-001' },
        isRead: false,
        createdAt: new Date(Date.now() - 8 * 3600 * 1000),
      }
    );

    // 10. Seed Statutory Audit Logs
    this.auditLogs.push(
      {
        id: 'audit-log-001',
        userId: citizenUser.id,
        action: 'DPDP_CONSENT_RECORDED',
        resourceType: 'USER_CONSENT',
        resourceId: citizenUser.id,
        ipAddress: '103.212.145.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        diffPayload: { consentType: 'DPDP_ACT_2023_DATA_PROCESSING', version: '2024.1', granted: true },
        createdAt: new Date(Date.now() - 50 * 3600 * 1000),
      },
      {
        id: 'audit-log-002',
        userId: pendingAdvUser.id,
        action: 'VERIFICATION_DOSSIER_SUBMITTED',
        resourceType: 'PROVIDER_PROFILE',
        resourceId: pendingAdvProfile.id,
        ipAddress: '49.207.180.25',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        diffPayload: { enrolment: 'MS/2391/2016', barCouncil: 'Bar Council of Tamil Nadu & Puducherry' },
        createdAt: new Date(Date.now() - 4 * 3600 * 1000),
      },
      {
        id: 'audit-log-003',
        userId: citizenUser.id,
        action: 'ESCROW_FUNDS_LOCKED',
        resourceType: 'PAYMENT_ESCROW',
        resourceId: 'pay-seed-002',
        ipAddress: '103.212.145.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        diffPayload: { bookingId: disputedBookingId, amountINR: 409, gateway: 'UPI' },
        createdAt: new Date(Date.now() - 14 * 3600 * 1000),
      }
    );
  }
}

export const dbStore = DatabaseStore.getInstance();

