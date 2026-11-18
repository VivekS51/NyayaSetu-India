import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { dbStore, PaymentRecord, ConversationRecord, InvoiceRecord } from '../../config/database';
import { PaymentStatus, BookingStatus, PointsType, RoleType } from '../../common/types';
import { CreatePaymentOrderInput, VerifyCaptureInput, FailPaymentInput } from './payments.dto';
import { envConfig } from '../../config/env.config';
import { notificationsService } from '../notifications/notifications.service';

export class PaymentsService {
  public async createPaymentOrder(citizenId: string, input: CreatePaymentOrderInput) {
    const booking = dbStore.bookings.find((b) => b.id === input.bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.citizenId !== citizenId) {
      throw new Error('Unauthorized: You can only initiate payment for your own bookings.');
    }

    if (booking.bookingStatus !== BookingStatus.PENDING_PAYMENT) {
      throw new Error(`Booking is not pending payment (Current status: ${booking.bookingStatus})`);
    }

    const orderId = `order_${input.gateway.toLowerCase()}_${uuidv4().substring(0, 12)}`;
    const now = new Date();

    // Check if an existing payment record exists for this booking
    let payment = dbStore.payments.find((p) => p.bookingId === booking.id);

    if (payment) {
      payment.gateway = input.gateway;
      payment.gatewayOrderId = orderId;
      payment.status = PaymentStatus.INITIATED;
      payment.updatedAt = now;
    } else {
      payment = {
        id: uuidv4(),
        bookingId: booking.id,
        amountINR: booking.totalAmountINR,
        status: PaymentStatus.INITIATED,
        gateway: input.gateway,
        gatewayOrderId: orderId,
        gatewayPaymentId: null,
        escrowCapturedAt: null,
        escrowReleasedAt: null,
        refundedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      dbStore.payments.push(payment);
    }

    return {
      orderId,
      amountINR: booking.totalAmountINR,
      currency: 'INR',
      bookingReference: booking.bookingReference,
      gateway: input.gateway,
      keyId: envConfig.razorpay.keyId || 'rzp_test_MOCK_KEY_2026',
      notes: {
        bookingId: booking.id,
        citizenId: booking.citizenId,
        providerProfileId: booking.providerProfileId,
        complianceDisclaimer:
          'Platform technology fee held in escrow pursuant to Indian marketplace guidelines and Section 35 Advocates Act 1961',
      },
    };
  }

  public async verifyAndCapture(citizenId: string, input: VerifyCaptureInput) {
    const booking = dbStore.bookings.find((b) => b.id === input.bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.citizenId !== citizenId) {
      throw new Error('Unauthorized: You can only verify payments for your own bookings.');
    }

    // Client-Side Amount Tampering Detection
    if (input.submittedAmountINR !== undefined && input.submittedAmountINR !== booking.totalAmountINR) {
      throw new Error(
        `Amount tampering detected: submitted amount ₹${input.submittedAmountINR} does not match booking total ₹${booking.totalAmountINR}`
      );
    }

    // Razorpay Signature Verification
    if (input.signature) {
      const secret = envConfig.razorpay.keySecret || 'mock_webhook_secret_2026';
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${input.gatewayOrderId}|${input.gatewayPaymentId}`)
        .digest('hex');

      const sigBuf = Buffer.from(input.signature, 'utf8');
      const expBuf = Buffer.from(expectedSignature, 'utf8');
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        throw new Error('Invalid payment signature verification failed');
      }
    }

    const payment = dbStore.payments.find((p) => p.bookingId === booking.id);
    if (!payment) throw new Error('Payment record not found for this booking');

    const now = new Date();

    // Capture in escrow
    payment.status = PaymentStatus.CAPTURED_IN_ESCROW;
    payment.gatewayPaymentId = input.gatewayPaymentId;
    payment.escrowCapturedAt = now;
    payment.updatedAt = now;

    // Transition booking status to CONFIRMED
    booking.bookingStatus = BookingStatus.CONFIRMED;
    booking.updatedAt = now;

    // Auto-Generate Statutory GST Tax Invoice (SAC 998211)
    let invoice = dbStore.invoices.find((i) => i.bookingId === booking.id);
    if (!invoice) {
      const cgst = Number((booking.gstAmountINR / 2).toFixed(2));
      const sgst = Number((booking.gstAmountINR / 2).toFixed(2));
      invoice = {
        id: uuidv4(),
        invoiceNumber: `INV-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        bookingId: booking.id,
        subTotalINR: booking.providerEarningsINR + booking.platformFeeINR,
        cgstAmountINR: cgst,
        sgstAmountINR: sgst,
        totalAmountINR: booking.totalAmountINR,
        sacCode: '998211',
        platformGstNumber: envConfig.compliance.platformGstNumber,
        providerEarningsINR: booking.providerEarningsINR,
        platformFeeINR: booking.platformFeeINR,
        statutoryNote:
          'Statutory legal fee paid 100% to legal practitioner pursuant to Section 35 Advocates Act 1961 (0% platform commission). Platform facilitation fee subjected to 18% GST (SAC 998211).',
        issuedAt: now,
      };
      dbStore.invoices.push(invoice);
    }

    // Open Secure In-App Communication Channel
    let conversation = dbStore.conversations.find((c) => c.bookingId === booking.id);
    if (!conversation) {
      conversation = {
        id: uuidv4(),
        bookingId: booking.id,
        isActive: true,
        createdAt: now,
      };
      dbStore.conversations.push(conversation);

      // System greeting message
      dbStore.messages.push({
        id: uuidv4(),
        conversationId: conversation.id,
        senderUserId: 'SYSTEM',
        content: `🔒 Secure Consultation Room initialized for Booking ${booking.bookingReference}. All shared case documents are end-to-end encrypted under DPDP Act 2023 regulations.`,
        isRead: false,
        attachmentUrl: null,
        attachmentName: null,
        sentAt: now,
      });
    }

    // Award Citizen 10 Loyalty Points for booking
    const citizenWallet = dbStore.wallets.find((w) => w.userId === citizenId);
    if (citizenWallet) {
      citizenWallet.rewardPointsBalance += 10;
      citizenWallet.updatedAt = now;

      dbStore.pointsLedger.push({
        id: uuidv4(),
        walletId: citizenWallet.id,
        points: 10,
        type: PointsType.CREDIT,
        referenceType: 'BOOKING_PAYMENT',
        referenceId: booking.id,
        description: 'Earned 10 loyalty points on consultation payment.',
        balanceAfter: citizenWallet.rewardPointsBalance,
        createdAt: now,
      });
    }

    // Trigger payment notification
    await notificationsService.triggerPaymentNotification(
      booking.citizenId,
      booking.totalAmountINR,
      booking.bookingReference,
      'ESCROW_HELD'
    );

    // Audit Log
    dbStore.auditLogs.push({
      id: uuidv4(),
      userId: citizenId,
      action: 'PAYMENT_CAPTURED_IN_ESCROW',
      resourceType: 'Payment',
      resourceId: payment.id,
      ipAddress: null,
      userAgent: null,
      diffPayload: {
        bookingId: booking.id,
        amountINR: payment.amountINR,
        gatewayPaymentId: input.gatewayPaymentId,
        invoiceNumber: invoice.invoiceNumber,
      },
      createdAt: now,
    });

    return {
      message: 'Payment verified and held securely in escrow. Appointment confirmed!',
      bookingReference: booking.bookingReference,
      status: BookingStatus.CONFIRMED,
      conversationId: conversation.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    };
  }

