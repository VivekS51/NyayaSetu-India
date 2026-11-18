import request from 'supertest';
import { createApp } from '../src/app';
import { dbStore } from '../src/config/database';
import {
  RoleType,
  ProviderType,
  VerificationStatus,
  ServiceDeliveryMode,
  BookingStatus,
  PaymentStatus,
} from '../src/common/types';

describe('MODULE 6: REVIEWS AND TRUST TEST SUITE (Verified Reviews, Rating Bounds, Replies & Moderation)', () => {
  const app = createApp();

  // Test identities
  let citizenToken: string;
  let citizenUserId: string;

  let citizenBToken: string;
  let citizenBUserId: string;

  let advocateToken: string;
  let advocateUserId: string;
  let advocateProfileId: string;

  let advocateBToken: string;
  let advocateBUserId: string;
  let advocateBProfileId: string;

  let adminToken: string;
  let adminUserId: string;

  let slotCounter = 1;

  beforeAll(async () => {
    dbStore.resetToDefault();

    // 1. Primary Citizen (Sunita Devi)
    const citizenLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'sunita.devi@example.in', password: 'Password@123' });
    citizenToken = citizenLogin.body.data.accessToken;
    citizenUserId = citizenLogin.body.data.user.id;

    // 2. Citizen B (Vikram Joshi)
    const citizenBReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Vikram Joshi (Citizen B)',
        phone: '+919876599999',
        email: 'vikram.reviews.b@example.in',
        password: 'Password@1234',
        role: RoleType.CITIZEN,
        dpdpConsentAcknowledged: true,
      });
    citizenBToken = citizenBReg.body.data.accessToken;
    citizenBUserId = citizenBReg.body.data.user.id;

    // 3. Primary Advocate (Adv. Rajesh Varma)
    const advLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'rajesh.varma@delhibar.org.in', password: 'Password@123' });
    advocateToken = advLogin.body.data.accessToken;
    advocateUserId = advLogin.body.data.user.id;
    advocateProfileId = 'prof-lsp-003';

    // 4. Secondary Advocate (Advocate B - For IDOR isolation)
    const advBReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Advocate Sneha Roy',
        phone: '+919876588888',
        email: 'sneha.roy@kolkatabar.org.in',
        password: 'Password@1234',
        role: RoleType.LSP,
        dpdpConsentAcknowledged: true,
      });
    advocateBToken = advBReg.body.data.accessToken;
    advocateBUserId = advBReg.body.data.user.id;
    const pB = dbStore.providerProfiles.find((p) => p.userId === advocateBUserId);
    advocateBProfileId = pB!.id;
    pB!.providerType = ProviderType.ADVOCATE;
    pB!.verificationStatus = VerificationStatus.APPROVED;

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

  // Helper: Create a fresh booking in COMPLETED status
  async function createCompletedBooking(providerId: string = advocateProfileId) {
    slotCounter += 1;
    const slotTime = new Date(Date.now() + (200 + slotCounter * 24) * 3600 * 1000);
    slotTime.setHours(14, 0, 0, 0);

    const bRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        providerProfileId: providerId,
        serviceTitle: `Completed Consultation ${slotCounter}`,
        deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
        scheduledStartTime: slotTime.toISOString(),
        durationMinutes: 30,
      });

    const booking = bRes.body.data;

    // Pay and confirm
    await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ bookingId: booking.id });

    await request(app)
      .post('/api/v1/payments/verify-capture')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        bookingId: booking.id,
        gatewayOrderId: `ord_rev_${slotCounter}`,
        gatewayPaymentId: `pay_rev_${slotCounter}`,
      });

    // Mark completed
    await request(app)
      .post(`/api/v1/bookings/${booking.id}/complete`)
      .set('Authorization', `Bearer ${citizenToken}`);

    return booking;
  }

  // =========================================================================
  // SUB-SUITE 6.1: Verified Client Reviews & Eligibility Enforcement
  // =========================================================================
  describe('6.1 Verified Client Reviews & Eligibility Enforcement', () => {
    it('should allow a citizen to submit a 5-star verified review with feedback on a COMPLETED booking (HTTP 201)', async () => {
      const booking = await createCompletedBooking();

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          rating: 5,
          feedbackText: 'Outstanding guidance on Section 482 quashing petition. Very professional!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.isVerifiedBooking).toBe(true);
      expect(res.body.data.isFlagged).toBe(false);
      expect(res.body.data.bookingId).toBe(booking.id);
      expect(res.body.data.citizenId).toBe(citizenUserId);
      expect(res.body.data.providerProfileId).toBe(advocateProfileId);

      // Verify stored in dbStore
      const reviewInDb = dbStore.reviews.find((r) => r.id === res.body.data.id);
      expect(reviewInDb).toBeDefined();
      expect(reviewInDb?.rating).toBe(5);
    });

    it('should reject review submission by unauthorized citizen who did not book the consultation (IDOR - HTTP 403)', async () => {
      const booking = await createCompletedBooking();

      // Citizen B attempts to review Citizen A's booking
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenBToken}`)
        .send({
          bookingId: booking.id,
          rating: 1,
          feedbackText: 'Fake negative review from competitor attempt.',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unauthorized: You can only review consultations you personally booked');
    });

    it('should reject review submission on a booking that is still PENDING_PAYMENT (HTTP 400)', async () => {
      slotCounter += 1;
      const slotTime = new Date(Date.now() + (200 + slotCounter * 24) * 3600 * 1000);
      slotTime.setHours(15, 0, 0, 0);

      const bRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId: advocateProfileId,
          serviceTitle: 'Unpaid Consultation Case',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: slotTime.toISOString(),
          durationMinutes: 30,
        });

      const pendingBooking = bRes.body.data;

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: pendingBooking.id,
          rating: 4,
          feedbackText: 'Reviewing before even paying for consultation',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Reviews can only be submitted after consultation is officially completed');
    });

    it('should reject review submission on a booking that is CONFIRMED but not yet completed (HTTP 400)', async () => {
      slotCounter += 1;
      const slotTime = new Date(Date.now() + (200 + slotCounter * 24) * 3600 * 1000);
      slotTime.setHours(16, 0, 0, 0);

      const bRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId: advocateProfileId,
          serviceTitle: 'Confirmed But Incomplete Consultation',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: slotTime.toISOString(),
          durationMinutes: 30,
        });

      const booking = bRes.body.data;

      await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ bookingId: booking.id });
      await request(app)
        .post('/api/v1/payments/verify-capture')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          gatewayOrderId: 'ord_incomplete_01',
          gatewayPaymentId: 'pay_incomplete_01',
        });

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          rating: 3,
          feedbackText: 'Consultation has not taken place yet',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Reviews can only be submitted after consultation is officially completed');
    });

    it('should reject review submission on a CANCELLED booking (HTTP 400)', async () => {
      slotCounter += 1;
      const slotTime = new Date(Date.now() + (200 + slotCounter * 24) * 3600 * 1000);
      slotTime.setHours(17, 0, 0, 0);

      const bRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId: advocateProfileId,
          serviceTitle: 'Cancelled Consultation Case',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: slotTime.toISOString(),
          durationMinutes: 30,
        });

      const booking = bRes.body.data;

      await request(app)
        .post(`/api/v1/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ reason: 'Emergency clash' });

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          rating: 1,
          feedbackText: 'Trying to review cancelled booking',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Reviews can only be submitted after consultation is officially completed');
    });

    it('should reject review submission for non-existent booking ID (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: 'ghost-booking-999',
          rating: 5,
          feedbackText: 'Ghost review on non-existent booking',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Booking not found');
    });
  });

  // =========================================================================
  // SUB-SUITE 6.2: One Review Per Booking & Anti-Farming
  // =========================================================================
  describe('6.2 One Review Per Booking & Anti-Farming', () => {
    it('should reject duplicate review submission on the same completed consultation (HTTP 400)', async () => {
      const booking = await createCompletedBooking();

      // First review succeeds
      const firstRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          rating: 5,
          feedbackText: 'Initial legitimate 5-star review',
        });
      expect(firstRes.status).toBe(201);

      // Second review on identical booking must be rejected
      const secondRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          rating: 5,
          feedbackText: 'Attempting duplicate review farming on same booking',
        });

      expect(secondRes.status).toBe(400);
      expect(secondRes.body.message).toContain('A review has already been submitted for this consultation');
    });
  });

  // =========================================================================
  // SUB-SUITE 6.3: Rating Bounds & Input Sanitization
  // =========================================================================
  describe('6.3 Rating Bounds & Input Validation', () => {
    let completedBookingId: string;

    beforeAll(async () => {
      const b = await createCompletedBooking();
      completedBookingId = b.id;
    });

    it('should reject rating lower than 1 (e.g. 0 or negative) with Zod validation error (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: completedBookingId,
          rating: 0,
          feedbackText: 'Zero stars invalid rating',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Rating must be at least 1');
    });

    it('should reject rating higher than 5 (e.g. 6 or 10) with Zod validation error (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: completedBookingId,
          rating: 6,
          feedbackText: 'Six stars invalid rating',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Rating cannot exceed 5');
    });

    it('should reject fractional/float ratings (e.g. 4.5) with integer requirement error (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: completedBookingId,
          rating: 4.5,
          feedbackText: 'Float rating invalid',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Rating must be an integer');
    });

    it('should reject feedback text shorter than 5 characters (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: completedBookingId,
          rating: 4,
          feedbackText: 'Bad', // Less than 5 chars
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Feedback must be at least 5 characters');
    });

    it('should accept review without optional feedback text (only numerical rating) (HTTP 201)', async () => {
      const freshBooking = await createCompletedBooking();

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: freshBooking.id,
          rating: 4,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.feedbackText).toBeNull();
    });
  });

  // =========================================================================
  // SUB-SUITE 6.4: Provider Response & Professional Governance
  // =========================================================================
  describe('6.4 Provider Response & Professional Governance', () => {
    let reviewId: string;

    beforeAll(async () => {
      const booking = await createCompletedBooking(advocateProfileId);
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          rating: 5,
          feedbackText: 'Very helpful advocate who drafted our legal notice quickly.',
        });
      reviewId = res.body.data.id;
    });

    it('should allow the assigned provider to post a professional reply to the client review (HTTP 200)', async () => {
      const replyText =
        'Thank you Sunita ji for placing your trust in our chambers. Glad we could resolve the property notice expeditiously.';

      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/respond`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({ response: replyText });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.providerResponse).toBe(replyText);

      // Verify db update and audit log
      const r = dbStore.reviews.find((rev) => rev.id === reviewId);
      expect(r?.providerResponse).toBe(replyText);

      const audit = dbStore.auditLogs.find(
        (a) => a.resourceId === reviewId && a.action === 'REVIEW_RESPONSE_POSTED'
      );
      expect(audit).toBeDefined();
    });

    it('should prevent a different advocate from responding to another advocate review (IDOR - HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/respond`)
        .set('Authorization', `Bearer ${advocateBToken}`)
        .send({ response: 'Unauthorized response attempt by competitor' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized: You can only respond to reviews on your own profile');
    });

    it('should prevent a citizen from responding to reviews as an LSP (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/respond`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ response: 'Citizen attempting to reply as lawyer' });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // SUB-SUITE 6.5: Abuse Reporting, Content Flagging & Profile Sanitization
  // =========================================================================
  describe('6.5 Abuse Reporting, Content Flagging & Profile Sanitization', () => {
    let reviewToFlagId: string;

    beforeAll(async () => {
      const booking = await createCompletedBooking(advocateProfileId);
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          rating: 1,
          feedbackText: 'Unprofessional defamatory claim violating Bar Council guidelines.',
        });
      reviewToFlagId = res.body.data.id;
    });

    it('should allow advocate or citizen to flag an abusive review with reason (HTTP 200)', async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewToFlagId}/flag`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({ reason: 'Review contains defamatory language violating Bar Council decorum' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('Review flagged for administrative content moderation');

      const review = dbStore.reviews.find((r) => r.id === reviewToFlagId);
      expect(review?.isFlagged).toBe(true);

      const audit = dbStore.auditLogs.find(
        (a) => a.resourceId === reviewToFlagId && a.action === 'REVIEW_FLAGGED_ABUSE'
      );
      expect(audit).toBeDefined();
    });

    it('should automatically exclude the flagged review from the public provider reviews listing', async () => {
      const res = await request(app).get(`/api/v1/reviews/provider/${advocateProfileId}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      const flaggedFound = items.find((item: any) => item.id === reviewToFlagId);
      expect(flaggedFound).toBeUndefined(); // Excluded from public profile
    });
  });

  // =========================================================================
  // SUB-SUITE 6.6: Admin Moderation Queue & Resolution
  // =========================================================================
  describe('6.6 Admin Moderation Queue & Decision Workflow', () => {
    let flaggedReviewId: string;

    beforeAll(async () => {
      const booking = await createCompletedBooking(advocateProfileId);
      const rRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          rating: 2,
          feedbackText: 'Contested review to test admin moderation queue',
        });
      flaggedReviewId = rRes.body.data.id;

      await request(app)
        .post(`/api/v1/reviews/${flaggedReviewId}/flag`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({ reason: 'Contested statement' });
    });

    it('should allow platform admin to view the queue of flagged reviews (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/reviews/admin/flagged')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const target = res.body.data.find((r: any) => r.id === flaggedReviewId);
      expect(target).toBeDefined();
      expect(target.isFlagged).toBe(true);
      expect(target.bookingReference).toBeDefined();
    });

    it('should reject non-admin users from viewing the admin moderation queue (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/v1/reviews/admin/flagged')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should allow admin to moderate and RESTORE a wrongfully flagged review (HTTP 200)', async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/admin/${flaggedReviewId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'RESTORE',
          moderationNotes: 'Investigated by Grievance Officer: review constitutes bona fide client opinion.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.action).toBe('RESTORE');

      const review = dbStore.reviews.find((r) => r.id === flaggedReviewId);
      expect(review?.isFlagged).toBe(false);

      // Now it must reappear on the public feed
      const publicFeed = await request(app).get(`/api/v1/reviews/provider/${advocateProfileId}`);
      const restored = publicFeed.body.data.items.find((item: any) => item.id === flaggedReviewId);
      expect(restored).toBeDefined();
    });

    it('should allow admin to moderate and REMOVE an abusive/defamatory review (HTTP 200)', async () => {
      // Create and flag an abusive review
      const booking = await createCompletedBooking(advocateProfileId);
      const rRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          rating: 1,
          feedbackText: 'Truly abusive vulgar content needing immediate deletion',
        });
      const abusiveReviewId = rRes.body.data.id;

      await request(app)
        .post(`/api/v1/reviews/${abusiveReviewId}/flag`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({ reason: 'Abusive language violating ToS' });

      // Admin removes review
      const modRes = await request(app)
        .post(`/api/v1/reviews/admin/${abusiveReviewId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'REMOVE',
          moderationNotes: 'Confirmed violation of community guidelines. Permanently expunged.',
        });

      expect(modRes.status).toBe(200);
      expect(modRes.body.data.action).toBe('REMOVE');

      // Verify removed from database
      const foundInDb = dbStore.reviews.find((r) => r.id === abusiveReviewId);
      expect(foundInDb).toBeUndefined();

      // Audit log must record removal
      const audit = dbStore.auditLogs.find(
        (a) => a.resourceId === abusiveReviewId && a.action === 'REVIEW_MODERATED_REMOVE'
      );
      expect(audit).toBeDefined();
    });
  });

  // =========================================================================
  // SUB-SUITE 6.7: Public Feed, DPDP Act Privacy & Rating Computation
  // =========================================================================
  describe('6.7 Public Feed, DPDP Act Privacy & Rating Computation', () => {
    it('should mask client names in public reviews per DPDP Act 2023 regulations', async () => {
      const res = await request(app).get(`/api/v1/reviews/provider/${advocateProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      for (const item of res.body.data.items) {
        expect(item.clientName).toContain('Verified Client');
        // Must never reveal citizen full surname or phone number
        expect(item.clientName).not.toContain('+91');
        expect(item.clientName).not.toContain('sunita.devi@example.in');
      }
    });

    it('should accurately compute average rating across verified, non-flagged reviews', async () => {
      const res = await request(app).get(`/api/v1/reviews/provider/${advocateProfileId}`);

      expect(res.status).toBe(200);
      const { total, averageRating, items } = res.body.data;
      expect(total).toBeGreaterThan(0);
      expect(averageRating).toBeGreaterThanOrEqual(1.0);
      expect(averageRating).toBeLessThanOrEqual(5.0);

      const calculatedAvg =
        items.reduce((acc: number, cur: any) => acc + cur.rating, 0) / items.length;
      expect(averageRating).toBeCloseTo(calculatedAvg, 1);
    });

    it('should award provider 15 activity points in ledger when rating is >= 4 stars', async () => {
      const booking = await createCompletedBooking(advocateProfileId);

      const walletBefore = dbStore.wallets.find((w) => w.userId === advocateUserId);
      const pointsBefore = walletBefore?.rewardPointsBalance || 0;

      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          rating: 5,
          feedbackText: 'Pleased with the drafting quality and punctual service.',
        });

      const walletAfter = dbStore.wallets.find((w) => w.userId === advocateUserId);
      expect(walletAfter?.rewardPointsBalance).toBe(pointsBefore + 15);

      const ledgerEntry = dbStore.pointsLedger.find(
        (l) => l.walletId === walletAfter?.id && l.referenceType === 'HIGH_RATING_RECEIVED'
      );
      expect(ledgerEntry).toBeDefined();
      expect(ledgerEntry?.points).toBe(15);
    });
  });
});
