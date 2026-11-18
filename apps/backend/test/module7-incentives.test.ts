import request from 'supertest';
import { createApp } from '../src/app';
import { dbStore } from '../src/config/database';
import {
  RoleType,
  ProviderType,
  VerificationStatus,
  ServiceDeliveryMode,
  BookingStatus,
  TierLevel,
} from '../src/common/types';
import { IncentivesService } from '../src/modules/incentives/incentives.service';

describe('MODULE 7: INCENTIVE ENGINE & REWARDS TEST SUITE (Tiers, Ledger, Referrals & Anti-Fraud)', () => {
  const app = createApp();
  const incentivesService = new IncentivesService();

  // Test identities
  let advocateToken: string;
  let advocateUserId: string;
  let advocateProfileId: string;

  let advocateBToken: string;
  let advocateBUserId: string;
  let advocateBProfileId: string;

  let citizenToken: string;
  let citizenUserId: string;

  let citizenBToken: string;
  let citizenBUserId: string;

  let adminToken: string;
  let adminUserId: string;

  let slotCounter = 1;

  beforeAll(async () => {
    dbStore.resetToDefault();

    // 1. Primary Advocate (Adv. Rajesh Varma)
    const advLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'rajesh.varma@delhibar.org.in', password: 'Password@123' });
    advocateToken = advLogin.body.data.accessToken;
    advocateUserId = advLogin.body.data.user.id;
    advocateProfileId = 'prof-lsp-003';

    // 2. Secondary Advocate (Colleague for Referrals)
    const advBReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Advocate Sneha Roy',
        phone: '+919876588888',
        email: 'sneha.incentives.b@example.in',
        password: 'Password@1234',
        role: RoleType.LSP,
        dpdpConsentAcknowledged: true,
      });
    advocateBToken = advBReg.body.data.accessToken;
    advocateBUserId = advBReg.body.data.user.id;
    const pB = dbStore.providerProfiles.find((p) => p.userId === advocateBUserId);
    advocateBProfileId = pB!.id;

    // 3. Primary Citizen (Sunita Devi)
    const citizenLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'sunita.devi@example.in', password: 'Password@123' });
    citizenToken = citizenLogin.body.data.accessToken;
    citizenUserId = citizenLogin.body.data.user.id;

    // 4. Citizen B (Vikram Joshi)
    const citizenBReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Vikram Joshi (Citizen B)',
        phone: '+919876599999',
        email: 'vikram.incentives.b@example.in',
        password: 'Password@1234',
        role: RoleType.CITIZEN,
        dpdpConsentAcknowledged: true,
      });
    citizenBToken = citizenBReg.body.data.accessToken;
    citizenBUserId = citizenBReg.body.data.user.id;

    // 5. Admin User
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'admin@legalmarketplace.gov.in',
        password: 'Password@123',
      });
    adminToken = adminLogin.body.data.accessToken;
    adminUserId = adminLogin.body.data.user.id;
  });

  afterAll(() => {
    dbStore.resetToDefault();
  });

  // Helper to create a fresh booking for citizen
  async function createBooking(citizenTok: string = citizenToken, providerId: string = advocateProfileId) {
    slotCounter += 1;
    const slotTime = new Date(Date.now() + (300 + slotCounter * 24) * 3600 * 1000);
    slotTime.setHours(12, 0, 0, 0);

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${citizenTok}`)
      .send({
        providerProfileId: providerId,
        serviceTitle: `Incentive Test Case ${slotCounter}`,
        deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
        scheduledStartTime: slotTime.toISOString(),
        durationMinutes: 30,
      });

    return res.body.data;
  }

  // =========================================================================
  // SUB-SUITE 7.1: Dynamic Rule Evaluation & Trigger Events
  // =========================================================================
  describe('7.1 Dynamic Rule Evaluation & Trigger Events', () => {
    it('should award 50 points on PROFILE_COMPLETION trigger event', async () => {
      const res = await incentivesService.awardIncentive(
        advocateUserId,
        'PROFILE_COMPLETION',
        'ONBOARDING',
        'step-4-complete'
      );

      expect(res.pointsAwarded).toBe(50);
      expect(res.rule.ruleCode).toBe('RULE_PROFILE_COMPLETION');
      expect(res.ledgerEntry.type).toBe('CREDIT');
      expect(res.ledgerEntry.points).toBe(50);
    });

    it('should award 100 points on VERIFICATION_APPROVED trigger event', async () => {
      const res = await incentivesService.awardIncentive(
        advocateUserId,
        'VERIFICATION_APPROVED',
        'ADMIN_VERIFICATION',
        'vreq-approve-01'
      );

      expect(res.pointsAwarded).toBe(100);
      expect(res.rule.ruleCode).toBe('RULE_VERIFICATION_APPROVED');
      expect(res.ledgerEntry.points).toBe(100);
    });

    it('should award 20 points on FAST_RESPONSE_RATE trigger event', async () => {
      const res = await incentivesService.awardIncentive(
        advocateUserId,
        'FAST_RESPONSE_RATE',
        'CHAT_RESPONSE',
        'msg-speed-01'
      );

      expect(res.pointsAwarded).toBe(20);
      expect(res.rule.ruleCode).toBe('RULE_FAST_RESPONSE_RATE');
    });

    it('should award 75 points on PRO_BONO_CASE_COMPLETED legal aid trigger event', async () => {
      const res = await incentivesService.awardIncentive(
        advocateUserId,
        'PRO_BONO_CASE_COMPLETED',
        'DLSA_LEGAL_AID',
        'dlsa-case-001'
      );

      expect(res.pointsAwarded).toBe(75);
      expect(res.rule.ruleCode).toBe('RULE_PRO_BONO_COMPLETED');
    });

    it('should throw an error when attempting to evaluate a non-existent trigger event', async () => {
      await expect(
        incentivesService.awardIncentive(
          advocateUserId,
          'NON_EXISTENT_TRIGGER_EVENT',
          'TEST',
          'test-id'
        )
      ).rejects.toThrow('No active incentive rule found');
    });
  });

  // =========================================================================
  // SUB-SUITE 7.2: Tier Progression & Exact Boundary Values
  // =========================================================================
  describe('7.2 Tier Upgrades, Downgrades & Exact Boundary Values', () => {
    it('should classify exact boundary 0 points as Bronze Counsel', () => {
      const tier = incentivesService.evaluateTier(0);
      expect(tier.level).toBe(TierLevel.BRONZE);
      expect(tier.name).toBe('Bronze Counsel');
      expect(tier.platformFeeDiscountPercent).toBe(0);
      expect(tier.freeEsignCreditsMonthly).toBe(2);
    });

    it('should classify exact boundary 99 points as Bronze Counsel', () => {
      const tier = incentivesService.evaluateTier(99);
      expect(tier.level).toBe(TierLevel.BRONZE);
    });

    it('should transition to Silver Advocate at EXACT boundary of 100 points and unlock perks', () => {
      const tier = incentivesService.evaluateTier(100);
      expect(tier.level).toBe(TierLevel.SILVER);
      expect(tier.name).toBe('Silver Advocate');
      expect(tier.platformFeeDiscountPercent).toBe(2.5);
      expect(tier.freeEsignCreditsMonthly).toBe(5);
      expect(tier.perks).toContain('Weekend Consultation Badging');
    });

    it('should classify exact boundary 299 points as Silver Advocate', () => {
      const tier = incentivesService.evaluateTier(299);
      expect(tier.level).toBe(TierLevel.SILVER);
    });

    it('should transition to Gold Practitioner at EXACT boundary of 300 points and unlock perks', () => {
      const tier = incentivesService.evaluateTier(300);
      expect(tier.level).toBe(TierLevel.GOLD);
      expect(tier.name).toBe('Gold Practitioner');
      expect(tier.platformFeeDiscountPercent).toBe(5.0);
      expect(tier.freeEsignCreditsMonthly).toBe(15);
      expect(tier.perks).toContain('DLSA Legal Aid Coordinator Direct Routing');
    });

    it('should classify exact boundary 599 points as Gold Practitioner', () => {
      const tier = incentivesService.evaluateTier(599);
      expect(tier.level).toBe(TierLevel.GOLD);
    });

    it('should transition to Platinum Senior Fellow at EXACT boundary of 600 points and unlock VIP perks', () => {
      const tier = incentivesService.evaluateTier(600);
      expect(tier.level).toBe(TierLevel.PLATINUM);
      expect(tier.name).toBe('Platinum Senior Fellow');
      expect(tier.platformFeeDiscountPercent).toBe(10.0);
      expect(tier.freeEsignCreditsMonthly).toBe(50);
      expect(tier.perks).toContain('Priority 24/7 Redressal Support Desk');
      expect(tier.nextTierMinPoints).toBeNull();
      expect(tier.progressPercent).toBe(100);
    });

    it('should dynamically downgrade tier when points drop below threshold (Gold -> Silver)', () => {
      const goldTier = incentivesService.evaluateTier(310);
      expect(goldTier.level).toBe(TierLevel.GOLD);

      // Provider redeems 20 points, dropping to 290
      const downgradedTier = incentivesService.evaluateTier(290);
      expect(downgradedTier.level).toBe(TierLevel.SILVER);
      expect(downgradedTier.name).toBe('Silver Advocate');
      expect(downgradedTier.platformFeeDiscountPercent).toBe(2.5);
    });
  });

  // =========================================================================
  // SUB-SUITE 7.3: Points Ledger Immutability & Double-Entry Math
  // =========================================================================
  describe('7.3 Points Ledger Immutability & Double-Entry Math', () => {
    it('wallet reward balance must exactly equal the mathematical sum of all ledger entries', async () => {
      const walletDetails = await incentivesService.getWalletDetails(advocateUserId);
      const ledger = await incentivesService.getPointsLedger(advocateUserId, 1, 100);

      const calculatedSum = ledger.items.reduce((sum, item) => sum + item.points, 0);

      // Verify double-entry consistency
      expect(walletDetails.rewardPointsBalance).toBe(calculatedSum);
    });

    it('should fetch paginated points ledger via API (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/incentives/ledger?page=1&limit=5')
        .set('Authorization', `Bearer ${advocateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(5);
    });
  });

  // =========================================================================
  // SUB-SUITE 7.4: Wallet Redemptions & Concurrency Race Conditions
  // =========================================================================
  describe('7.4 Wallet Redemptions & Concurrency Race Conditions', () => {
    it('should redeem 100 points for platform fee waiver voucher (HTTP 200)', async () => {
      // Ensure wallet has at least 150 points
      const wallet = dbStore.wallets.find((w) => w.userId === advocateUserId);
      wallet!.rewardPointsBalance = 150;

      const res = await request(app)
        .post('/api/v1/incentives/redeem')
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({ rewardType: 'FEE_WAIVER_VOUCHER_100' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.voucherCode).toMatch(/^VCHR-FEE_WAIV-/);
      expect(res.body.data.pointsDeducted).toBe(100);
      expect(res.body.data.remainingPoints).toBe(50);

      // Verify immutable debit entry in points ledger
      const debitEntry = dbStore.pointsLedger.find(
        (l) => l.referenceId === res.body.data.voucherCode && l.type === 'DEBIT'
      );
      expect(debitEntry).toBeDefined();
      expect(debitEntry?.points).toBe(-100);
    });

    it('should reject redemption when wallet has insufficient points (HTTP 400)', async () => {
      const wallet = dbStore.wallets.find((w) => w.userId === advocateUserId);
      wallet!.rewardPointsBalance = 50;

      // Attempting to redeem CPD Masterclass requiring 250 points
      const res = await request(app)
        .post('/api/v1/incentives/redeem')
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({ rewardType: 'CPD_MASTERCLASS_PASS' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient points');
      expect(res.body.message).toContain('requires 250 points');
    });

    it('should serialize concurrent redemptions: exactly one succeeds and second is rejected (Race Condition Test)', async () => {
      // Set wallet balance to exactly 100 points
      const wallet = dbStore.wallets.find((w) => w.userId === advocateUserId);
      wallet!.rewardPointsBalance = 100;

      // Launch 2 simultaneous redemption requests for a 100-point reward
      const [req1, req2] = await Promise.all([
        request(app)
          .post('/api/v1/incentives/redeem')
          .set('Authorization', `Bearer ${advocateToken}`)
          .send({ rewardType: 'FEE_WAIVER_VOUCHER_100' }),
        request(app)
          .post('/api/v1/incentives/redeem')
          .set('Authorization', `Bearer ${advocateToken}`)
          .send({ rewardType: 'FEE_WAIVER_VOUCHER_100' }),
      ]);

      const statuses = [req1.status, req2.status];
      expect(statuses).toContain(200); // Exactly one succeeded
      expect(statuses).toContain(400); // Exactly one failed

      // Wallet balance must be exactly 0, never negative
      expect(wallet!.rewardPointsBalance).toBe(0);
    });
  });

  // =========================================================================
  // SUB-SUITE 7.5: Colleague Referrals & Anti-Fraud Enforcement
  // =========================================================================
  describe('7.5 Colleague Referrals & Anti-Fraud Safeguards', () => {
    let referrerCode: string;

    beforeAll(async () => {
      const refRes = await request(app)
        .get('/api/v1/incentives/referral')
        .set('Authorization', `Bearer ${advocateToken}`);

      referrerCode = refRes.body.data.referralCode;
      expect(referrerCode).toMatch(/^REF-/);
    });

    it('should reject self-referral attempt (provider applying their own code - HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/incentives/referral/apply')
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({ referralCode: referrerCode });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Self-referral is strictly prohibited');
    });

    it('should allow colleague (Advocate B) to apply referrer code during onboarding (HTTP 200)', async () => {
      const res = await request(app)
        .post('/api/v1/incentives/referral/apply')
        .set('Authorization', `Bearer ${advocateBToken}`)
        .send({ referralCode: referrerCode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isLinked).toBe(true);

      const pB = dbStore.providerProfiles.find((p) => p.id === advocateBProfileId);
      expect(pB?.referredByProfileId).toBe(advocateProfileId);
      expect(pB?.isReferralQualified).toBe(false);
    });

    it('should reject duplicate referral code application on the same account (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/incentives/referral/apply')
        .set('Authorization', `Bearer ${advocateBToken}`)
        .send({ referralCode: 'REF-ANOTHER-2026' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('A referral code has already been linked to this account');
    });

    it('should NOT award referral bonus if colleague is not yet verified or has no completed booking', async () => {
      const pB = dbStore.providerProfiles.find((p) => p.id === advocateBProfileId);
      pB!.verificationStatus = VerificationStatus.PENDING; // Unverified

      const qual = await incentivesService.qualifyReferral(advocateBProfileId);
      expect(qual.qualified).toBe(false);
      expect(qual.reason).toContain('not yet verified');
    });

    it('should award 50 referral points to referrer ONLY after colleague is verified AND completes first consultation', async () => {
      const pB = dbStore.providerProfiles.find((p) => p.id === advocateBProfileId);
      pB!.verificationStatus = VerificationStatus.APPROVED; // 1. Verified

      // 2. Colleague completes first booking in database
      const b = await createBooking(citizenToken, advocateBProfileId);
      const dbBooking = dbStore.bookings.find((bk) => bk.id === b.id);
      dbBooking!.bookingStatus = BookingStatus.COMPLETED;

      const referrerWalletBefore = dbStore.wallets.find((w) => w.userId === advocateUserId);
      const pointsBefore = referrerWalletBefore?.rewardPointsBalance || 0;

      const qual = await incentivesService.qualifyReferral(advocateBProfileId);
      expect(qual.qualified).toBe(true);
      expect(qual.pointsAwarded).toBe(50);

      const referrerWalletAfter = dbStore.wallets.find((w) => w.userId === advocateUserId);
      expect(referrerWalletAfter?.rewardPointsBalance).toBe(pointsBefore + 50);

      // Verify points ledger
      const refLedger = dbStore.pointsLedger.find(
        (l) => l.walletId === referrerWalletAfter?.id && l.referenceType === 'REFERRAL_COMPLETED'
      );
      expect(refLedger).toBeDefined();
      expect(refLedger?.points).toBe(50);
    });
  });

  // =========================================================================
  // SUB-SUITE 7.6: Admin Dynamic Rule Management Without Redeployment
  // =========================================================================
  describe('7.6 Admin Dynamic Rule Configuration (Zero-Downtime Rule Updates)', () => {
    let createdRuleId: string;

    it('should allow platform admin to create a new dynamic incentive rule (HTTP 201)', async () => {
      const res = await request(app)
        .post('/api/v1/incentives/admin/rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ruleCode: 'RULE_COURT_DOCUMENT_AI_PILOT',
          name: 'AI Document Review Pilot Participation',
          triggerEvent: 'CITIZEN_FIRST_BOOKING',
          pointsAwarded: 35,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ruleCode).toBe('RULE_COURT_DOCUMENT_AI_PILOT');
      createdRuleId = res.body.data.id;
    });

    it('should reject non-admin users from creating incentive rules (HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/v1/incentives/admin/rules')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          ruleCode: 'RULE_UNAUTHORIZED_HACK',
          name: 'Hacking points',
          triggerEvent: 'BOOKING_COMPLETED',
          pointsAwarded: 500,
        });

      expect(res.status).toBe(403);
    });

    it('should allow admin to update rule points dynamically (e.g. BOOKING_COMPLETED 25 -> 45 pts)', async () => {
      const rule = dbStore.incentiveRules.find((r) => r.triggerEvent === 'BOOKING_COMPLETED');
      expect(rule).toBeDefined();

      const res = await request(app)
        .patch(`/api/v1/incentives/admin/rules/${rule!.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ pointsAwarded: 45 });

      expect(res.status).toBe(200);
      expect(res.body.data.pointsAwarded).toBe(45);

      // Verify that triggering the event immediately reflects the new points value (45 pts)
      const triggerRes = await incentivesService.awardIncentive(
        advocateUserId,
        'BOOKING_COMPLETED',
        'BOOKING',
        'bk-dynamic-test-01'
      );

      expect(triggerRes.pointsAwarded).toBe(45); // Uses new 45 points without any code changes!
    });
  });

  // =========================================================================
  // SUB-SUITE 7.7: Citizen Incentives & Anti-Fraud
  // =========================================================================
  describe('7.7 Citizen Incentives & Anti-Fraud Enforcement', () => {
    let firstTimeCitizenToken: string;
    let firstTimeCitizenId: string;
    let firstBookingId: string;

    beforeAll(async () => {
      // Register a brand new first-time citizen with 0 previous bookings
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Anil Kumar FirstTime',
          phone: '+919876511111',
          email: 'anil.firsttime@example.in',
          password: 'Password@123',
          role: RoleType.CITIZEN,
          dpdpConsentAcknowledged: true,
        });

      firstTimeCitizenToken = regRes.body.data.accessToken;
      firstTimeCitizenId = regRes.body.data.user.id;

      const b = await createBooking(firstTimeCitizenToken);
      firstBookingId = b.id;
    });

    it('should allow first-time citizen to apply first consultation discount (₹50 off platform fee - HTTP 200)', async () => {
      const res = await request(app)
        .post('/api/v1/incentives/citizen/first-discount')
        .set('Authorization', `Bearer ${firstTimeCitizenToken}`)
        .send({ bookingId: firstBookingId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.discountINR).toBe(50);
      expect(res.body.data.promoCode).toBe('NYAYA_FIRST');

      const b = dbStore.bookings.find((bk) => bk.id === firstBookingId);
      expect(b?.platformFeeINR).toBe(0); // Platform fee waived
      expect(b?.totalAmountINR).toBe(b?.providerEarningsINR); // Citizen only pays advocate fee
    });

    it('should reject second attempt to apply first consultation discount on the same booking (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/incentives/citizen/first-discount')
        .set('Authorization', `Bearer ${firstTimeCitizenToken}`)
        .send({ bookingId: firstBookingId });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('First consultation discount has already been applied to this booking');
    });

    it('should reject attempt to apply first consultation discount on subsequent bookings by returning citizen (HTTP 400)', async () => {
      // Mark first booking as CONFIRMED
      const b1 = dbStore.bookings.find((bk) => bk.id === firstBookingId);
      b1!.bookingStatus = BookingStatus.CONFIRMED;

      // Create a second booking
      const secondBooking = await createBooking(firstTimeCitizenToken);

      const res = await request(app)
        .post('/api/v1/incentives/citizen/first-discount')
        .set('Authorization', `Bearer ${firstTimeCitizenToken}`)
        .send({ bookingId: secondBooking.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('First consultation discount has already been redeemed');
    });

    it('should reject Citizen B attempting to apply discount to Citizen A booking (IDOR - HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/v1/incentives/citizen/first-discount')
        .set('Authorization', `Bearer ${citizenBToken}`)
        .send({ bookingId: firstBookingId });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized: You can only apply discounts to your own bookings');
    });

    it('should fetch public impact leaderboard with anonymized entries (HTTP 200)', async () => {
      const res = await request(app).get('/api/v1/incentives/leaderboard');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify privacy anonymization
      const anonymizedEntry = res.body.data.find((e: any) => e.displayName.includes('Anonymized'));
      expect(anonymizedEntry).toBeDefined();
    });
  });
});
