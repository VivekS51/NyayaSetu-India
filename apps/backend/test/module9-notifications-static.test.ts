import request from 'supertest';
import { createApp } from '../src/app';
import { dbStore } from '../src/config/database';
import { RoleType, VerificationStatus, BookingStatus, ServiceDeliveryMode, PaymentStatus } from '../src/common/types';
import { notificationsService } from '../src/modules/notifications/notifications.service';

const app = createApp();

describe('MODULE 9: NOTIFICATIONS, STATIC PAGES & DPDP ACT COMPLIANCE', () => {
  let citizenToken: string;
  let citizenUserId: string;
  let citizenPhone = '+919876543210';

  let providerToken: string;
  let providerUserId: string;
  let providerProfileId = 'prof-lsp-003';
  let providerPhone = '+919711223344';

  let adminToken: string;
  let adminUserId: string;

  beforeEach(async () => {
    dbStore.resetToDefault();

    // 1. Citizen Login
    const citLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: '+919876543210', password: 'Password@123' });
    citizenToken = citLogin.body.data.accessToken;
    citizenUserId = citLogin.body.data.user.id;

    // 2. Provider Login (Advocate Rajesh Varma)
    const provLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: '+919711223344', password: 'Password@123' });
    providerToken = provLogin.body.data.accessToken;
    providerUserId = provLogin.body.data.user.id;

    // 3. Admin Login
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@legalmarketplace.gov.in', password: 'Password@123' });
    adminToken = adminLogin.body.data.accessToken;
    adminUserId = adminLogin.body.data.user.id;
  });

  describe('9.1 Multi-Channel Notifications (In-App, SMS, Email)', () => {
    it('should fetch user in-app notifications with pagination and unread counts', async () => {
      // Create test notifications
      await notificationsService.createNotification({
        userId: citizenUserId,
        title: 'Initial Test Notification 1',
        message: 'This is unread alert 1',
        type: 'SYSTEM',
      });
      await notificationsService.createNotification({
        userId: citizenUserId,
        title: 'Initial Test Notification 2',
        message: 'This is unread alert 2',
        type: 'BOOKING',
      });

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(2);
    });

    it('should filter notifications by unreadOnly query param', async () => {
      const notif1 = await notificationsService.createNotification({
        userId: citizenUserId,
        title: 'Unread Alert',
        message: 'Alert text',
        type: 'SYSTEM',
      });
      const notif2 = await notificationsService.createNotification({
        userId: citizenUserId,
        title: 'Read Alert',
        message: 'Alert text',
        type: 'SYSTEM',
      });
      notif2.isRead = true;

      const res = await request(app)
        .get('/api/v1/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      const unreadItems = res.body.data.items;
      expect(unreadItems.every((item: any) => item.isRead === false)).toBe(true);
      expect(unreadItems.some((item: any) => item.id === notif1.id)).toBe(true);
      expect(unreadItems.some((item: any) => item.id === notif2.id)).toBe(false);
    });

    it('should mark an individual notification as read', async () => {
      const notif = await notificationsService.createNotification({
        userId: citizenUserId,
        title: 'To Be Marked Read',
        message: 'Check this notification',
        type: 'SYSTEM',
      });

      const res = await request(app)
        .patch(`/api/v1/notifications/${notif.id}/read`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);

      // Verify in store
      const stored = dbStore.notifications.find((n) => n.id === notif.id);
      expect(stored?.isRead).toBe(true);
    });

    it('should prevent IDOR: user cannot mark another user notification as read', async () => {
      const providerNotif = await notificationsService.createNotification({
        userId: providerUserId,
        title: 'Advocate Confidential Notice',
        message: 'Secret message for advocate',
        type: 'VERIFICATION',
      });

      const res = await request(app)
        .patch(`/api/v1/notifications/${providerNotif.id}/read`)
        .set('Authorization', `Bearer ${citizenToken}`); // Citizen trying to mark advocate notification

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Notification not found or access denied');
    });

    it('should mark all notifications for a user as read', async () => {
      await notificationsService.createNotification({
        userId: citizenUserId,
        title: 'Alert A',
        message: 'Msg A',
        type: 'SYSTEM',
      });
      await notificationsService.createNotification({
        userId: citizenUserId,
        title: 'Alert B',
        message: 'Msg B',
        type: 'SYSTEM',
      });

      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.markedCount).toBeGreaterThanOrEqual(2);

      const checkRes = await request(app)
        .get('/api/v1/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(checkRes.body.data.unreadCount).toBe(0);
    });

    it('should track multi-channel SMS and Email communication logs for user', async () => {
      await notificationsService.dispatchMultiChannelNotification({
        userId: citizenUserId,
        title: 'Urgent Consultation Update',
        message: 'Your hearing document is ready for review.',
        type: 'BOOKING',
        channels: ['IN_APP', 'SMS', 'EMAIL'],
      });

      const res = await request(app)
        .get('/api/v1/notifications/logs')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const logs = res.body.data;
      expect(logs.length).toBeGreaterThanOrEqual(2); // At least SMS and Email
      expect(logs.some((l: any) => l.channel === 'SMS')).toBe(true);
      expect(logs.some((l: any) => l.channel === 'EMAIL')).toBe(true);
    });
  });

  describe('9.2 Notification Triggers Across Platform Lifecycle', () => {
    it('should trigger multi-channel welcome notification on user registration', async () => {
      const uniqueMobile = '+919999888877';
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Smt. Kavita Sharma',
          phone: uniqueMobile,
          email: 'kavita.sharma@example.gov.in',
          password: 'SecurePassword@2026',
          role: RoleType.CITIZEN,
          preferredLanguage: 'hi',
          dpdpConsentAcknowledged: true,
        });

      expect(regRes.status).toBe(201);
      const newUserId = regRes.body.data.user.id;

      // Verify in-app notification created
      const notif = dbStore.notifications.find(
        (n) => n.userId === newUserId && n.title.includes('Welcome')
      );
      expect(notif).toBeDefined();

      // Verify SMS & Email dispatched
      const commLogs = dbStore.communicationLogs.filter((l) => l.userId === newUserId);
      expect(commLogs.some((l) => l.channel === 'SMS' && l.recipient === uniqueMobile)).toBe(true);
      expect(commLogs.some((l) => l.channel === 'EMAIL')).toBe(true);
    });

    it('should trigger notification on provider credential verification decision', async () => {
      // prof-lsp-004 is seeded in PENDING status
      const targetProfile = dbStore.providerProfiles.find((p) => p.id === 'prof-lsp-004')!;
      const targetUserId = targetProfile.userId;

      // Admin requests clarification
      const clarifyRes = await request(app)
        .post(`/api/v1/admin/verification/${targetProfile.id}/decide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'REQUEST_MORE_INFO',
          reviewNotes: 'Please upload notarized copy of your Sanad certificate.',
        });
      expect(clarifyRes.status).toBe(200);

      const clarifyNotif = dbStore.notifications.find(
        (n) => n.userId === targetUserId && n.title.includes('Clarification')
      );
      expect(clarifyNotif).toBeDefined();

      // Admin approves verification
      const approveRes = await request(app)
        .post(`/api/v1/admin/verification/${targetProfile.id}/decide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'APPROVE',
          reviewNotes: 'Bar Council registration number verified in State Gazette.',
        });
      expect(approveRes.status).toBe(200);

      const approveNotif = dbStore.notifications.find(
        (n) => n.userId === targetUserId && n.title.includes('Verified')
      );
      expect(approveNotif).toBeDefined();
    });

    it('should trigger notifications on booking creation, rescheduling, and cancellation', async () => {
      // 1. Create booking
      const bookSlot = new Date(Date.now() + 30 * 3600 * 1000);
      bookSlot.setHours(10, 0, 0, 0);

      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId,
          serviceTitle: 'Bail Matter Urgent Advisory',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: bookSlot.toISOString(),
          durationMinutes: 60,
        });
      expect(bookRes.status).toBe(201);
      const bookingId = bookRes.body.data.id;
      const bookingRef = bookRes.body.data.bookingReference;

      // Both citizen and provider receive booking alert
      const citizenBookNotif = dbStore.notifications.find(
        (n) => n.userId === citizenUserId && n.type === 'BOOKING'
      );
      expect(citizenBookNotif).toBeDefined();

      const provBookNotif = dbStore.notifications.find(
        (n) => n.userId === providerUserId && n.type === 'BOOKING'
      );
      expect(provBookNotif).toBeDefined();

      // 2. Reschedule booking
      const newSlot = new Date(Date.now() + 35 * 3600 * 1000);
      newSlot.setHours(14, 0, 0, 0);
      const reschedRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/reschedule`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          newStartTime: newSlot.toISOString(),
          durationMinutes: 60,
        });
      expect(reschedRes.status).toBe(200);

      const reschedNotif = dbStore.notifications.find(
        (n) => n.userId === citizenUserId && n.title.includes('Rescheduled')
      );
      expect(reschedNotif).toBeDefined();

      // 3. Cancel booking
      const cancelRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ reason: 'Personal conflict; rescheduling later.' });
      expect(cancelRes.status).toBe(200);

      const cancelNotif = dbStore.notifications.find(
        (n) => n.userId === providerUserId && n.message.includes('cancelled')
      );
      expect(cancelNotif).toBeDefined();
    });

    it('should trigger notification on payment escrow capture and reward points credit', async () => {
      // Create booking
      const slot = new Date(Date.now() + 48 * 3600 * 1000);
      slot.setHours(11, 0, 0, 0);

      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId,
          serviceTitle: 'Property Registry Scrutiny',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: slot.toISOString(),
          durationMinutes: 60,
        });
      const bookingId = bookRes.body.data.id;

      // Create payment order
      const orderRes = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ bookingId, gateway: 'RAZORPAY' });
      expect(orderRes.status).toBe(201);

      const gatewayOrderId = orderRes.body.data.orderId;

      // Verify payment capture
      const payRes = await request(app)
        .post('/api/v1/payments/verify-capture')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          bookingId,
          gatewayPaymentId: 'pay_test_escrow_notif_999',
          gatewayOrderId,
        });
      expect(payRes.status).toBe(200);

      // Verify payment escrow notification
      const escrowNotif = dbStore.notifications.find(
        (n) => n.userId === citizenUserId && n.type === 'ESCROW'
      );
      expect(escrowNotif).toBeDefined();
      expect(escrowNotif?.message).toContain('escrow');

      // Verify reward notification (Citizen earns 10 loyalty points on payment)
      await notificationsService.triggerRewardNotification(
        citizenUserId,
        25,
        'Booking Milestone Achieved',
        'SILVER'
      );

      const rewardNotif = dbStore.notifications.find(
        (n) => n.userId === citizenUserId && n.type === 'INCENTIVE'
      );
      expect(rewardNotif).toBeDefined();
      expect(rewardNotif?.message).toContain('SILVER Tier');
    });
  });

  describe('9.3 Statutory Static Pages & Regulatory Compliance', () => {
    it('should serve Terms of Service with Bar Council Rule 36 and 0% advocate commission clause', async () => {
      const res = await request(app).get('/api/v1/terms');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.title).toContain('Terms of Service');
      expect(data.statutoryFramework).toContain('Bar Council of India Rules, Part VI, Chapter II, Section IV, Rule 36');
      expect(data.statutoryFramework).toContain('Advocates Act, 1961 (Section 35 & 49[1][ah])');
      expect(data.statutoryFramework).toContain('Information Technology Act, 2000 (Section 79 Intermediary Safe Harbor)');
      expect(data.coreTerms.platformStatus).toContain('NyayaSetu is not a law firm');
      expect(data.coreTerms.advocateFeeDecoupling).toContain('100% of the consultation and professional fee');
      expect(data.coreTerms.advocateFeeDecoupling).toContain('0% platform commission');
      expect(data.coreTerms.prohibitionOnTouting).toContain('best lawyer');
    });

    it('should serve Privacy Policy with DPDP Act 2023 mandate and domestic storage notice', async () => {
      const res = await request(app).get('/api/v1/privacy-policy');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.complianceStandard).toContain('Digital Personal Data Protection Act (DPDP Act), 2023');
      expect(data.dataSovereigntyLocation).toContain('Mumbai Data Center, Republic of India');
      expect(data.dataSovereigntyLocation).toContain('Zero Cross-Border Transfer');
      expect(data.citizenRights.rightToAccess).toBeDefined();
      expect(data.citizenRights.rightToCorrection).toBeDefined();
      expect(data.citizenRights.rightToErasure).toBeDefined();
      expect(data.citizenRights.rightToGrievanceRedressal).toBeDefined();
    });

    it('should serve Sovereign Escrow & Refund Policy with clear 100% refund criteria', async () => {
      const res = await request(app).get('/api/v1/refund-policy');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.statutoryCitation).toContain('Consumer Protection (E-Commerce) Rules 2020');
      expect(data.escrowMechanism).toContain('sovereign escrow');
      expect(data.refundScenarios.length).toBeGreaterThanOrEqual(3);
      expect(data.refundScenarios.some((s: any) => s.refundPercent === 100)).toBe(true);
      expect(data.turnaroundTime).toContain('3-5 banking days');
    });

    it('should serve Grievance Redressal Officer statutory details per Rule 3(2) IT Rules 2021', async () => {
      const res = await request(app).get('/api/v1/grievance');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.regulatoryMandate).toContain('Rule 3(2) Information Technology (Intermediary Guidelines) Rules, 2021');
      expect(data.officer.name).toBeDefined();
      expect(data.officer.designation).toContain('Grievance Redressal Officer');
      expect(data.officer.email).toContain('@nyayasetu.gov.in');
      expect(data.officer.helpline).toContain('+91');
      expect(data.officer.officeAddress).toContain('New Delhi');
      expect(data.escalationLevels.some((l: any) => l.authority.includes('Data Protection Board of India'))).toBe(true);
    });

    it('should serve statutory endpoints under /api/v1/compliance prefix aliases as well', async () => {
      const termsRes = await request(app).get('/api/v1/compliance/terms');
      expect(termsRes.status).toBe(200);

      const privacyRes = await request(app).get('/api/v1/compliance/privacy-policy');
      expect(privacyRes.status).toBe(200);

      const refundRes = await request(app).get('/api/v1/compliance/refund-policy');
      expect(refundRes.status).toBe(200);

      const grievanceRes = await request(app).get('/api/v1/compliance/grievance');
      expect(grievanceRes.status).toBe(200);
    });
  });

  describe('9.4 DPDP Act 2023: Consent, Right to Access & Right to Erasure', () => {
    it('should reject signup without explicit DPDP consent acknowledgement', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Test Non-Consenting User',
          phone: '+919988776655',
          email: 'noconsent@example.com',
          password: 'Password@123',
          role: RoleType.CITIZEN,
          // dpdpConsentAcknowledged omitted or false
          dpdpConsentAcknowledged: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('DPDP Act 2023');
    });

    it('should export machine-readable personal dossier pursuant to DPDP Act Section 11', async () => {
      const res = await request(app)
        .get('/api/v1/compliance/dpdp/export')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      // Verify metadata & structure
      expect(data.exportMetadata.dpdpActVersion).toBe('2023');
      expect(data.exportMetadata.userId).toBe(citizenUserId);
      expect(data.profile.phone).toBe(citizenPhone);
      expect(data.consultationBookings).toBeDefined();
      expect(data.paymentTransactions).toBeDefined();
      expect(data.walletAndLedger).toBeDefined();
      expect(data.statutoryAuditTrail).toBeDefined();

      // Verify statutory audit log entry was created
      const auditLog = dbStore.auditLogs.find(
        (a) => a.userId === citizenUserId && a.action === 'DPDP_DATA_EXPORT_REQUESTED'
      );
      expect(auditLog).toBeDefined();
    });

    it('should reject unauthenticated access to DPDP data export', async () => {
      const res = await request(app).get('/api/v1/compliance/dpdp/export');
      expect(res.status).toBe(401);
    });

    it('should prevent account erasure if active dispute or pending payment is in escrow', async () => {
      // Create a booking and put it into DISPUTED status
      const disputeSlot = new Date(Date.now() + 40 * 3600 * 1000);
      disputeSlot.setHours(15, 0, 0, 0);

      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId,
          serviceTitle: 'Consumer Forum Case Filing',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: disputeSlot.toISOString(),
          durationMinutes: 60,
        });
      const bookingId = bookRes.body.data.id;

      // Set booking status to DISPUTED
      const booking = dbStore.bookings.find((b) => b.id === bookingId)!;
      booking.bookingStatus = BookingStatus.DISPUTED;

      // Attempt account erasure
      const eraseRes = await request(app)
        .post('/api/v1/compliance/dpdp/erase')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(eraseRes.status).toBe(400);
      expect(eraseRes.body.message).toContain('active legal booking or grievance dispute');
    });

    it('should successfully anonymize PII and revoke sessions under DPDP Section 12 Right to Erasure', async () => {
      // Create a dedicated clean citizen for erasure test
      const uniqueMobile = '+919988112233';
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Shri Rameshwar Lal',
          phone: uniqueMobile,
          email: 'rameshwar.lal@erasuretest.in',
          password: 'Password@123',
          role: RoleType.CITIZEN,
          preferredLanguage: 'en',
          dpdpConsentAcknowledged: true,
        });
      const eraseToken = regRes.body.data.accessToken;
      const eraseUserId = regRes.body.data.user.id;

      // Request erasure
      const eraseRes = await request(app)
        .post('/api/v1/compliance/dpdp/erase')
        .set('Authorization', `Bearer ${eraseToken}`);

      expect(eraseRes.status).toBe(200);
      expect(eraseRes.body.success).toBe(true);
      expect(eraseRes.body.message).toContain('Section 12 DPDP Act 2023');

      // Verify PII is anonymized in store
      const user = dbStore.users.find((u) => u.id === eraseUserId)!;
      expect(user.fullName).toContain('Anonymized');
      expect(user.phone).not.toBe(uniqueMobile);
      expect(user.email).toContain('@erased.internal');
      expect(user.status).toBe('SUSPENDED');

      // Verify token revocation: subsequent authenticated requests fail
      const subsequentRes = await request(app)
        .get('/api/v1/compliance/dpdp/export')
        .set('Authorization', `Bearer ${eraseToken}`);
      expect(subsequentRes.status).toBe(401);

      // Verify erasure audit log
      const auditLog = dbStore.auditLogs.find(
        (a) => a.userId === eraseUserId && a.action === 'DPDP_ACCOUNT_ERASURE_COMPLETED'
      );
      expect(auditLog).toBeDefined();
    });
  });
});
