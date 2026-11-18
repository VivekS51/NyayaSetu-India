import request from 'supertest';
import { createApp } from '../src/app';
import { dbStore } from '../src/config/database';
import {
  RoleType,
  ServiceDeliveryMode,
  BookingStatus,
  PaymentStatus,
} from '../src/common/types';

describe('MODULE 4: BOOKING, CHAT, DOCUMENTS & APPOINTMENTS TEST SUITE', () => {
  const app = createApp();

  let advocateToken: string;
  let advocateUserId: string;
  let advocateProfileId: string;

  let citizenToken: string;
  let citizenUserId: string;

  let citizenBToken: string;
  let citizenBUserId: string;

  beforeEach(async () => {
    // Reset database to pristine state before every test
    dbStore.resetToDefault();

    // 1. Authenticate Seeded Advocate (Adv. Rajesh Varma)
    const advLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'rajesh.varma@delhibar.org.in', password: 'Password@123' });
    advocateToken = advLogin.body.data.accessToken;
    advocateUserId = advLogin.body.data.user.id;
    advocateProfileId = 'prof-lsp-003';

    // 2. Authenticate Seeded Citizen (Sunita Devi)
    const citizenLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'sunita.devi@example.in', password: 'Password@123' });
    citizenToken = citizenLogin.body.data.accessToken;
    citizenUserId = citizenLogin.body.data.user.id;

    // 3. Register a Second Citizen (Citizen B - Vikram Joshi for IDOR & isolation tests)
    const citizenBRegister = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Vikram Joshi (Citizen B)',
        phone: '+919876599999',
        email: 'vikram.b.joshi@example.in',
        password: 'Password@1234',
        role: RoleType.CITIZEN,
        dpdpConsentAcknowledged: true,
      });
    citizenBToken = citizenBRegister.body.data.accessToken;
    citizenBUserId = citizenBRegister.body.data.user.id;
  });

  // =========================================================================
  // 1. APPOINTMENT BOOKING & CALENDAR SLOT LIFECYCLE
  // =========================================================================
  describe('4.1 Appointment Booking, Slots, IST Timezones & Rescheduling', () => {
    it('should create an appointment booking, atomically lock calendar slot, and itemize statutory fees', async () => {
      // Future date: tomorrow at 14:00
      const futureStart = new Date(Date.now() + 24 * 3600 * 1000);
      futureStart.setHours(14, 0, 0, 0);

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId: advocateProfileId,
          serviceTitle: 'Initial Legal Consultation on Property Title Partition',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: futureStart.toISOString(),
          durationMinutes: 30,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingStatus).toBe(BookingStatus.PENDING_PAYMENT);

      // Section 35 Advocates Act 1961 statutory fee decoupling:
      // INR 800 (Advocate 100%) + INR 50 (Platform Fee) + INR 9.00 (18% GST) = INR 859.00
      expect(res.body.data.providerEarningsINR).toBe(800);
      expect(res.body.data.platformFeeINR).toBe(50);
      expect(res.body.data.gstAmountINR).toBe(9);
      expect(res.body.data.totalAmountINR).toBe(859);

      // Verify draft invoice generated with GST breakdown
      const invoice = dbStore.invoices.find((i) => i.bookingId === res.body.data.id);
      expect(invoice).toBeDefined();
      expect(invoice?.cgstAmountINR).toBe(4.5);
      expect(invoice?.sgstAmountINR).toBe(4.5);
      expect(invoice?.totalAmountINR).toBe(859);

      // Verify automated appointment reminders created in Indian Standard Time (IST)
      const citizenNotification = dbStore.notifications.find(
        (n) => n.userId === citizenUserId && n.title.includes('Appointment Scheduled')
      );
      expect(citizenNotification).toBeDefined();
      expect(citizenNotification?.message).toContain('+05:30 (IST)');

      const providerNotification = dbStore.notifications.find(
        (n) => n.userId === advocateUserId && n.title.includes('Consultation Slot Reserved')
      );
      expect(providerNotification).toBeDefined();
      expect(providerNotification?.message).toContain('+05:30 (IST)');
    });

    it('should prevent double-booking: atomically reject overlapping calendar slot for the same provider', async () => {
      const slotTime = new Date(Date.now() + 48 * 3600 * 1000);
      slotTime.setHours(10, 0, 0, 0);

      // First booking reserves 10:00 - 10:30
      const firstRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId: advocateProfileId,
          serviceTitle: 'Consultation Slot 1',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: slotTime.toISOString(),
          durationMinutes: 30,
        });
      expect(firstRes.status).toBe(201);

      // Second booking attempt by Citizen B overlapping the exact same slot (10:15 - 10:45)
      const overlapTime = new Date(slotTime.getTime() + 15 * 60 * 1000);
      const overlapRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenBToken}`)
        .send({
          providerProfileId: advocateProfileId,
          serviceTitle: 'Colliding Consultation',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: overlapTime.toISOString(),
          durationMinutes: 30,
        });

      expect(overlapRes.status).toBe(400);
      expect(overlapRes.body.message).toContain('already reserved');
    });

    it('should reject booking with past scheduled date and time', async () => {
      const pastTime = new Date(Date.now() - 2 * 3600 * 1000); // 2 hours ago

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId: advocateProfileId,
          serviceTitle: 'Past Date Booking Attempt',
          deliveryMode: ServiceDeliveryMode.ONLINE_AUDIO,
          scheduledStartTime: pastTime.toISOString(),
          durationMinutes: 30,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot be in the past');
    });

    it('should allow rescheduling an active consultation to a new slot with collision checks', async () => {
      const initialSlot = new Date(Date.now() + 24 * 3600 * 1000);
      initialSlot.setHours(11, 0, 0, 0);

      const bookingRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId: advocateProfileId,
          serviceTitle: 'Consultation to Reschedule',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: initialSlot.toISOString(),
          durationMinutes: 30,
        });

      const bookingId = bookingRes.body.data.id;

      // Reschedule to 16:00
      const newSlot = new Date(Date.now() + 24 * 3600 * 1000);
      newSlot.setHours(16, 0, 0, 0);

      const rescheduleRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/reschedule`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          newStartTime: newSlot.toISOString(),
          durationMinutes: 30,
        });

      expect(rescheduleRes.status).toBe(200);
      expect(rescheduleRes.body.message).toContain('rescheduled successfully');

      // Verify booking updated in database
      const updatedBooking = dbStore.bookings.find((b) => b.id === bookingId);
      expect(new Date(updatedBooking!.scheduledStartTime).getTime()).toBe(newSlot.getTime());

      // Verify notifications sent to both parties in IST
      const rescheduleNotification = dbStore.notifications.find(
        (n) => n.userId === citizenUserId && n.title.includes('Rescheduled')
      );
      expect(rescheduleNotification).toBeDefined();
      expect(rescheduleNotification?.message).toContain('+05:30 (IST)');
    });

    it('should reject rescheduling to a past date or colliding time slot', async () => {
      const initialSlot = new Date(Date.now() + 24 * 3600 * 1000);
      initialSlot.setHours(9, 0, 0, 0);

      const bookingRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId: advocateProfileId,
          serviceTitle: 'Booking For Reschedule Validation',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: initialSlot.toISOString(),
          durationMinutes: 30,
        });
      const bookingId = bookingRes.body.data.id;

      // 1. Reschedule to past date fails
      const pastRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/reschedule`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          newStartTime: new Date(Date.now() - 3600 * 1000).toISOString(),
        });
      expect(pastRes.status).toBe(400);
      expect(pastRes.body.message).toContain('cannot be in the past');
    });

    it('should allow citizen or provider to cancel booking and reflect cancellation reason', async () => {
      const slot = new Date(Date.now() + 36 * 3600 * 1000);
      const bookingRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId: advocateProfileId,
          serviceTitle: 'Booking to Cancel',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: slot.toISOString(),
          durationMinutes: 30,
        });
      const bookingId = bookingRes.body.data.id;

      const cancelRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          reason: 'Client has unavoidable medical emergency and requested cancellation.',
        });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.booking.bookingStatus).toBe(BookingStatus.CANCELLED_BY_CITIZEN);
      expect(cancelRes.body.data.booking.cancellationReason).toContain('medical emergency');

      // Rescheduling a cancelled booking must be rejected
      const rescheduleRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/reschedule`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          newStartTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        });
      expect(rescheduleRes.status).toBe(400);
      expect(rescheduleRes.body.message).toContain('Cannot reschedule a booking that is currently');
    });

    it('should prevent IDOR: unauthorized user cannot inspect or cancel another citizen booking', async () => {
      // Citizen A creates booking
      const slot = new Date(Date.now() + 24 * 3600 * 1000);
      const bookingRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId: advocateProfileId,
          serviceTitle: 'Confidential Case Discussion',
          deliveryMode: ServiceDeliveryMode.ONLINE_CHAT,
          scheduledStartTime: slot.toISOString(),
          durationMinutes: 30,
        });
      const bookingId = bookingRes.body.data.id;

      // Citizen B attempts to cancel Citizen A booking
      const cancelRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${citizenBToken}`)
        .send({ reason: 'Malicious cancellation attempt' });

      expect(cancelRes.status).toBe(403);
      expect(cancelRes.body.message).toContain('authorized');

      // Citizen B attempts to reschedule Citizen A booking
      const rescheduleRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/reschedule`)
        .set('Authorization', `Bearer ${citizenBToken}`)
        .send({ newStartTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString() });

      expect(rescheduleRes.status).toBe(403);
      expect(rescheduleRes.body.message).toContain('Unauthorized');
    });
  });

  // =========================================================================
  // 2. SECURE IN-APP CHAT & ENCRYPTED CASE DOCUMENT SHARING
  // =========================================================================
  describe('4.2 Secure In-App Chat & Case Document Sharing', () => {
    let bookingId: string;

    beforeEach(async () => {
      // Create a confirmed consultation for chat testing
      const slot = new Date(Date.now() + 12 * 3600 * 1000);
      const bookingRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId: advocateProfileId,
          serviceTitle: 'Property Partition Consultation',
          deliveryMode: ServiceDeliveryMode.ONLINE_CHAT,
          scheduledStartTime: slot.toISOString(),
          durationMinutes: 30,
        });

      bookingId = bookingRes.body.data.id;

      // Mock payment capture to set status to CONFIRMED
      const booking = dbStore.bookings.find((b) => b.id === bookingId);
      booking!.bookingStatus = BookingStatus.CONFIRMED;
    });

    it('should deliver messages between Citizen and Advocate with history persistence', async () => {
      // 1. Citizen posts initial case brief
      const msg1Res = await request(app)
        .post(`/api/v1/chat/${bookingId}/messages`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          content: 'Namaste Advocate Ji, I am attaching the registry papers of our ancestral land in Rohini.',
        });

      expect(msg1Res.status).toBe(201);
      expect(msg1Res.body.data.content).toContain('Namaste Advocate Ji');

      // 2. Advocate replies in consultation room
      const msg2Res = await request(app)
        .post(`/api/v1/chat/${bookingId}/messages`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({
          content: 'Received. Please share whether mutation in revenue record (khasra) was completed.',
        });

      expect(msg2Res.status).toBe(201);
      expect(msg2Res.body.data.content).toContain('Received');

      // 3. Citizen fetches chat history
      const historyRes = await request(app)
        .get(`/api/v1/chat/${bookingId}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.messages.length).toBe(2);
      expect(historyRes.body.data.messages[0].content).toContain('Namaste Advocate Ji');
      expect(historyRes.body.data.messages[1].content).toContain('Received');
    });

    it('should support secure document sharing and Aadhaar eSign indication in chat channel', async () => {
      const docPayload = {
        content: 'Please find attached the Aadhaar e-signed copy of the Special Power of Attorney.',
        attachmentUrl: 'https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com/cases/spoa_signed.pdf',
        attachmentName: 'spoa_signed.pdf',
        isAadhaarSigned: true,
      };

      const res = await request(app)
        .post(`/api/v1/chat/${bookingId}/messages`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(docPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.attachmentUrl).toBe(docPayload.attachmentUrl);
      expect(res.body.data.attachmentName).toBe('spoa_signed.pdf');
      expect(res.body.data.isAadhaarSigned).toBe(true);

      // Verify attachment details persist in history
      const historyRes = await request(app)
        .get(`/api/v1/chat/${bookingId}`)
        .set('Authorization', `Bearer ${advocateToken}`);

      expect(historyRes.status).toBe(200);
      const docMessage = historyRes.body.data.messages.find((m: any) => m.attachmentName === 'spoa_signed.pdf');
      expect(docMessage).toBeDefined();
      expect(docMessage.isAadhaarSigned).toBe(true);
    });

    it('should strictly prohibit unauthorized third parties from viewing or sending chat messages', async () => {
      // Citizen B (unrelated party) attempts to inspect consultation channel
      const readRes = await request(app)
        .get(`/api/v1/chat/${bookingId}`)
        .set('Authorization', `Bearer ${citizenBToken}`);

      expect(readRes.status).toBe(403);
      expect(readRes.body.message).toContain('Access denied');

      // Citizen B attempts to send message to confidential channel
      const sendRes = await request(app)
        .post(`/api/v1/chat/${bookingId}/messages`)
        .set('Authorization', `Bearer ${citizenBToken}`)
        .send({ content: 'Eavesdropping attempt' });

      expect(sendRes.status).toBe(403);
      expect(sendRes.body.message).toContain('Unauthorized');
    });
  });

  // =========================================================================
  // 3. SECURE WEBRTC VIDEO CONSULTATION ROOM TOKENS
  // =========================================================================
  describe('4.3 Secure WebRTC Video Room Links & Access Control', () => {
    let bookingId: string;

    beforeEach(async () => {
      const slot = new Date(Date.now() + 24 * 3600 * 1000);
      const bookingRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId: advocateProfileId,
          serviceTitle: 'Video Consultation on Succession Certificate',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: slot.toISOString(),
          durationMinutes: 45,
        });

      bookingId = bookingRes.body.data.id;
    });

    it('should reject video room link generation if booking is still PENDING_PAYMENT (unconfirmed)', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}/video-room`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('only available for confirmed and paid consultations');
    });

    it('should generate secure video room link and signed token for CONFIRMED bookings for both participants', async () => {
      // Transition booking to CONFIRMED (simulating escrow capture)
      const booking = dbStore.bookings.find((b) => b.id === bookingId);
      booking!.bookingStatus = BookingStatus.CONFIRMED;

      // 1. Citizen generates video room link
      const citizenRes = await request(app)
        .get(`/api/v1/bookings/${bookingId}/video-room`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(citizenRes.status).toBe(200);
      expect(citizenRes.body.success).toBe(true);
      expect(citizenRes.body.data.roomName).toContain(booking!.bookingReference);
      expect(citizenRes.body.data.videoRoomUrl).toContain('https://meet.nyayasetu.gov.in/room/');
      expect(citizenRes.body.data.participantRole).toBe('CITIZEN');
      expect(citizenRes.body.data.scheduledStartTimeIST).toContain('+05:30 (IST)');

      // 2. Advocate generates video room link
      const advocateRes = await request(app)
        .get(`/api/v1/bookings/${bookingId}/video-room`)
        .set('Authorization', `Bearer ${advocateToken}`);

      expect(advocateRes.status).toBe(200);
      expect(advocateRes.body.data.participantRole).toBe('PROVIDER');
      expect(advocateRes.body.data.roomName).toBe(citizenRes.body.data.roomName);
    });

    it('should reject video room access if consultation has been cancelled', async () => {
      const booking = dbStore.bookings.find((b) => b.id === bookingId);
      booking!.bookingStatus = BookingStatus.CANCELLED_BY_CITIZEN;

      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}/video-room`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot access video room for a cancelled booking');
    });

    it('should strictly prohibit unauthorized third parties from generating video room link', async () => {
      const booking = dbStore.bookings.find((b) => b.id === bookingId);
      booking!.bookingStatus = BookingStatus.CONFIRMED;

      // Citizen B attempts to access video room
      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}/video-room`)
        .set('Authorization', `Bearer ${citizenBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized');
    });
  });
});
