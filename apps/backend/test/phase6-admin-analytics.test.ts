import { dbStore } from '../src/config/database';
import { adminService } from '../src/modules/admin/admin.service';
import { notificationsService } from '../src/modules/notifications/notifications.service';
import { VerificationService } from '../src/modules/verification/verification.service';
import { AccountStatus, RoleType, VerificationStatus } from '../src/common/types';

async function runPhase6Tests() {
  console.log('🧪 Starting Phase 6 Test Suite (Admin Panel, Analytics, Dispute Redressal, Notifications)...\n');

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
    const adminUser = dbStore.users.find((u) => u.email === 'admin@legalmarketplace.gov.in');
    const citizenUser = dbStore.users.find((u) => u.id === 'usr-citizen-002');
    const advocateUser = dbStore.users.find((u) => u.id === 'usr-lsp-003');

    assert(!!adminUser, 'Admin user (Smt. Priya Sharma) exists');
    assert(!!citizenUser, 'Citizen user (Sunita Devi) exists');
    assert(!!advocateUser, 'Advocate user exists');

    // =========================================================================
    // 1. Analytics & Telemetry Engine
    // =========================================================================
    console.log('\n[Test Suite 1: GovTech Platform Analytics & Telemetry Engine]');
    const analytics = await adminService.getAnalyticsOverview();

    assert(analytics.summaryCards.totalCitizens >= 1, 'Analytics: Total citizens counted accurately');
    assert(analytics.summaryCards.totalProviders >= 2, 'Analytics: Multiple providers registered across categories');
    assert(analytics.summaryCards.activeEscrowHeldINR >= 409, 'Analytics: Active sovereign escrow tracked (>= ₹409)');
    assert(analytics.summaryCards.totalSettledEarningsINR >= 800, 'Analytics: Settled provider earnings computed (>= ₹800)');
    assert(analytics.summaryCards.platformTechFeeRevenueINR >= 50, 'Analytics: Platform technology fee accounted (>= ₹50)');
    assert(analytics.summaryCards.gstCollectedINR >= 9, 'Analytics: Statutory 18% GST tracked (>= ₹9)');
    assert(analytics.summaryCards.activeDisputes >= 1, 'Analytics: Active pending disputes identified');
    assert(analytics.summaryCards.averageClientRating >= 4.5, 'Analytics: Platform average rating computed');

    // Onboarding Funnel verification
    assert(analytics.onboardingFunnel.stages.length === 6, 'Funnel: 6 statutory onboarding milestones configured');
    assert(analytics.onboardingFunnel.stages[0].stage.includes('Registered'), 'Funnel: Stage 1 is Registered');
    assert(analytics.onboardingFunnel.stages[4].stage.includes('Admin Verified'), 'Funnel: Stage 5 is Admin Verified');

    // Provider statutory categories
    assert(analytics.providerCategories.advocates >= 1, 'Categories: Advocates enrolled');
    assert(analytics.providerCategories.notaries >= 1, 'Categories: Notaries enrolled');

    // Incentive engine efficacy & A/B testing
    assert(analytics.incentiveEngine.rules.length >= 4, 'Incentives: Active rules telemetry aggregated');
    const abRule = analytics.incentiveEngine.rules.find((r) => r.abGroup === 'A' || r.abGroup === 'B');
    assert(!!abRule, 'Incentives: A/B testing variant rule exists');

    // =========================================================================
    // 2. Provider Verification Queue & Dossier Review
    // =========================================================================
    console.log('\n[Test Suite 2: Provider Verification Queue & Administrative Decision]');
    const verificationService = new VerificationService();
    const queue = await verificationService.getQueue(VerificationStatus.PENDING);

    assert(queue.items.length >= 1, 'Verification Queue: Pending requests listed');
    const pendingApplicant = queue.items[0];
    assert(pendingApplicant.providerType !== undefined, 'Verification Queue: Applicant provider type populated');

    // Inspect dossier
    const dossier = await verificationService.getDossier(pendingApplicant.providerProfileId);
    assert(dossier.profile.id === pendingApplicant.providerProfileId, 'Verification Dossier: Profile matched');
    assert(dossier.credentials.length >= 1, 'Verification Dossier: Bar Council / Statutory credentials present');

    // Admin decision: Approve pending applicant
    const approvalResult = await verificationService.processDecision(
      adminUser!.id,
      pendingApplicant.providerProfileId,
      {
        action: 'APPROVE',
        reviewNotes: 'Bar Council of Tamil Nadu enrolment verified against online gazette.',
      }
    );
    assert(approvalResult.status === VerificationStatus.APPROVED, 'Verification: Applicant status transitioned to APPROVED');

    const updatedProfile = dbStore.providerProfiles.find((p) => p.id === pendingApplicant.providerProfileId);
    assert(updatedProfile?.verificationStatus === VerificationStatus.APPROVED, 'Verification: Profile marked APPROVED in database');

    // =========================================================================
    // 3. Citizen Escrow Dispute Redressal Desk
    // =========================================================================
    console.log('\n[Test Suite 3: Citizen Escrow Dispute Redressal Desk]');
    const disputesList = await adminService.getDisputes({ page: 1, limit: 10 });
    assert(disputesList.items.length >= 1, 'Disputes: Queue fetched successfully');

    const pendingDispute = disputesList.items.find((d) => d.status === 'PENDING_ADMIN_REVIEW');
    assert(!!pendingDispute, 'Disputes: Found open dispute awaiting administrative redressal');
    assert(pendingDispute!.reasonCode === 'PROVIDER_NO_SHOW', 'Disputes: Reason code matches PROVIDER_NO_SHOW');
    assert(pendingDispute!.escrowAmountINR === 409, 'Disputes: Escrow amount ₹409 locked in dispute');

    // Resolve dispute: Full Refund to Citizen
    const resolvedDispute = await adminService.resolveDispute(
      pendingDispute!.id,
      {
        action: 'REFUND_CITIZEN',
        resolutionNotes: 'Verified absence of notary on video consultation audit logs. Citizen granted full refund.',
      },
      adminUser!.id,
      '103.212.145.10'
    );

    assert(resolvedDispute.status === 'RESOLVED_REFUNDED', 'Dispute: Status transitioned to RESOLVED_REFUNDED');
    assert(resolvedDispute.resolvedAt !== null, 'Dispute: Resolution timestamp recorded');

    // Verify booking and payment status updated
    const disputedBooking = dbStore.bookings.find((b) => b.id === pendingDispute!.bookingId);
    const disputedPayment = dbStore.payments.find((p) => p.bookingId === pendingDispute!.bookingId);
    assert(disputedBooking?.bookingStatus === 'REFUNDED', 'Dispute: Booking status updated to REFUNDED');
    assert(disputedPayment?.status === 'REFUNDED', 'Dispute: Escrow payment status updated to REFUNDED');

    // Verify refund notification was dispatched to Citizen
    const citizenNotifications = await notificationsService.getUserNotifications(citizenUser!.id);
    const refundNotif = citizenNotifications.items.find((n) => n.title.includes('Refund'));
    assert(!!refundNotif, 'Dispute: Citizen received automated refund notification');

    // =========================================================================
    // 4. Incentive Rule Manager & A/B Configuration
    // =========================================================================
    console.log('\n[Test Suite 4: Incentive Rule Manager & A/B Testing Controls]');
    const rules = await adminService.getIncentiveRules();
    assert(rules.length >= 4, 'Incentive Rules: All rules retrieved');

    const targetRule = rules[0];
    const originalPoints = targetRule.pointsAwarded;

    const updatedRule = await adminService.updateIncentiveRule(
      targetRule.id,
      {
        pointsAwarded: originalPoints + 20,
        abTestGroup: 'B',
      },
      adminUser!.id
    );

    assert(updatedRule.pointsAwarded === originalPoints + 20, 'Incentive Rules: Points awarded updated dynamically');
    assert(updatedRule.abTestGroup === 'B', 'Incentive Rules: A/B testing cohort updated to Group B');

    // Reset back
    await adminService.updateIncentiveRule(
      targetRule.id,
      { pointsAwarded: originalPoints, abTestGroup: 'ALL' },
      adminUser!.id
    );

    // =========================================================================
    // 5. User Management & Account Governance
    // =========================================================================
    console.log('\n[Test Suite 5: User Management & Account Governance]');
    const usersList = await adminService.getUsers({ page: 1, limit: 10 });
    assert(usersList.items.length >= 3, 'User Management: Paginated user directory returned');

    // Test search filter
    const searchResult = await adminService.getUsers({ search: 'Sunita', page: 1, limit: 10 });
    assert(searchResult.items.length >= 1, 'User Management: Name search filter functional');
    assert(searchResult.items[0].fullName.includes('Sunita'), 'User Management: Filtered user matched query');

    // Suspend user
    const suspendResult = await adminService.updateUserStatus(
      citizenUser!.id,
      {
        status: AccountStatus.SUSPENDED,
        reason: 'Temporary hold for statutory KYC re-verification',
      },
      adminUser!.id,
      '127.0.0.1'
    );
    assert(suspendResult.status === AccountStatus.SUSPENDED, 'User Management: User status updated to SUSPENDED');

    // Reactivate user
    const activateResult = await adminService.updateUserStatus(
      citizenUser!.id,
      {
        status: AccountStatus.ACTIVE,
        reason: 'KYC identity verified via Aadhaar digital credential',
      },
      adminUser!.id,
      '127.0.0.1'
    );
    assert(activateResult.status === AccountStatus.ACTIVE, 'User Management: User restored to ACTIVE');

    // =========================================================================
    // 6. In-App Notifications Engine
    // =========================================================================
    console.log('\n[Test Suite 6: In-App Notifications Engine]');
    const notifs = await notificationsService.getUserNotifications(adminUser!.id, false);
    assert(notifs.items.length >= 1, 'Notifications: Admin notifications retrieved');

    // Mark single notification as read
    const firstUnread = notifs.items.find((n) => !n.isRead);
    if (firstUnread) {
      const readResult = await notificationsService.markAsRead(adminUser!.id, firstUnread.id);
      assert(readResult.isRead === true, 'Notifications: Single notification marked as read');
    }

    // Mark all as read
    const markAllResult = await notificationsService.markAllAsRead(adminUser!.id);
    assert(markAllResult.markedCount >= 0, 'Notifications: Mark all notifications as read executed');

    const updatedNotifs = await notificationsService.getUserNotifications(adminUser!.id, true);
    assert(updatedNotifs.items.length === 0, 'Notifications: Zero unread notifications remaining after markAllAsRead');

    // Create new notification
    const newNotif = await notificationsService.createNotification({
      userId: advocateUser!.id,
      title: 'Platform Maintenance Notice',
      message: 'Scheduled sovereign database backup tonight from 02:00 to 02:30 IST.',
      type: 'SYSTEM',
    });
    assert(newNotif.id.startsWith('notif-'), 'Notifications: System notification created with valid ID');

    // =========================================================================
    // 7. DPDP Act & Statutory Audit Logs Feed
    // =========================================================================
    console.log('\n[Test Suite 7: DPDP Act & Statutory Audit Logs Feed]');
    const auditLogs = await adminService.getAuditLogs(1, 20);
    assert(auditLogs.items.length >= 3, 'Audit Logs: Feed contains immutable audit events');
    const consentLog = auditLogs.items.find((l) => l.action.includes('CONSENT') || l.action.includes('DISPUTE'));
    assert(!!consentLog, 'Audit Logs: DPDP Act consent or statutory dispute action recorded');

    console.log(`\n========================================================`);
    console.log(`🎉 Phase 6 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test execution threw an unexpected error:', error);
    process.exit(1);
  }
}

runPhase6Tests();
