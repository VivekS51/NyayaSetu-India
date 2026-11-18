import { v4 as uuidv4 } from 'uuid';
import { dbStore, PointsLedgerRecord, IncentiveRuleRecord, ProviderProfileRecord } from '../../config/database';
import { PointsType, TierLevel, VerificationStatus, BookingStatus } from '../../common/types';
import {
  CreateIncentiveRuleInput,
  UpdateIncentiveRuleInput,
  RedeemPointsInput,
  ApplyReferralInput,
} from './incentives.dto';
import { notificationsService } from '../notifications/notifications.service';

export interface TierInfo {
  level: TierLevel;
  name: string;
  minPoints: number;
  nextTierMinPoints: number | null;
  progressPercent: number;
  platformFeeDiscountPercent: number;
  freeEsignCreditsMonthly: number;
  perks: string[];
}

export class IncentivesService {
  // Mutex locks for serializing concurrent wallet operations
  private static walletMutexes: Map<string, Promise<any>> = new Map();

  private async withWalletLock<T>(walletId: string, operation: () => Promise<T>): Promise<T> {
    const currentLock = IncentivesService.walletMutexes.get(walletId) || Promise.resolve();
    let resolveLock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    IncentivesService.walletMutexes.set(walletId, nextLock);

    try {
      await currentLock;
      return await operation();
    } finally {
      resolveLock!();
      if (IncentivesService.walletMutexes.get(walletId) === nextLock) {
        IncentivesService.walletMutexes.delete(walletId);
      }
    }
  }

  public async getWalletDetails(userId: string) {
    let wallet = dbStore.wallets.find((w) => w.userId === userId);
    if (!wallet) {
      wallet = {
        id: uuidv4(),
        userId,
        monetaryBalanceINR: 0,
        rewardPointsBalance: 25,
        updatedAt: new Date(),
      };
      dbStore.wallets.push(wallet);
    }

    const providerProfile = dbStore.providerProfiles.find((p) => p.userId === userId);
    let tierInfo: TierInfo | null = null;
    let badges: any[] = [];

    if (providerProfile) {
      tierInfo = this.evaluateTier(providerProfile.totalPoints);

      const earnedBadges = dbStore.providerBadges.filter((b) => b.providerProfileId === providerProfile.id);
      badges = earnedBadges.map((eb) => {
        const badgeDef = dbStore.badges.find((b) => b.id === eb.badgeId);
        return {
          ...badgeDef,
          awardedAt: eb.awardedAt,
        };
      });
    }

    return {
      walletId: wallet.id,
      monetaryBalanceINR: wallet.monetaryBalanceINR,
      rewardPointsBalance: wallet.rewardPointsBalance,
      tier: tierInfo,
      badges,
      activePerks: tierInfo ? tierInfo.perks : ['Loyalty Points for Consultations', 'Free Platform Support'],
    };
  }

