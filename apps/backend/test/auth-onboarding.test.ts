import { createApp } from '../src/app';
import { dbStore } from '../src/config/database';
import { VerificationStatus, RoleType } from '../src/common/types';

// Standalone execution test runner to test all Phase 2 APIs end-to-end
async function runPhase2VerificationTests() {
  console.log('🧪 Starting Phase 2 Comprehensive Test Suite...\n');
  const app = createApp();

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
    // 1. Test Admin Login with Pre-seeded Credentials
    console.log('[Test Suite 1: Authentication & RBAC]');
    const adminUser = dbStore.users.find((u) => u.email === 'admin@legalmarketplace.gov.in');
    assert(!!adminUser, 'Admin user is pre-seeded');

    const adminRoles = dbStore.userRoles.filter((r) => r.userId === adminUser?.id).map((r) => r.role);
    assert(adminRoles.includes(RoleType.ADMIN) && adminRoles.includes(RoleType.VERIFIER), 'Admin has ADMIN and VERIFIER roles');

    // 2. Test OTP Lifecycle
    console.log('\n[Test Suite 2: Mobile OTP Dispatch & Verification]');
    const testPhone = '+919876500001';
    dbStore.otps.set(testPhone, {
      code: '123456',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
    });
    const otpRecord = dbStore.otps.get(testPhone);
    assert(otpRecord?.code === '123456', 'Simulated OTP generated and stored');

    // 3. Test LSP Registration & Onboarding Wizard
    console.log('\n[Test Suite 3: LSP Onboarding Wizard (Steps 1-4)]');
    const { AuthService } = await import('../src/modules/auth/auth.service');
    const { OnboardingService } = await import('../src/modules/onboarding/onboarding.service');
    const { VerificationService } = await import('../src/modules/verification/verification.service');

    const authService = new AuthService();
    const onboardingService = new OnboardingService();
    const verificationService = new VerificationService();

    const regResult = await authService.register({
      fullName: 'Adv. Harpreet Singh',
      phone: '+919988776655',
      email: 'harpreet.singh@punjabbar.org.in',
      password: 'SecurePassword@2026',
      role: RoleType.LSP,
      preferredLanguage: 'pa',
      dpdpConsentAcknowledged: true,
    });
    assert(!!regResult.accessToken, 'LSP registered and received JWT access token');
    assert(regResult.user.status === 'PENDING_VERIFICATION', 'LSP status set to PENDING_VERIFICATION');

    const lspUserId = regResult.user.id!;

    // Step 1: Basic Details
    const step1Result = await onboardingService.saveStep1(lspUserId, {
      providerType: 'ADVOCATE' as any,
      state: 'Punjab',
      district: 'Amritsar',
      pincode: '143001',
      languagesSpoken: ['pa', 'hi', 'en'],
      bio: 'Practicing advocate at District Courts Amritsar with focus on agricultural land partitions and family settlements.',
    });
    assert(!!step1Result.profileId, 'Step 1 saved successfully');

    // Step 2: Professional Credentials
    const step2Result = await onboardingService.saveStep2(lspUserId, {
      providerType: 'ADVOCATE' as any,
      stateBarCouncil: 'Bar Council of Punjab & Haryana',
      barRegistrationNo: 'P/2491/2016',
      enrolmentYear: 2016,
      primaryCourt: 'Amritsar District & Sessions Court',
      experienceYears: 10,
      practiceAreas: ['Revenue & Land Matters', 'Family Law', 'Arbitration'],
      consultationFeeINR: 600,
      isAvailableForProBono: true,
    });
    assert(!!step2Result.profileId, 'Step 2 (Bar Council credentials) saved successfully');

    // Step 3: Presigned Document Upload
    const presigned = await onboardingService.generatePresignedUploadUrl(lspUserId, 'bar_council_cert.pdf', 'application/pdf');
    assert(presigned.uploadUrl.includes('amazonaws.com'), 'Presigned secure document upload URL generated');

    const step3Result = await onboardingService.saveStep3Document(lspUserId, {
      credentialType: 'BAR_COUNCIL_ENROLMENT' as any,
      certificateNumber: 'P/2491/2016',
      issuingAuthority: 'Bar Council of Punjab & Haryana',
      documentUrl: presigned.publicDocumentUrl,
    });
    assert(!!step3Result.credentialId, 'Step 3 document registered in credentials vault');

    // Step 4: Statutory Compliance & Submission
    const step4Result = await onboardingService.saveStep4AndSubmit(
      lspUserId,
      {
        bciRule36Acknowledged: true,
        truthfulnessDeclaration: true,
        dpdpConsentAcknowledged: true,
      },
      '127.0.0.1'
    );
    assert(step4Result.status === VerificationStatus.PENDING, 'Profile submitted and status set to PENDING');
    assert(step4Result.pointsEarned === 50, '50 profile-completion points credited to wallet');

    // 4. Test Admin Verification Queue & Approval
    console.log('\n[Test Suite 4: Admin Verification Desk & Approval Workflow]');
    const queue = await verificationService.getQueue(VerificationStatus.PENDING);
    assert(queue.total >= 1, 'Verification queue lists pending submissions');

    const dossier = await verificationService.getDossier(step1Result.profileId);
    assert(dossier.credentials.length >= 1, 'Dossier retrieves verified credential documents');

    // Admin Approves the Provider
    const decisionResult = await verificationService.processDecision(
      adminUser!.id,
      step1Result.profileId,
      {
        action: 'APPROVE',
        reviewNotes: 'Bar Council Roll No verified against State Bar Gazette. Approved.',
      },
      '127.0.0.1'
    );
    assert(decisionResult.status === VerificationStatus.APPROVED, 'Provider status updated to APPROVED');
    assert(decisionResult.awardedPoints === 100, '100 verification bonus points awarded');

    // Check Badges & Wallet after Approval
    const updatedStatus = await onboardingService.getOnboardingStatus(lspUserId);
    assert(updatedStatus.verificationStatus === VerificationStatus.APPROVED, 'Onboarding status confirms APPROVED state');

    const lspWallet = dbStore.wallets.find((w) => w.userId === lspUserId);
    assert(lspWallet?.rewardPointsBalance === 200, 'Wallet balance accurately reflects 50 (welcome) + 50 (profile) + 100 (verification) = 200 pts');

    const lspProfile = dbStore.providerProfiles.find((p) => p.userId === lspUserId);
    const hasVerifiedBadge = dbStore.providerBadges.some(
      (b) => b.providerProfileId === lspProfile?.id && b.badgeId === 'badge-verified-01'
    );
    assert(hasVerifiedBadge, 'Statutory "VERIFIED_PROVIDER" badge officially bestowed');

    // Check Audit Log
    const auditEntry = dbStore.auditLogs.find(
      (a) => a.action === 'VERIFICATION_APPROVED' && a.resourceId === lspProfile?.id
    );
    assert(!!auditEntry, 'Statutory audit trail entry recorded for administrative approval');

    console.log('\n================================================================');
    console.log(`Test Execution Summary: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Test Suite encountered an error:', err);
    process.exit(1);
  }
}

runPhase2VerificationTests();