  public async recordPaymentFailure(citizenId: string, input: FailPaymentInput) {
    const booking = dbStore.bookings.find((b) => b.id === input.bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.citizenId !== citizenId) {
      throw new Error('Unauthorized: You can only record failures for your own bookings.');
    }

    let payment = dbStore.payments.find((p) => p.bookingId === booking.id);
    const now = new Date();

    if (!payment) {
      payment = {
        id: uuidv4(),
        bookingId: booking.id,
        amountINR: booking.totalAmountINR,
        status: PaymentStatus.FAILED,
        gateway: 'RAZORPAY',
        gatewayOrderId: null,
        gatewayPaymentId: null,
        escrowCapturedAt: null,
        escrowReleasedAt: null,
        refundedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      dbStore.payments.push(payment);
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.updatedAt = now;
    }

    dbStore.auditLogs.push({
      id: uuidv4(),
      userId: citizenId,
      action: 'PAYMENT_FAILED',
      resourceType: 'Payment',
      resourceId: payment.id,
      ipAddress: null,
      userAgent: null,
      diffPayload: { bookingId: booking.id, reason: input.reason },
      createdAt: now,
    });

    return {
      message: 'Payment marked as failed. You may retry payment.',
      status: PaymentStatus.FAILED,
      bookingReference: booking.bookingReference,
    };
  }

  public async handleWebhook(payload: any, signature: string | undefined, rawPayloadStr?: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || envConfig.razorpay.keySecret || 'mock_webhook_secret_2026';
    if (!signature) {
      throw new Error('Missing Razorpay webhook signature header');
    }

    const payloadString = rawPayloadStr || (typeof payload === 'string' ? payload : JSON.stringify(payload));
    const expectedSignature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new Error('Invalid webhook signature verification failed');
    }

    const eventId =
      payload.id ||
      payload.event_id ||
      (payload.payload?.payment?.entity?.id ? `${payload.event}_${payload.payload.payment.entity.id}` : null);

    if (!eventId) {
      throw new Error('Webhook payload missing event identifier');
    }

    // Replay Attack / Webhook Idempotency Check
    if (dbStore.processedWebhookEvents.has(eventId)) {
      return {
        success: true,
        message: 'Webhook event already processed (idempotent)',
        eventId,
        status: 'ALREADY_PROCESSED',
      };
    }

    dbStore.processedWebhookEvents.add(eventId);
    const now = new Date();

    const eventType = payload.event;
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const bookingId = paymentEntity?.notes?.bookingId || payload.payload?.order?.entity?.notes?.bookingId;

      let booking = bookingId ? dbStore.bookings.find((b) => b.id === bookingId) : null;
      if (!booking && paymentEntity?.order_id) {
        const p = dbStore.payments.find((pay) => pay.gatewayOrderId === paymentEntity.order_id);
        if (p) {
          booking = dbStore.bookings.find((b) => b.id === p.bookingId) || null;
        }
      }

      if (booking) {
        let payment = dbStore.payments.find((p) => p.bookingId === booking.id);
        if (!payment) {
          payment = {
            id: uuidv4(),
            bookingId: booking.id,
            amountINR: booking.totalAmountINR,
            status: PaymentStatus.CAPTURED_IN_ESCROW,
            gateway: 'RAZORPAY',
            gatewayOrderId: paymentEntity?.order_id || null,
            gatewayPaymentId: paymentEntity?.id || null,
            escrowCapturedAt: now,
            escrowReleasedAt: null,
            refundedAt: null,
            createdAt: now,
            updatedAt: now,
          };
          dbStore.payments.push(payment);
        } else {
          payment.status = PaymentStatus.CAPTURED_IN_ESCROW;
          payment.gatewayPaymentId = paymentEntity?.id || payment.gatewayPaymentId;
          payment.escrowCapturedAt = now;
          payment.updatedAt = now;
        }

        booking.bookingStatus = BookingStatus.CONFIRMED;
        booking.updatedAt = now;

        // Auto-Generate Invoice if not exists
        let invoice = dbStore.invoices.find((i) => i.bookingId === booking.id);
        if (!invoice) {
          const cgst = Number((booking.gstAmountINR / 2).toFixed(2));
          const sgst = Number((booking.gstAmountINR / 2).toFixed(2));
          invoice = {
            id: uuidv4(),
            invoiceNumber: `INV-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
            bookingId: booking.id,
            subTotalINR: booking.providerEarningsINR + booking.platformFeeINR,
            cgstAmountINR: cgst,
            sgstAmountINR: sgst,
            totalAmountINR: booking.totalAmountINR,
            sacCode: '998211',
            platformGstNumber: envConfig.compliance.platformGstNumber,
            providerEarningsINR: booking.providerEarningsINR,
            platformFeeINR: booking.platformFeeINR,
            statutoryNote:
              'Statutory legal fee paid 100% to legal practitioner pursuant to Section 35 Advocates Act 1961 (0% platform commission). Platform facilitation fee subjected to 18% GST (SAC 998211).',
            issuedAt: now,
          };
          dbStore.invoices.push(invoice);
        }

        // Open chat room
        let conversation = dbStore.conversations.find((c) => c.bookingId === booking.id);
        if (!conversation) {
          conversation = {
            id: uuidv4(),
            bookingId: booking.id,
            isActive: true,
            createdAt: now,
          };
          dbStore.conversations.push(conversation);
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const bookingId = paymentEntity?.notes?.bookingId;
      if (bookingId) {
        const payment = dbStore.payments.find((p) => p.bookingId === bookingId);
        if (payment) {
          payment.status = PaymentStatus.FAILED;
          payment.updatedAt = now;
        }
      }
    }

    return {
      success: true,
      event: eventType,
      eventId,
      status: 'PROCESSED',
    };
  }

  public async getInvoiceByBookingId(bookingId: string, currentUserId: string) {
    const booking = dbStore.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const providerProfile = dbStore.providerProfiles.find((p) => p.id === booking.providerProfileId);
    const userRoles = dbStore.userRoles.filter((r) => r.userId === currentUserId).map((r) => r.role);

    const isAuthorized =
      booking.citizenId === currentUserId ||
      providerProfile?.userId === currentUserId ||
      userRoles.includes(RoleType.ADMIN);

    if (!isAuthorized) {
      throw new Error('Unauthorized - Access denied to invoice details');
    }

    if (booking.bookingStatus === BookingStatus.PENDING_PAYMENT) {
      throw new Error('Tax invoice not generated yet for this booking (Pending Payment)');
    }

    const invoice = dbStore.invoices.find((i) => i.bookingId === booking.id);
    if (!invoice) {
      throw new Error('Tax invoice not generated yet for this booking');
    }

    const citizen = dbStore.users.find((u) => u.id === booking.citizenId);
    const providerUser = providerProfile ? dbStore.users.find((u) => u.id === providerProfile.userId) : null;

    return {
      invoice,
      taxBreakdown: {
        sacCode: invoice.sacCode || '998211',
        sacDescription: 'Legal consultancy and documentation services',
        providerFeeINR: booking.providerEarningsINR,
        platformFeeINR: booking.platformFeeINR,
        taxablePlatformFeeINR: booking.platformFeeINR,
        cgstPercent: 9,
        cgstAmountINR: invoice.cgstAmountINR,
        sgstPercent: 9,
        sgstAmountINR: invoice.sgstAmountINR,
        totalGstINR: Number((invoice.cgstAmountINR + invoice.sgstAmountINR).toFixed(2)),
        grandTotalINR: invoice.totalAmountINR,
      },
      statutoryCompliance: {
        bciRule36Compliant: true,
        advocatesAct1961Section35:
          '100% Consultation fee transferred to advocate with zero platform commission deduction',
        platformGstNumber: invoice.platformGstNumber || envConfig.compliance.platformGstNumber,
      },
      parties: {
        billedTo: citizen?.fullName || 'Client',
        legalPractitioner: providerUser?.fullName || 'Advocate',
        barRegistrationNo: providerProfile?.barRegistrationNo || 'N/A',
      },
    };
  }
}