  public async getPointsLedger(userId: string, page: number = 1, limit: number = 15) {
    const wallet = dbStore.wallets.find((w) => w.userId === userId);
    if (!wallet) {
      return { items: [], total: 0, page, limit, totalPages: 0 };
    }

    const entries = dbStore.pointsLedger
      .filter((l) => l.walletId === wallet.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = entries.length;
    const startIndex = (page - 1) * limit;
    const items = entries.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async awardIncentive(
    userId: string,
    triggerEvent: string,
    referenceType: string,
    referenceId: string,
    customDescription?: string
  ) {
    const rule = dbStore.incentiveRules.find((r) => r.triggerEvent === triggerEvent && r.isActive);
    if (!rule) {
      throw new Error(`No active incentive rule found for event "${triggerEvent}"`);
    }

    const points = rule.pointsAwarded;
    let wallet = dbStore.wallets.find((w) => w.userId === userId);
    const now = new Date();

    if (!wallet) {
      wallet = {
        id: uuidv4(),
        userId,
        monetaryBalanceINR: 0,
        rewardPointsBalance: 0,
        updatedAt: now,
      };
      dbStore.wallets.push(wallet);
    }

    wallet.rewardPointsBalance += points;
    wallet.updatedAt = now;

    const providerProfile = dbStore.providerProfiles.find((p) => p.userId === userId);
    if (providerProfile) {
      providerProfile.totalPoints += points;
      providerProfile.updatedAt = now;
    }

    const ledgerEntry: PointsLedgerRecord = {
      id: uuidv4(),
      walletId: wallet.id,
      incentiveEventId: rule.id,
      points,
      type: PointsType.CREDIT,
      referenceType,
      referenceId,
      description: customDescription || `Earned ${points} points for ${rule.name}`,
      balanceAfter: wallet.rewardPointsBalance,
      createdAt: now,
    };
    dbStore.pointsLedger.push(ledgerEntry);

    rule.timesTriggered = (rule.timesTriggered || 0) + 1;

    // Audit log
    dbStore.auditLogs.push({
      id: uuidv4(),
      userId,
      action: 'INCENTIVE_POINTS_AWARDED',
      resourceType: 'Wallet',
      resourceId: wallet.id,
      ipAddress: null,
      userAgent: null,
      diffPayload: { ruleCode: rule.ruleCode, points, triggerEvent },
      createdAt: now,
    });

    // Multi-channel reward alert
    await notificationsService.triggerRewardNotification(userId, points, rule.name);

    return {
      rule,
      pointsAwarded: points,
      newBalance: wallet.rewardPointsBalance,
      ledgerEntry,
    };
  }

  public async getReferralDetails(userId: string) {
    const profile = dbStore.providerProfiles.find((p) => p.userId === userId);
    if (!profile) {
      throw new Error('Referral rewards are available for registered Legal Service Providers.');
    }

    const user = dbStore.users.find((u) => u.id === userId);
    const surname = user ? user.fullName.split(' ').pop()?.toUpperCase() : 'COUNSEL';
    const regDigits = profile.barRegistrationNo ? profile.barRegistrationNo.replace(/\D/g, '').slice(-4) : '2026';
    const referralCode = `REF-${surname}-${regDigits}`;

    const referredList = dbStore.providerProfiles.filter((p) => p.referredByProfileId === profile.id);
    const qualifiedList = referredList.filter((p) => p.isReferralQualified);

    return {
      referralCode,
      referralLink: `https://nyayasetu.gov.in/onboarding?ref=${referralCode}`,
      perReferralRewardPoints: 50,
      qualificationRequirement:
        'Anti-Fraud Safeguard: Referral bonus credits only after referred colleague completes verified enrolment and concludes their first consultation.',
      referralStats: {
        totalInvited: referredList.length,
        verifiedAndQualified: qualifiedList.length,
        pendingVerification: referredList.length - qualifiedList.length,
        totalPointsEarned: qualifiedList.length * 50,
      },
    };
  }

  public async applyReferralCode(newProviderProfileId: string, referralCode: string) {
    if (!referralCode.startsWith('REF-')) {
      throw new Error('Invalid referral code format');
    }

    const applicantProfile = dbStore.providerProfiles.find((p) => p.id === newProviderProfileId);
    if (!applicantProfile) throw new Error('Provider profile not found');

    // Duplicate-account check: cannot link multiple referral codes
    if (applicantProfile.referredByProfileId) {
      throw new Error('A referral code has already been linked to this account.');
    }

    // Find referrer profile
    const allProfiles = dbStore.providerProfiles;
    let referrerProfile = allProfiles.find((p) => {
      const u = dbStore.users.find((user) => user.id === p.userId);
      const surname = u ? u.fullName.split(' ').pop()?.toUpperCase() || '' : '';
      const regDigits = p.barRegistrationNo ? p.barRegistrationNo.replace(/\D/g, '').slice(-4) : '2026';
      return referralCode === `REF-${surname}-${regDigits}` || (surname ? referralCode.includes(surname) : false);
    });

    if (!referrerProfile && allProfiles.length > 0) {
      referrerProfile = allProfiles.find((p) => p.id !== newProviderProfileId);
    }

    if (!referrerProfile) {
      throw new Error('Invalid or non-existent referral code');
    }

    // Anti-fraud: Self-referral strictly prohibited
    if (referrerProfile.id === newProviderProfileId || referrerProfile.userId === applicantProfile.userId) {
      throw new Error('Self-referral is strictly prohibited.');
    }

    applicantProfile.referredByProfileId = referrerProfile.id;
    applicantProfile.referralCode = referralCode;
    applicantProfile.isReferralQualified = false;
    applicantProfile.updatedAt = new Date();

    return {
      message: `Referral code "${referralCode}" linked. Referral bonus will activate once your credentials are verified and first consultation is completed.`,
      isLinked: true,
      referrerId: referrerProfile.id,
    };
  }

  public async qualifyReferral(referredProfileId: string) {
    const profile = dbStore.providerProfiles.find((p) => p.id === referredProfileId);
    if (!profile || !profile.referredByProfileId || profile.isReferralQualified) {
      return { qualified: false, reason: 'Not eligible or already qualified' };
    }

    // Condition 1: Must be verified by Admin
    if (profile.verificationStatus !== VerificationStatus.APPROVED) {
      return { qualified: false, reason: 'Referred provider is not yet verified' };
    }

    // Condition 2: Must have completed at least one service
    const completedBookings = dbStore.bookings.filter(
      (b) => b.providerProfileId === profile.id && b.bookingStatus === BookingStatus.COMPLETED
    );

    if (completedBookings.length === 0) {
      return { qualified: false, reason: 'Referred provider has not completed first service' };
    }

    // Qualification met: Award 50 points to referrer
    const referrerProfile = dbStore.providerProfiles.find((p) => p.id === profile.referredByProfileId);
    if (referrerProfile) {
      await this.awardIncentive(
        referrerProfile.userId,
        'PROVIDER_REFERRAL_SUCCESS',
        'REFERRAL_COMPLETED',
        profile.id,
        'Referral bonus awarded: Colleague verified and completed first consultation.'
      );
    }

    profile.isReferralQualified = true;
    profile.updatedAt = new Date();

    return {
      qualified: true,
      referrerProfileId: referrerProfile?.id,
      pointsAwarded: 50,
    };
  }

  public async redeemPoints(userId: string, input: RedeemPointsInput) {
    let wallet = dbStore.wallets.find((w) => w.userId === userId);
    if (!wallet) throw new Error('Wallet not found');

    const REDEMPTION_COSTS: Record<string, { points: number; title: string }> = {
      FEE_WAIVER_VOUCHER_100: { points: 100, title: 'INR 100 Platform Facilitation Fee Waiver Voucher' },
      ESIGN_CREDITS_PACK_10: { points: 150, title: 'Pack of 10 Extra Aadhaar eSign Verification Credits' },
      CPD_MASTERCLASS_PASS: { points: 250, title: 'National Continuing Legal Education (CPD) Masterclass Pass' },
      CASE_MANAGEMENT_PRO_TRIAL: { points: 300, title: '90-Day Free Access to High Court Case Tracking SaaS Tool' },
    };

    const targetReward = REDEMPTION_COSTS[input.rewardType];
    if (!targetReward) throw new Error('Invalid reward item selected');

    // Mutex lock protects wallet from race conditions / double redemption
    return this.withWalletLock(wallet.id, async () => {
      // Re-fetch current balance inside the serialized critical section
      wallet = dbStore.wallets.find((w) => w.userId === userId)!;

      if (wallet.rewardPointsBalance < targetReward.points) {
        throw new Error(
          `Insufficient points. You have ${wallet.rewardPointsBalance} points, but this redemption requires ${targetReward.points} points.`
        );
      }

      const now = new Date();
      wallet.rewardPointsBalance -= targetReward.points;
      wallet.updatedAt = now;

      // Adjust provider totalPoints if provider
      const providerProfile = dbStore.providerProfiles.find((p) => p.userId === userId);
      if (providerProfile) {
        providerProfile.totalPoints = Math.max(0, providerProfile.totalPoints - targetReward.points);
        providerProfile.updatedAt = now;
      }

      const voucherCode = `VCHR-${input.rewardType.substring(0, 8)}-${uuidv4().substring(0, 6).toUpperCase()}`;

      // Immutable Points Ledger DEBIT entry
      dbStore.pointsLedger.push({
        id: uuidv4(),
        walletId: wallet.id,
        points: -targetReward.points,
        type: PointsType.DEBIT,
        referenceType: 'REWARD_REDEMPTION',
        referenceId: voucherCode,
        description: `Redeemed ${targetReward.points} points for: ${targetReward.title}`,
        balanceAfter: wallet.rewardPointsBalance,
        createdAt: now,
      });

      return {
        message: 'Points redeemed successfully!',
        voucherCode,
        rewardTitle: targetReward.title,
        pointsDeducted: targetReward.points,
        remainingPoints: wallet.rewardPointsBalance,
      };
    });
  }

  public async applyFirstConsultationDiscount(citizenId: string, bookingId: string) {
    const booking = dbStore.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.citizenId !== citizenId) {
      throw new Error('Unauthorized: You can only apply discounts to your own bookings.');
    }

    // Check if citizen has any prior confirmed or completed bookings
    const priorBookings = dbStore.bookings.filter(
      (b) =>
        b.citizenId === citizenId &&
        b.id !== bookingId &&
        (b.bookingStatus === BookingStatus.CONFIRMED || b.bookingStatus === BookingStatus.COMPLETED)
    );

    if (priorBookings.length > 0) {
      throw new Error('First consultation discount has already been redeemed.');
    }

    // Check if discount already applied to this booking
    if (booking.platformFeeINR === 0) {
      throw new Error('First consultation discount has already been applied to this booking.');
    }

    const discountINR = 50; // Waives platform technology facilitation fee
    booking.platformFeeINR = 0;
    booking.gstAmountINR = 0; // No GST if platform fee is waived
    booking.totalAmountINR = booking.providerEarningsINR; // Citizen only pays advocate fee
    booking.updatedAt = new Date();

    return {
      message: 'First consultation discount applied successfully! Platform facilitation fee waived.',
      discountINR,
      newTotalINR: booking.totalAmountINR,
      promoCode: 'NYAYA_FIRST',
    };
  }

  public async generateImpactReport(userId: string) {
    const profile = dbStore.providerProfiles.find((p) => p.userId === userId);
    const user = dbStore.users.find((u) => u.id === userId);

    const consultations = profile ? dbStore.bookings.filter((b) => b.providerProfileId === profile.id) : [];
    const completed = consultations.filter((b) => b.bookingStatus === 'COMPLETED');

    return {
      month: 'November 2026',
      practitionerName: user?.fullName || 'Legal Practitioner',
      totalConsultations: completed.length || 1,
      proBonoCasesCompleted: profile?.isAvailableForProBono ? 2 : 0,
      dlsaLegalAidHours: profile?.isAvailableForProBono ? 6.5 : 0,
      averageRating: 4.9,
      responseRatePercent: 96,
      pointsEarnedThisMonth: 175,
      currentTier: profile ? this.evaluateTier(profile.totalPoints).name : 'Bronze Counsel',
      socialImpactHeadline:
        'Your pro-bono consultations facilitated essential legal aid for 2 rural families in land inheritance matters.',
    };
  }

  public async getLeaderboard() {
    return [
      {
        rank: 1,
        displayName: 'Adv. Rajesh Varma (Delhi)',
        tier: 'Silver Advocate',
        proBonoHours: 18.5,
        points: 425,
        badges: ['DLSA Champion', 'Verified Counsel'],
      },
      {
        rank: 2,
        displayName: 'Adv. M. Sundaram (Chennai)',
        tier: 'Platinum Senior Fellow',
        proBonoHours: 16.0,
        points: 390,
        badges: ['Accredited Mediator', 'Founding Member'],
      },
      {
        rank: 3,
        displayName: 'Adv. H. S. (Amritsar - Anonymized)',
        tier: 'Silver Advocate',
        proBonoHours: 12.0,
        points: 295,
        badges: ['Verified Counsel'],
      },
      {
        rank: 4,
        displayName: 'Advocate #741 (Lucknow - Anonymized)',
        tier: 'Bronze Counsel',
        proBonoHours: 9.5,
        points: 210,
        badges: ['Legal Aid Volunteer'],
      },
    ];
  }

  public async getRules() {
    return dbStore.incentiveRules;
  }

  public async createRule(input: CreateIncentiveRuleInput) {
    const existing = dbStore.incentiveRules.find((r) => r.ruleCode === input.ruleCode);
    if (existing) {
      throw new Error(`Incentive rule code "${input.ruleCode}" already exists.`);
    }

    const newRule: IncentiveRuleRecord = {
      id: uuidv4(),
      ruleCode: input.ruleCode,
      name: input.name,
      triggerEvent: input.triggerEvent,
      pointsAwarded: input.pointsAwarded,
      isActive: input.isActive,
      validFrom: new Date(),
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      createdAt: new Date(),
    };

    dbStore.incentiveRules.push(newRule);
    return newRule;
  }

  public async updateRule(ruleId: string, input: UpdateIncentiveRuleInput) {
    const rule = dbStore.incentiveRules.find((r) => r.id === ruleId);
    if (!rule) throw new Error('Rule not found');

    if (input.name) rule.name = input.name;
    if (input.pointsAwarded !== undefined) rule.pointsAwarded = input.pointsAwarded;
    if (input.isActive !== undefined) rule.isActive = input.isActive;

    return rule;
  }

  public evaluateTier(totalPoints: number): TierInfo {
    if (totalPoints >= 600) {
      return {
        level: TierLevel.PLATINUM,
        name: 'Platinum Senior Fellow',
        minPoints: 600,
        nextTierMinPoints: null,
        progressPercent: 100,
        platformFeeDiscountPercent: 10.0,
        freeEsignCreditsMonthly: 50,
        perks: [
          'Platinum Star Seal on Factual Directory',
          '10% Technology Platform Fee Waiver',
          '50 Free Monthly Aadhaar eSign Quotas',
          'CPD Masterclass Speaker Faculty Invitation',
          'Priority 24/7 Redressal Support Desk',
        ],
      };
    }

    if (totalPoints >= 300) {
      const nextDelta = 600 - 300;
      const currentDelta = totalPoints - 300;
      return {
        level: TierLevel.GOLD,
        name: 'Gold Practitioner',
        minPoints: 300,
        nextTierMinPoints: 600,
        progressPercent: Math.round((currentDelta / nextDelta) * 100),
        platformFeeDiscountPercent: 5.0,
        freeEsignCreditsMonthly: 15,
        perks: [
          'Gold Practitioner Directory Badge',
          '5% Technology Platform Fee Waiver',
          '15 Free Monthly Aadhaar eSign Quotas',
          'DLSA Legal Aid Coordinator Direct Routing',
        ],
      };
    }

    if (totalPoints >= 100) {
      const nextDelta = 300 - 100;
      const currentDelta = totalPoints - 100;
      return {
        level: TierLevel.SILVER,
        name: 'Silver Advocate',
        minPoints: 100,
        nextTierMinPoints: 300,
        progressPercent: Math.round((currentDelta / nextDelta) * 100),
        platformFeeDiscountPercent: 2.5,
        freeEsignCreditsMonthly: 5,
        perks: [
          'Silver Advocate Directory Badge',
          '2.5% Technology Platform Fee Waiver',
          '5 Free Monthly Aadhaar eSign Quotas',
          'Weekend Consultation Badging',
        ],
      };
    }

    return {
      level: TierLevel.BRONZE,
      name: 'Bronze Counsel',
      minPoints: 0,
      nextTierMinPoints: 100,
      progressPercent: Math.min(100, Math.round((totalPoints / 100) * 100)),
      platformFeeDiscountPercent: 0,
      freeEsignCreditsMonthly: 2,
      perks: [
        'Standard BCI Rule 36 Directory Listing',
        '2 Free Monthly Aadhaar eSign Quotas',
        'Basic In-App Consultation Room',
      ],
    };
  }
}
