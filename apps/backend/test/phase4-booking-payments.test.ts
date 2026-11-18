import { createApp } from '../src/app';
import { dbStore } from '../src/config/database';
import { BookingStatus, PaymentStatus, RoleType, ServiceDeliveryMode } from '../src/common/types';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { ChatService } from '../src/modules/chat/chat.service';
import { ReviewsService } from '../src/modules/reviews/reviews.service';

async function runPhase4VerificationTests() {
  console.log('🧪 Starting Phase 4 Comprehensive Test Suite (Bookings, Escrow, Chat, Reviews)...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    const bookingsService = new BookingsService();
    const paymentsService = new PaymentsService();
    const chatService = new ChatService();
    const reviewsService = new ReviewsService();

    const citizenUser = dbStore.users.find((u) => u.phone === '+919812345678');
    const advocateProfile = dbStore.providerProfiles.find((p) => p.barRegistrationNo === 'D/1428/2012');
    const advocateUser = dbStore.users.find((u) => u.id === advocateProfile?.userId);

    assert(!!citizenUser && !!advocateProfile && !!advocateUser, 'Seeded citizen and advocate exist');

    // 1. Create Booking & Slot Lock
    console.log('[Test Suite 1: Booking Scheduling & Atomic Slot Locking]');
    const startTime = new Date(Date.now() + 48 * 3600 * 1000); // 2 days ahead

    const newBooking = await bookingsService.createBooking(citizenUser!.id, {
      providerProfileId: advocateProfile!.id,
      serviceTitle: 'Urgent Civil Title Revision Consultation',
      deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
      scheduledStartTime: startTime.toISOString(),
      durationMinutes: 30,
    });

    assert(newBooking.bookingStatus === BookingStatus.PENDING_PAYMENT, 'Booking initialized in PENDING_PAYMENT status');
    assert(newBooking.totalAmountINR === 859, 'Statutory fee accurately calculated (INR 800 advocate fee + INR 50 tech fee + 18% GST = INR 859)');
    assert(newBooking.providerEarningsINR === 800, '0% commission taken from legal fee (Sec 35 Advocates Act compliance)');

    // Test Double-Booking Prevention
    let doubleBookingBlocked = false;
    try {
      await bookingsService.createBooking(citizenUser!.id, {
        providerProfileId: advocateProfile!.id,
        serviceTitle: 'Colliding Booking Attempt',
        deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
        scheduledStartTime: new Date(startTime.getTime() + 10 * 60 * 1000).toISOString(), // 10 mins into same slot
        durationMinutes: 30,
      });
    } catch {
      doubleBookingBlocked = true;
    }
    assert(doubleBookingBlocked, 'Atomic slot locking successfully prevents calendar collisions');

    // 2. Payments & Escrow Capture
    console.log('\n[Test Suite 2: Razorpay/UPI Sandbox Payment & Escrow Lock]');
    const orderResult = await paymentsService.createPaymentOrder(citizenUser!.id, {
      bookingId: newBooking.id,
      gateway: 'RAZORPAY' as any,
    });
    assert(orderResult.orderId.startsWith('order_razorpay_'), 'Sandbox Razorpay order ID generated');
    assert(orderResult.amountINR === 859, 'Order matches itemized booking total');

    const captureResult = await paymentsService.verifyAndCapture(citizenUser!.id, {
      bookingId: newBooking.id,
      gatewayOrderId: orderResult.orderId,
      gatewayPaymentId: 'pay_rzp_mock_sandbox_771',
    });
    assert(captureResult.status === BookingStatus.CONFIRMED, 'Booking transitioned to CONFIRMED on escrow capture');
    assert(!!captureResult.conversationId, 'Secure consultation channel automatically initialized');

    // Verify Payment in Escrow
    const paymentRecord = dbStore.payments.find((p) => p.bookingId === newBooking.id);
    assert(paymentRecord?.status === PaymentStatus.CAPTURED_IN_ESCROW, 'Funds securely locked in platform escrow');

    // 3. Secure In-App Chat & Confidential Document Exchange
    console.log('\n[Test Suite 3: Secure Consultation Room & Document Vault]');
    const postMessageResult = await chatService.postMessage(newBooking.id, citizenUser!.id, {
      content: 'Hello Advocate, sharing the registered partition deed copy for preliminary examination.',
      attachmentUrl: 'https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com/vault/deed_reg_102.pdf',
      attachmentName: 'deed_reg_102.pdf',
      isAadhaarSigned: true,
    });
    assert(!!postMessageResult.id, 'Citizen message and encrypted document successfully posted to room');

    const chatHistory = await chatService.getConversationHistory(newBooking.id, advocateUser!.id);
    assert(chatHistory.messages.length >= 2, 'Conversation history contains system greeting and citizen message');

    const advocateReply = await chatService.postMessage(newBooking.id, advocateUser!.id, {
      content: 'Deed examined. The recitals are clear. See you on the secure video link tomorrow.',
    });
    assert(!!advocateReply.id, 'Advocate reply successfully dispatched');

    // 4. Booking Completion & Escrow Release
    console.log('\n[Test Suite 4: Service Completion & Escrow Release]');
    const initialAdvocateBalance = dbStore.wallets.find((w) => w.userId === advocateUser!.id)?.monetaryBalanceINR || 0;

    const completeResult = await bookingsService.completeBooking(newBooking.id, citizenUser!.id);
    assert(completeResult.booking.bookingStatus === BookingStatus.COMPLETED, 'Consultation status updated to COMPLETED');

    const updatedPayment = dbStore.payments.find((p) => p.bookingId === newBooking.id);
    assert(updatedPayment?.status === PaymentStatus.RELEASED_TO_PROVIDER, 'Escrow funds successfully released to provider');

    const updatedAdvocateWallet = dbStore.wallets.find((w) => w.userId === advocateUser!.id);
    assert(
      updatedAdvocateWallet?.monetaryBalanceINR === initialAdvocateBalance + 800,
      'Provider wallet accurately credited with full professional fee (INR 800)'
    );

    // 5. Verified Client Reviews & Trust Feedback
    console.log('\n[Test Suite 5: Verified Client Reviews & Activity Points]');
    const reviewResult = await reviewsService.createReview(citizenUser!.id, {
      bookingId: newBooking.id,
      rating: 5,
      feedbackText: 'Punctual, thorough, and gave clear legal counsel without any unnecessary litigation touting.',
    });
    assert(reviewResult.isVerifiedBooking === true, 'Review marked with verified client seal');
    assert(reviewResult.rating === 5, '5-star rating registered');

    // Provider responds to review
    const responseResult = await reviewsService.respondToReview(advocateUser!.id, reviewResult.id, {
      response: 'Thank you Sunita ji. Justice and ethical clarity are always our highest priority.',
    });
    assert(responseResult.providerResponse !== null, 'Provider response recorded');

    // Fetch public provider reviews
    const publicReviews = await reviewsService.getProviderReviews(advocateProfile!.id);
    assert(publicReviews.total >= 2, 'Provider reviews list contains both seeded and newly verified review');
    assert(publicReviews.averageRating >= 4.9, 'Average rating accurately computed from verified reviews');

    console.log('\n================================================================');
    console.log(`Phase 4 Test Execution Summary: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Phase 4 Test Suite encountered an error:', err);
    process.exit(1);
  }
}

runPhase4VerificationTests();

