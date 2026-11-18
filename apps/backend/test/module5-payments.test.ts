import request from 'supertest';
import crypto from 'crypto';
import { createApp } from '../src/app';
import { dbStore } from '../src/config/database';
import { envConfig } from '../src/config/env.config';
import {
  RoleType,
  ProviderType,
  VerificationStatus,
  ServiceDeliveryMode,
  BookingStatus,
  PaymentStatus,
  PaymentGateway,
  DisputeStatus,
} from '../src/common/types';

describe('MODULE 5: PAYMENTS & ESCROW ENGINE (Razorpay Test Mode, Webhook Security & GST Invoices)', () => {
  const app = createApp();

  // Test identities
  let citizenToken: string;
  let citizenUserId: string;

  let citizenBToken: string;
  let citizenBUserId: string;

  let advocateToken: string;
  let advocateUserId: string;
  let advocateProfileId: string;

  let adminToken: string;
  let adminUserId: string;

  const webhookSecret = 'mock_webhook_secret_2026';

  beforeAll(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
    process.env.RAZORPAY_KEY_SECRET = webhookSecret;
    envConfig.razorpay.keySecret = webhookSecret;
    envConfig.razorpay.keyId = 'rzp_test_MOCK_KEY_2026';

    dbStore.resetToDefault();

    // 1. Primary Citizen (Sunita Devi)
    const citizenLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'sunita.devi@example.in', password: 'Password@123' });
    citizenToken = citizenLogin.body.data.accessToken;
    citizenUserId = citizenLogin.body.data.user.id;

    // 2. Citizen B (Unauthorized Third Party - Vikram Joshi)
    const citizenBReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Vikram Joshi (Citizen B)',
        phone: '+919876599999',
        email: 'vikram.payments.b@example.in',
        password: 'Password@1234',
        role: RoleType.CITIZEN,
        dpdpConsentAcknowledged: true,
      });
    citizenBToken = citizenBReg.body.data.accessToken;
    citizenBUserId = citizenBReg.body.data.user.id;

    // 3. Verified Advocate (Adv. Rajesh Varma)
    const advLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'rajesh.varma@delhibar.org.in', password: 'Password@123' });
    advocateToken = advLogin.body.data.accessToken;
    advocateUserId = advLogin.body.data.user.id;
    advocateProfileId = 'prof-lsp-003';

    // Ensure fee is 800
    const advProfile = dbStore.providerProfiles.find((p) => p.id === advocateProfileId);
    if (advProfile) {
      advProfile.consultationFeeINR = 800;
    }

    // 4. Admin User
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

  let bookingSlotCounter = 1;

  // Helper to create a fresh pending booking
  async function createPendingBooking(title: string = 'Property Title Consultation') {
    bookingSlotCounter += 1;
    const slotTime = new Date(Date.now() + (100 + bookingSlotCounter * 24) * 3600 * 1000);
    slotTime.setHours(10, 0, 0, 0);

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        providerProfileId: advocateProfileId,
        serviceTitle: title,
        deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
        scheduledStartTime: slotTime.toISOString(),
        durationMinutes: 30,
      });

    if (!res.body.data) {
      throw new Error(`Booking creation failed: ${res.status} - ${JSON.stringify(res.body)}`);
    }

    return res.body.data;
  }

  // =========================================================================
  // SUB-SUITE 5.1: Payment Order Creation & Statutory Math
  // =========================================================================
  describe('5.1 Payment Order Creation & Statutory Fee Decoupling', () => {
    it('should create a Razorpay sandbox payment order for a pending booking (HTTP 201)', async () => {
      const booking = await createPendingBooking('Sale Deed Vetting');

      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          gateway: PaymentGateway.RAZORPAY,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toMatch(/^order_razorpay_/);
      expect(res.body.data.currency).toBe('INR');
      expect(res.body.data.keyId).toBe('rzp_test_MOCK_KEY_2026');
      expect(res.body.data.bookingReference).toBe(booking.bookingReference);
      expect(res.body.data.notes.complianceDisclaimer).toContain('Section 35 Advocates Act 1961');
    });

    it('should accurately calculate statutory fee decoupling per Indian legal marketplace standards', async () => {
      const booking = await createPendingBooking('Civil Writ Consultation');

      // Provider fee: 800, Platform fee: 50, GST 18%: 9.00 -> Total: 859.00
      expect(booking.providerEarningsINR).toBe(800);
      expect(booking.platformFeeINR).toBe(50);
      expect(booking.gstAmountINR).toBe(9.0);
      expect(booking.totalAmountINR).toBe(859.0);

      const orderRes = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          gateway: PaymentGateway.RAZORPAY,
        });

      expect(orderRes.status).toBe(201);
      expect(orderRes.body.data.amountINR).toBe(859.0);

      // Verify payment record in dbStore is INITIATED
      const payment = dbStore.payments.find((p) => p.bookingId === booking.id);
      expect(payment).toBeDefined();
      expect(payment?.status).toBe(PaymentStatus.INITIATED);
      expect(payment?.amountINR).toBe(859.0);
    });

    it('should reject order creation attempt by unauthorized citizen (IDOR prevention - HTTP 403)', async () => {
      const booking = await createPendingBooking('Confidential Partition Suit');

      // Citizen B attempts to create payment order for Citizen A's booking
      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenBToken}`)
        .send({
          bookingId: booking.id,
          gateway: PaymentGateway.RAZORPAY,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unauthorized: You can only initiate payment for your own bookings');
    });

    it('should reject payment order creation if booking is already confirmed (HTTP 400)', async () => {
      const booking = await createPendingBooking('Already Paid Case');

      // Artificially confirm the booking
      const bRecord = dbStore.bookings.find((b) => b.id === booking.id);
      bRecord!.bookingStatus = BookingStatus.CONFIRMED;

      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          gateway: PaymentGateway.RAZORPAY,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Booking is not pending payment');
    });

    it('should reject payment order creation for non-existent booking ID (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: 'non-existent-booking-id-999',
          gateway: PaymentGateway.RAZORPAY,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Booking not found');
    });
  });

  // =========================================================================
  // SUB-SUITE 5.2: Payment Verification, Escrow Lock & Loyalty Points
  // =========================================================================
  describe('5.2 Payment Verification & Escrow Lock', () => {
    it('should verify payment capture, hold funds in sovereign escrow, confirm booking, and open encrypted chat', async () => {
      const booking = await createPendingBooking('Commercial Contract Review');

      // Generate order
      const orderRes = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ bookingId: booking.id, gateway: PaymentGateway.RAZORPAY });

      const orderId = orderRes.body.data.orderId;
      const paymentId = `pay_test_${Date.now()}`;

      // Verify and capture
      const verifyRes = await request(app)
        .post('/api/v1/payments/verify-capture')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.data.status).toBe(BookingStatus.CONFIRMED);
      expect(verifyRes.body.data.conversationId).toBeDefined();
      expect(verifyRes.body.data.invoiceNumber).toMatch(/^INV-2026-/);

      // Verify DB state
      const paymentRecord = dbStore.payments.find((p) => p.bookingId === booking.id);
      expect(paymentRecord?.status).toBe(PaymentStatus.CAPTURED_IN_ESCROW);
      expect(paymentRecord?.gatewayPaymentId).toBe(paymentId);
      expect(paymentRecord?.escrowCapturedAt).toBeDefined();

      const bookingRecord = dbStore.bookings.find((b) => b.id === booking.id);
      expect(bookingRecord?.bookingStatus).toBe(BookingStatus.CONFIRMED);

      // Verify chat conversation room created
      const conv = dbStore.conversations.find((c) => c.bookingId === booking.id);
      expect(conv).toBeDefined();
      expect(conv?.isActive).toBe(true);

      // Verify citizen awarded 10 loyalty points in wallet ledger
      const citizenWallet = dbStore.wallets.find((w) => w.userId === citizenUserId);
      expect(citizenWallet?.rewardPointsBalance).toBeGreaterThanOrEqual(10);
      const ledgerEntry = dbStore.pointsLedger.find(
        (l) => l.referenceId === booking.id && l.referenceType === 'BOOKING_PAYMENT'
      );
      expect(ledgerEntry).toBeDefined();
      expect(ledgerEntry?.points).toBe(10);
    });

    it('should successfully verify payment with authentic HMAC-SHA256 signature', async () => {
      const booking = await createPendingBooking('High Court Bail Petition');

      const orderRes = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ bookingId: booking.id });

      const orderId = orderRes.body.data.orderId;
      const paymentId = `pay_test_authentic_${Date.now()}`;

      // Compute genuine Razorpay payment signature: HMAC(orderId|paymentId, secret)
      const authenticSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const res = await request(app)
        .post('/api/v1/payments/verify-capture')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
          signature: authenticSignature,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should reject payment verification when HMAC signature is forged or invalid (HTTP 400)', async () => {
      const booking = await createPendingBooking('Forged Signature Attack Case');

      const orderRes = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ bookingId: booking.id });

      const orderId = orderRes.body.data.orderId;
      const paymentId = `pay_test_forged_${Date.now()}`;
      const forgedSignature = 'deadbeef00000000000000000000000000000000000000000000000000000000';

      const res = await request(app)
        .post('/api/v1/payments/verify-capture')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
          signature: forgedSignature,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid payment signature verification failed');
    });

    it('should reject payment verification attempt by an unauthorized citizen (HTTP 403)', async () => {
      const booking = await createPendingBooking('Unauthorized Capture Test');

      const res = await request(app)
        .post('/api/v1/payments/verify-capture')
        .set('Authorization', `Bearer ${citizenBToken}`)
        .send({
          bookingId: booking.id,
          gatewayOrderId: 'order_mock_123',
          gatewayPaymentId: 'pay_mock_123',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized: You can only verify payments for your own bookings');
    });
  });

  // =========================================================================
  // SUB-SUITE 5.3: Client-Side Amount Tampering Protection
  // =========================================================================
  describe('5.3 Client-Side Amount Tampering Detection', () => {
    it('should reject capture when client submits a discounted/tampered amount (HTTP 400)', async () => {
      const booking = await createPendingBooking('Tampered Amount Fraud Case');
      // True booking total is ₹859

      const orderRes = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ bookingId: booking.id });

      const orderId = orderRes.body.data.orderId;

      // Malicious client tries to verify with ₹100 instead of ₹859
      const res = await request(app)
        .post('/api/v1/payments/verify-capture')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          gatewayOrderId: orderId,
          gatewayPaymentId: 'pay_tamper_001',
          submittedAmountINR: 100.0, // Fraudulent amount
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Amount tampering detected');
      expect(res.body.message).toContain('submitted amount ₹100 does not match booking total ₹859');

      // Booking must remain PENDING_PAYMENT
      const bRecord = dbStore.bookings.find((b) => b.id === booking.id);
      expect(bRecord?.bookingStatus).toBe(BookingStatus.PENDING_PAYMENT);
    });

    it('should accept capture when submitted amount exactly matches the server calculated booking total', async () => {
      const booking = await createPendingBooking('Valid Exact Amount Consultation');

      const orderRes = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ bookingId: booking.id });

      const orderId = orderRes.body.data.orderId;

      const res = await request(app)
        .post('/api/v1/payments/verify-capture')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          gatewayOrderId: orderId,
          gatewayPaymentId: `pay_exact_${Date.now()}`,
          submittedAmountINR: 859.0, // Exact valid amount
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  // =========================================================================
  // SUB-SUITE 5.4: Razorpay Server-to-Server Webhooks & Signature Verification
  // =========================================================================
  describe('5.4 Razorpay Webhook HMAC Signature Verification', () => {
    it('should accept and process authentic payment.captured webhook from Razorpay', async () => {
      const booking = await createPendingBooking('Webhook Captured Booking');

      const webhookPayload = {
        id: `evt_test_${Date.now()}`,
        event: 'payment.captured',
        created_at: Math.floor(Date.now() / 1000),
        payload: {
          payment: {
            entity: {
              id: `pay_wh_${Date.now()}`,
              order_id: `order_wh_${Date.now()}`,
              amount: 85900, // paise
              currency: 'INR',
              status: 'captured',
              notes: {
                bookingId: booking.id,
              },
            },
          },
        },
      };

      const payloadStr = JSON.stringify(webhookPayload);
      const signature = crypto.createHmac('sha256', webhookSecret).update(payloadStr).digest('hex');

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PROCESSED');
      expect(res.body.data.event).toBe('payment.captured');

      // Verify side-effects: booking CONFIRMED, escrow captured, invoice generated
      const bookingRecord = dbStore.bookings.find((b) => b.id === booking.id);
      expect(bookingRecord?.bookingStatus).toBe(BookingStatus.CONFIRMED);

      const paymentRecord = dbStore.payments.find((p) => p.bookingId === booking.id);
      expect(paymentRecord?.status).toBe(PaymentStatus.CAPTURED_IN_ESCROW);

      const invoice = dbStore.invoices.find((i) => i.bookingId === booking.id);
      expect(invoice).toBeDefined();
    });

    it('should reject webhook request missing the x-razorpay-signature header (HTTP 400)', async () => {
      const webhookPayload = {
        id: `evt_unsigned_${Date.now()}`,
        event: 'payment.captured',
      };

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('Content-Type', 'application/json')
        .send(webhookPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Missing Razorpay webhook signature header');
    });

    it('should reject webhook request with forged or mismatched HMAC signature (HTTP 400)', async () => {
      const webhookPayload = {
        id: `evt_forged_${Date.now()}`,
        event: 'payment.captured',
      };

      const payloadStr = JSON.stringify(webhookPayload);
      const forgedSig = crypto.createHmac('sha256', 'wrong_secret_123').update(payloadStr).digest('hex');

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', forgedSig)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid webhook signature verification failed');
    });

    it('should process payment.failed webhook and mark payment as FAILED', async () => {
      const booking = await createPendingBooking('Webhook Failure Case');

      // First initiate payment
      await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ bookingId: booking.id });

      const webhookPayload = {
        id: `evt_fail_${Date.now()}`,
        event: 'payment.failed',
        created_at: Math.floor(Date.now() / 1000),
        payload: {
          payment: {
            entity: {
              id: `pay_failed_${Date.now()}`,
              notes: {
                bookingId: booking.id,
              },
            },
          },
        },
      };

      const payloadStr = JSON.stringify(webhookPayload);
      const signature = crypto.createHmac('sha256', webhookSecret).update(payloadStr).digest('hex');

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PROCESSED');

      const paymentRecord = dbStore.payments.find((p) => p.bookingId === booking.id);
      expect(paymentRecord?.status).toBe(PaymentStatus.FAILED);
    });
  });

  // =========================================================================
  // SUB-SUITE 5.5: Webhook Replay Attack Prevention (Idempotency)
  // =========================================================================
  describe('5.5 Webhook Replay Attack Prevention (Idempotency)', () => {
    it('should recognize replayed webhook event and return ALREADY_PROCESSED idempotently', async () => {
      const booking = await createPendingBooking('Replay Attack Test Case');
      const uniqueEventId = `evt_idempotent_${Date.now()}`;

      const webhookPayload = {
        id: uniqueEventId,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_idemp_${Date.now()}`,
              notes: { bookingId: booking.id },
            },
          },
        },
      };

      const payloadStr = JSON.stringify(webhookPayload);
      const signature = crypto.createHmac('sha256', webhookSecret).update(payloadStr).digest('hex');

      // 1. Initial transmission
      const firstRes = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(firstRes.status).toBe(200);
      expect(firstRes.body.data.status).toBe('PROCESSED');

      // 2. Replay transmission of identical webhook event
      const replayRes = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(payloadStr);

      expect(replayRes.status).toBe(200);
      expect(replayRes.body.data.status).toBe('ALREADY_PROCESSED');
      expect(replayRes.body.data.message).toContain('Webhook event already processed (idempotent)');
      expect(replayRes.body.data.eventId).toBe(uniqueEventId);
    });
  });

  // =========================================================================
  // SUB-SUITE 5.6: Failed Payments & Client-Side Recovery
  // =========================================================================
  describe('5.6 Failed and Cancelled Payments', () => {
    it('should record payment failure when citizen cancels checkout or card is declined', async () => {
      const booking = await createPendingBooking('Declined Card Booking');

      const res = await request(app)
        .post('/api/v1/payments/fail')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          reason: 'Customer closed Razorpay checkout modal before OTP entry',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(PaymentStatus.FAILED);

      const payment = dbStore.payments.find((p) => p.bookingId === booking.id);
      expect(payment?.status).toBe(PaymentStatus.FAILED);

      // Booking remains PENDING_PAYMENT to allow citizen to retry payment
      const bRecord = dbStore.bookings.find((b) => b.id === booking.id);
      expect(bRecord?.bookingStatus).toBe(BookingStatus.PENDING_PAYMENT);

      // Audit log must record the failure event
      const audit = dbStore.auditLogs.find(
        (a) => a.resourceId === payment?.id && a.action === 'PAYMENT_FAILED'
      );
      expect(audit).toBeDefined();
    });

    it('should prevent Citizen B from recording payment failure for Citizen A booking (HTTP 403)', async () => {
      const booking = await createPendingBooking('Unauthorized Failure Recording');

      const res = await request(app)
        .post('/api/v1/payments/fail')
        .set('Authorization', `Bearer ${citizenBToken}`)
        .send({
          bookingId: booking.id,
          reason: 'Malicious attempt to mark failure',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized: You can only record failures for your own bookings');
    });
  });

  // =========================================================================
  // SUB-SUITE 5.7: GST Tax Invoice Generation & Statutory Math
  // =========================================================================
  describe('5.7 GST Tax Invoice Generation & Statutory Math', () => {
    let confirmedBookingId: string;

    beforeAll(async () => {
      const booking = await createPendingBooking('Tax Invoice Verification Case');
      confirmedBookingId = booking.id;

      await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ bookingId: confirmedBookingId });

      await request(app)
        .post('/api/v1/payments/verify-capture')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: confirmedBookingId,
          gatewayOrderId: 'order_tax_inv_01',
          gatewayPaymentId: 'pay_tax_inv_01',
        });
    });

    it('should allow the booking citizen to retrieve GST tax invoice with full statutory tax breakdown (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/v1/payments/${confirmedBookingId}/invoice`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { invoice, taxBreakdown, statutoryCompliance, parties } = res.body.data;

      // Invoice metadata
      expect(invoice.invoiceNumber).toMatch(/^INV-2026-\d{6}$/);
      expect(invoice.totalAmountINR).toBe(859.0);

      // Statutory Tax Breakdown (SAC 998211)
      expect(taxBreakdown.sacCode).toBe('998211');
      expect(taxBreakdown.providerFeeINR).toBe(800.0);
      expect(taxBreakdown.platformFeeINR).toBe(50.0);
      expect(taxBreakdown.cgstPercent).toBe(9);
      expect(taxBreakdown.cgstAmountINR).toBe(4.5);
      expect(taxBreakdown.sgstPercent).toBe(9);
      expect(taxBreakdown.sgstAmountINR).toBe(4.5);
      expect(taxBreakdown.totalGstINR).toBe(9.0);
      expect(taxBreakdown.grandTotalINR).toBe(859.0);

      // Statutory Compliance: Advocates Act 1961 Section 35 (0% platform commission on legal fees)
      expect(statutoryCompliance.bciRule36Compliant).toBe(true);
      expect(statutoryCompliance.advocatesAct1961Section35).toContain('100% Consultation fee transferred to advocate');

      // Parties
      expect(parties.billedTo).toBe('Sunita Devi');
      expect(parties.legalPractitioner).toBe('Adv. Rajesh Varma');
    });

    it('should allow the assigned provider to retrieve the consultation tax invoice (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/v1/payments/${confirmedBookingId}/invoice`)
        .set('Authorization', `Bearer ${advocateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invoice.bookingId).toBe(confirmedBookingId);
    });

    it('should allow platform admin to inspect any tax invoice for audit (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/v1/payments/${confirmedBookingId}/invoice`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invoice.bookingId).toBe(confirmedBookingId);
    });

    it('should reject unauthorized citizen attempt to inspect another user invoice (IDOR protection - HTTP 403)', async () => {
      const res = await request(app)
        .get(`/api/v1/payments/${confirmedBookingId}/invoice`)
        .set('Authorization', `Bearer ${citizenBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized - Access denied to invoice details');
    });

    it('should return 404 when querying invoice for unconfirmed booking where invoice is not yet generated', async () => {
      const unconfirmedBooking = await createPendingBooking('Pending Unpaid Case');

      const res = await request(app)
        .get(`/api/v1/payments/${unconfirmedBooking.id}/invoice`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Tax invoice not generated yet');
    });
  });

  // =========================================================================
  // SUB-SUITE 5.8: Escrow Release on Completion & Dispute Freezing
  // =========================================================================
  describe('5.8 Escrow Release on Completion & Dispute Freezing', () => {
    it('should release escrow to provider wallet when consultation is marked completed', async () => {
      const booking = await createPendingBooking('Consultation for Completion');

      // Confirm payment into escrow
      await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ bookingId: booking.id });
      await request(app)
        .post('/api/v1/payments/verify-capture')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          gatewayOrderId: 'ord_complete_01',
          gatewayPaymentId: 'pay_complete_01',
        });

      const providerWalletBefore = dbStore.wallets.find((w) => w.userId === advocateUserId);
      const balanceBefore = providerWalletBefore?.monetaryBalanceINR || 0;

      // Mark consultation completed
      const completeRes = await request(app)
        .post(`/api/v1/bookings/${booking.id}/complete`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.message).toContain('Escrow released to provider wallet successfully');

      // Verify payment status changed to RELEASED_TO_PROVIDER
      const payment = dbStore.payments.find((p) => p.bookingId === booking.id);
      expect(payment?.status).toBe(PaymentStatus.RELEASED_TO_PROVIDER);
      expect(payment?.escrowReleasedAt).toBeDefined();

      // Verify provider wallet received 100% of advocate fee (₹800)
      const providerWalletAfter = dbStore.wallets.find((w) => w.userId === advocateUserId);
      expect(providerWalletAfter?.monetaryBalanceINR).toBe(balanceBefore + 800);
    });

    it('should initiate escrow refund when confirmed booking is cancelled', async () => {
      const booking = await createPendingBooking('Booking To Be Cancelled');

      await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ bookingId: booking.id });
      await request(app)
        .post('/api/v1/payments/verify-capture')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          gatewayOrderId: 'ord_cancel_01',
          gatewayPaymentId: 'pay_cancel_01',
        });

      // Cancel booking
      const cancelRes = await request(app)
        .post(`/api/v1/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ reason: 'Emergency rescheduling needed, requesting full refund' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.message).toContain('Escrow refund initiated');

      const payment = dbStore.payments.find((p) => p.bookingId === booking.id);
      expect(payment?.status).toBe(PaymentStatus.REFUNDED);
      expect(payment?.refundedAt).toBeDefined();
    });

    it('should freeze escrow when citizen raises a dispute and strictly block consultation completion', async () => {
      const booking = await createPendingBooking('Disputed Notary Affidavit Case');

      await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ bookingId: booking.id });
      await request(app)
        .post('/api/v1/payments/verify-capture')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId: booking.id,
          gatewayOrderId: 'ord_disp_01',
          gatewayPaymentId: 'pay_disp_01',
        });

      // Citizen raises dispute: provider was a no-show
      const disputeRes = await request(app)
        .post(`/api/v1/bookings/${booking.id}/dispute`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          reasonCode: 'PROVIDER_NO_SHOW',
          description: 'Advocate did not join the scheduled video consultation room. Waited 30 mins.',
        });

      expect(disputeRes.status).toBe(200);
      expect(disputeRes.body.data.message).toContain('Funds frozen in escrow pending grievance officer investigation');

      const bRecord = dbStore.bookings.find((b) => b.id === booking.id);
      expect(bRecord?.bookingStatus).toBe(BookingStatus.DISPUTED);

      // Attempting to complete consultation while under active dispute MUST be rejected
      const attemptCompleteRes = await request(app)
        .post(`/api/v1/bookings/${booking.id}/complete`)
        .set('Authorization', `Bearer ${advocateToken}`);

      expect(attemptCompleteRes.status).toBe(400);
      expect(attemptCompleteRes.body.message).toContain('Escrow is frozen while a formal dispute is actively open');

      // Escrow remains CAPTURED_IN_ESCROW and is NOT released to provider
      const payment = dbStore.payments.find((p) => p.bookingId === booking.id);
      expect(payment?.status).toBe(PaymentStatus.CAPTURED_IN_ESCROW);
      expect(payment?.escrowReleasedAt).toBeNull();
    });
  });
});
