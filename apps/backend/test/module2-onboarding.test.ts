import request from 'supertest';
import { createApp } from '../src/app';
import { dbStore } from '../src/config/database';
import {
  RoleType,
  ProviderType,
  VerificationStatus,
  CredentialType,
} from '../src/common/types';

describe('MODULE 2: LSP ONBOARDING & VERIFICATION TEST SUITE', () => {
  const app = createApp();

  let adminToken: string;
  let citizenToken: string;
  let lspToken: string;
  let lspUserId: string;
  let lspProfileId: string;

  beforeEach(async () => {
    // Reset database to pristine state before every test
    dbStore.resetToDefault();

    // 1. Authenticate Admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@legalmarketplace.gov.in', password: 'Password@123' });
    adminToken = adminLogin.body.data.accessToken;

    // 2. Authenticate Citizen
    const citizenLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'sunita.devi@example.in', password: 'Password@123' });
    citizenToken = citizenLogin.body.data.accessToken;

    // 3. Register a fresh Legal Service Provider (Advocate)
    const lspRegister = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Adv. Harish Salve',
        phone: '+919811002233',
        email: 'harish.salve@scba.in',
        password: 'AdvocatePassword@2026',
        role: RoleType.LSP,
        preferredLanguage: 'en',
        dpdpConsentAcknowledged: true,
      });

    lspToken = lspRegister.body.data.accessToken;
    lspUserId = lspRegister.body.data.user.id;

    // Find the LSP draft profile
    const profile = dbStore.providerProfiles.find((p) => p.userId === lspUserId);
    lspProfileId = profile!.id;
  });

  // =========================================================================
  // 1. MULTI-STEP ONBOARDING WIZARD (POSITIVE FLOWS)
  // =========================================================================
  describe('2.1 Multi-Step Onboarding Wizard - Positive Flows', () => {
    it('should complete Step 1 (Basic Details) and compute 25% progress', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding/step-1')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          providerType: ProviderType.ADVOCATE,
          state: 'Delhi',
          district: 'New Delhi',
          pincode: '110001',
          languagesSpoken: ['en', 'hi'],
          bio: 'Practicing Advocate before the Supreme Court of India with 15 years in constitutional law.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profileId).toBe(lspProfileId);

      // Verify status & progress
      const statusRes = await request(app)
        .get('/api/v1/onboarding/status')
        .set('Authorization', `Bearer ${lspToken}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.completedSteps).toBe(1);
      expect(statusRes.body.data.progressPercentage).toBe(25);
      expect(statusRes.body.data.profile.district).toBe('New Delhi');
    });

    it('should demonstrate save-and-resume persistence midway through onboarding', async () => {
      // Step 1 saved
      await request(app)
        .post('/api/v1/onboarding/step-1')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          providerType: ProviderType.ADVOCATE,
          state: 'Maharashtra',
          district: 'Mumbai',
          pincode: '400001',
          languagesSpoken: ['en', 'hi', 'pa'],
          bio: 'Legal counsel specializing in commercial disputes and arbitration.',
        });

      // Resume later: check saved values
      const resumeRes = await request(app)
        .get('/api/v1/onboarding/status')
        .set('Authorization', `Bearer ${lspToken}`);

      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.data.profile.state).toBe('Maharashtra');
      expect(resumeRes.body.data.profile.district).toBe('Mumbai');
      expect(resumeRes.body.data.profile.pincode).toBe('400001');
      expect(resumeRes.body.data.profile.languagesSpoken).toEqual(['en', 'hi', 'pa']);
      expect(resumeRes.body.data.verificationStatus).toBe(VerificationStatus.DRAFT);
    });

    it('should complete Step 2 for Advocate with valid Bar Council details and compute 50% progress', async () => {
      // Complete Step 1
      await request(app)
        .post('/api/v1/onboarding/step-1')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          providerType: ProviderType.ADVOCATE,
          state: 'Delhi',
          district: 'New Delhi',
          pincode: '110001',
          languagesSpoken: ['en', 'hi'],
        });

      // Complete Step 2
      const res = await request(app)
        .post('/api/v1/onboarding/step-2')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          providerType: ProviderType.ADVOCATE,
          stateBarCouncil: 'Bar Council of Delhi',
          barRegistrationNo: 'D/4567/2012',
          enrolmentYear: 2012,
          primaryCourt: 'Supreme Court of India',
          experienceYears: 14,
          practiceAreas: ['Constitutional Law', 'Commercial Litigation', 'Arbitration'],
          consultationFeeINR: 2000,
          isAvailableForProBono: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const statusRes = await request(app)
        .get('/api/v1/onboarding/status')
        .set('Authorization', `Bearer ${lspToken}`);

      expect(statusRes.body.data.completedSteps).toBe(2);
      expect(statusRes.body.data.progressPercentage).toBe(50);
      expect(statusRes.body.data.profile.barRegistrationNo).toBe('D/4567/2012');
    });

    it('should complete Step 2 for Notary with fee ceiling compliance (Notaries Act 1952)', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding/step-2')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          providerType: ProviderType.NOTARY,
          notaryAppointmentNo: 'NOTARY/DL/2019/889',
          primaryCourt: 'Tis Hazari District Court',
          experienceYears: 7,
          practiceAreas: ['Affidavits', 'Document Attestation', 'Agreements'],
          consultationFeeINR: 350, // <= 500 ceiling
          isAvailableForProBono: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should generate secure S3 presigned upload URL for valid PDF, JPEG, and PNG credential documents', async () => {
      const validFiles = [
        { fileName: 'bar_enrolment_cert.pdf', mimeType: 'application/pdf', fileSizeBytes: 1024 * 500 },
        { fileName: 'id_proof.jpg', mimeType: 'image/jpeg', fileSizeBytes: 1024 * 200 },
        { fileName: 'practice_certificate.png', mimeType: 'image/png', fileSizeBytes: 1024 * 300 },
      ];

      for (const file of validFiles) {
        const res = await request(app)
          .post('/api/v1/onboarding/step-3/upload-url')
          .set('Authorization', `Bearer ${lspToken}`)
          .send(file);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.uploadUrl).toContain('https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com');
        expect(res.body.data.uploadUrl).toContain('signature=mock_presigned_sig_2026');
        expect(res.body.data.expiresInSeconds).toBe(900); // 15 mins expiry
        expect(res.body.data.serverSideEncryption).toBe('AES256');
      }
    });

    it('should record Step 3 uploaded document and compute 75% progress', async () => {
      // Step 1
      await request(app).post('/api/v1/onboarding/step-1').set('Authorization', `Bearer ${lspToken}`).send({
        providerType: ProviderType.ADVOCATE,
        state: 'Delhi',
        district: 'New Delhi',
        pincode: '110001',
        languagesSpoken: ['en'],
      });

      // Step 2
      await request(app).post('/api/v1/onboarding/step-2').set('Authorization', `Bearer ${lspToken}`).send({
        providerType: ProviderType.ADVOCATE,
        stateBarCouncil: 'Bar Council of Delhi',
        barRegistrationNo: 'D/4567/2012',
        enrolmentYear: 2012,
        primaryCourt: 'Delhi High Court',
        experienceYears: 10,
        practiceAreas: ['Civil Litigation'],
        consultationFeeINR: 1500,
      });

      // Step 3 Document
      const res = await request(app)
        .post('/api/v1/onboarding/step-3/confirm-document')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          credentialType: CredentialType.BAR_COUNCIL_ENROLMENT,
          certificateNumber: 'D/4567/2012',
          issuingAuthority: 'Bar Council of Delhi',
          documentUrl: 'https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com/credentials/sample.pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.credentialId).toBeDefined();

      const statusRes = await request(app)
        .get('/api/v1/onboarding/status')
        .set('Authorization', `Bearer ${lspToken}`);

      expect(statusRes.body.data.completedSteps).toBe(3);
      expect(statusRes.body.data.progressPercentage).toBe(75);
    });

    it('should submit Step 4 statutory declarations, transition to PENDING, award 50 points, and log audit trail', async () => {
      // Steps 1, 2, 3
      await request(app).post('/api/v1/onboarding/step-1').set('Authorization', `Bearer ${lspToken}`).send({
        providerType: ProviderType.ADVOCATE,
        state: 'Delhi',
        district: 'New Delhi',
        pincode: '110001',
        languagesSpoken: ['en', 'hi'],
      });
      await request(app).post('/api/v1/onboarding/step-2').set('Authorization', `Bearer ${lspToken}`).send({
        providerType: ProviderType.ADVOCATE,
        stateBarCouncil: 'Bar Council of Delhi',
        barRegistrationNo: 'D/4567/2012',
        enrolmentYear: 2012,
        primaryCourt: 'Delhi High Court',
        experienceYears: 12,
        practiceAreas: ['Criminal Defense'],
        consultationFeeINR: 1200,
      });
      await request(app).post('/api/v1/onboarding/step-3/confirm-document').set('Authorization', `Bearer ${lspToken}`).send({
        credentialType: CredentialType.BAR_COUNCIL_ENROLMENT,
        certificateNumber: 'D/4567/2012',
        issuingAuthority: 'Bar Council of Delhi',
        documentUrl: 'https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com/credentials/sample.pdf',
      });

      // Step 4 Submit
      const res = await request(app)
        .post('/api/v1/onboarding/step-4/submit')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          bciRule36Acknowledged: true,
          truthfulnessDeclaration: true,
          dpdpConsentAcknowledged: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(VerificationStatus.PENDING);
      expect(res.body.data.pointsEarned).toBe(50);
      expect(res.body.data.verificationRequestId).toBeDefined();

      // Check Onboarding Status is 100%
      const statusRes = await request(app)
        .get('/api/v1/onboarding/status')
        .set('Authorization', `Bearer ${lspToken}`);
      expect(statusRes.body.data.progressPercentage).toBe(100);
      expect(statusRes.body.data.verificationStatus).toBe(VerificationStatus.PENDING);

      // Verify 50 points credited to wallet & double-entry ledger
      const wallet = dbStore.wallets.find((w) => w.userId === lspUserId);
      expect(wallet).toBeDefined();
      expect(wallet?.rewardPointsBalance).toBe(100); // 50 welcome + 50 onboarding

      const ledgerEntry = dbStore.pointsLedger.find((l) => l.referenceType === 'PROFILE_COMPLETION');
      expect(ledgerEntry).toBeDefined();
      expect(ledgerEntry?.points).toBe(50);

      // Verify Audit Log entry created with DPDP compliance payload
      const auditLog = dbStore.auditLogs.find((a) => a.action === 'LSP_ONBOARDING_SUBMITTED');
      expect(auditLog).toBeDefined();
      expect(auditLog?.userId).toBe(lspUserId);
      expect(auditLog?.diffPayload?.bciRule36Consent).toBe(true);
      expect(auditLog?.diffPayload?.dpdpConsent).toBe(true);
    });
  });

  // =========================================================================
  // 2. MULTI-STEP ONBOARDING WIZARD (NEGATIVE VALIDATION TESTS)
  // =========================================================================
  describe('2.2 Multi-Step Onboarding Wizard - Negative Validation', () => {
    it('should reject Step 1 when state, district, or languages are missing or empty', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding/step-1')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          providerType: ProviderType.ADVOCATE,
          state: '',
          district: '',
          pincode: '110001',
          languagesSpoken: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid Indian postal PIN codes (non-6 digits, non-numeric)', async () => {
      const invalidPincodes = ['12345', '1100001', 'PINCOD', '11 001'];

      for (const pincode of invalidPincodes) {
        const res = await request(app)
          .post('/api/v1/onboarding/step-1')
          .set('Authorization', `Bearer ${lspToken}`)
          .send({
            providerType: ProviderType.ADVOCATE,
            state: 'Delhi',
            district: 'New Delhi',
            pincode,
            languagesSpoken: ['en'],
          });

        expect(res.status).toBe(400);
      }
    });

    it('should strictly reject promotional claims and touting violating BCI Rule 36 in provider bio', async () => {
      const prohibitedBios = [
        'I am the best lawyer in Delhi High Court with 100% success rate.',
        'Guaranteed win in all criminal bail matters.',
        'No. 1 advocate in property dispute settlements.',
        'The cheapest advocate in Tis Hazari Court.',
        'Top lawyer and famous attorney for supreme court appeals.',
      ];

      for (const bio of prohibitedBios) {
        const res = await request(app)
          .post('/api/v1/onboarding/step-1')
          .set('Authorization', `Bearer ${lspToken}`)
          .send({
            providerType: ProviderType.ADVOCATE,
            state: 'Delhi',
            district: 'Central Delhi',
            pincode: '110001',
            languagesSpoken: ['en'],
            bio,
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('BCI Rule 36 Violation');
      }
    });

    it('should reject Step 2 for Advocate when State Bar Council or Bar Registration Number is omitted', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding/step-2')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          providerType: ProviderType.ADVOCATE,
          primaryCourt: 'Delhi High Court',
          experienceYears: 5,
          practiceAreas: ['Civil'],
          consultationFeeINR: 1000,
          // Missing stateBarCouncil, barRegistrationNo, enrolmentYear
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Advocates must provide State Bar Council');
    });

    it('should reject Step 2 for Notary when Notary Appointment Number is omitted', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding/step-2')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          providerType: ProviderType.NOTARY,
          primaryCourt: 'District Court',
          experienceYears: 5,
          practiceAreas: ['Affidavits'],
          consultationFeeINR: 200,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Notaries must provide official Notary Appointment');
    });

    it('should reject Notary consultation fee exceeding statutory limit (Notaries Act 1952 ceiling)', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding/step-2')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          providerType: ProviderType.NOTARY,
          notaryAppointmentNo: 'NOTARY/DL/2021/100',
          primaryCourt: 'Rohini Court',
          experienceYears: 4,
          practiceAreas: ['Notarial Acts'],
          consultationFeeINR: 900, // Exceeds statutory ceiling of 500
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Notaries Act 1952 Guardrail');
    });

    it('should prevent duplicate Bar Council Registration Number across different providers', async () => {
      // Seed advocate Adv. Rajesh Varma has 'D/1428/2012'
      const res = await request(app)
        .post('/api/v1/onboarding/step-2')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          providerType: ProviderType.ADVOCATE,
          stateBarCouncil: 'Bar Council of Delhi',
          barRegistrationNo: 'D/1428/2012', // Already registered by Adv. Rajesh Varma
          enrolmentYear: 2012,
          primaryCourt: 'Delhi High Court',
          experienceYears: 10,
          practiceAreas: ['Civil'],
          consultationFeeINR: 1000,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already registered on this platform');
    });

    it('should reject presigned upload URL request with wrong file MIME type', async () => {
      const invalidMimeTypes = ['text/plain', 'application/zip', 'application/x-msdownload', 'video/mp4'];

      for (const mimeType of invalidMimeTypes) {
        const res = await request(app)
          .post('/api/v1/onboarding/step-3/upload-url')
          .set('Authorization', `Bearer ${lspToken}`)
          .send({ fileName: 'document.pdf', mimeType, fileSizeBytes: 1024 });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Only PDF, JPEG, and PNG');
      }
    });

    it('should reject presigned upload URL request with forbidden executable or script extensions', async () => {
      const dangerousFiles = [
        { fileName: 'malware.exe', mimeType: 'application/pdf' },
        { fileName: 'script.sh', mimeType: 'application/pdf' },
        { fileName: 'backdoor.php', mimeType: 'image/jpeg' },
        { fileName: 'exploit.js', mimeType: 'image/png' },
      ];

      for (const file of dangerousFiles) {
        const res = await request(app)
          .post('/api/v1/onboarding/step-3/upload-url')
          .set('Authorization', `Bearer ${lspToken}`)
          .send(file);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Executable or script files are strictly prohibited');
      }
    });

    it('should reject presigned upload URL request with path traversal sequences in file name', async () => {
      const maliciousNames = [
        '../../etc/passwd.pdf',
        '..\\..\\Windows\\win.ini.pdf',
        'sub/folder/cert.pdf',
        'payload\0cert.pdf',
      ];

      for (const fileName of maliciousNames) {
        const res = await request(app)
          .post('/api/v1/onboarding/step-3/upload-url')
          .set('Authorization', `Bearer ${lspToken}`)
          .send({ fileName, mimeType: 'application/pdf' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Malicious or illegal file name detected');
      }
    });

    it('should reject empty files (0 bytes) and files exceeding 10 MB limit', async () => {
      // 1. Empty file
      const emptyRes = await request(app)
        .post('/api/v1/onboarding/step-3/upload-url')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({ fileName: 'empty.pdf', mimeType: 'application/pdf', fileSizeBytes: 0 });

      expect(emptyRes.status).toBe(400);
      expect(emptyRes.body.message).toContain('Empty file detected');

      // 2. Oversized file (11 MB)
      const oversizedRes = await request(app)
        .post('/api/v1/onboarding/step-3/upload-url')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({ fileName: 'huge.pdf', mimeType: 'application/pdf', fileSizeBytes: 11 * 1024 * 1024 });

      expect(oversizedRes.status).toBe(400);
      expect(oversizedRes.body.message).toContain('exceeds maximum allowable limit');
    });

    it('should prevent duplicate document upload on the same provider profile', async () => {
      const documentPayload = {
        credentialType: CredentialType.BAR_COUNCIL_ENROLMENT,
        certificateNumber: 'D/4567/2012',
        issuingAuthority: 'Bar Council of Delhi',
        documentUrl: 'https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com/credentials/sample.pdf',
      };

      // First upload succeeds
      const firstRes = await request(app)
        .post('/api/v1/onboarding/step-3/confirm-document')
        .set('Authorization', `Bearer ${lspToken}`)
        .send(documentPayload);
      expect(firstRes.status).toBe(201);

      // Second identical upload fails
      const duplicateRes = await request(app)
        .post('/api/v1/onboarding/step-3/confirm-document')
        .set('Authorization', `Bearer ${lspToken}`)
        .send(documentPayload);
      expect(duplicateRes.status).toBe(400);
      expect(duplicateRes.body.message).toContain('is already recorded');
    });

    it('should reject Step 4 submission if no verification documents were uploaded in Step 3', async () => {
      // Step 1 & 2 done, but no Step 3 document
      await request(app).post('/api/v1/onboarding/step-1').set('Authorization', `Bearer ${lspToken}`).send({
        providerType: ProviderType.ADVOCATE,
        state: 'Delhi',
        district: 'New Delhi',
        pincode: '110001',
        languagesSpoken: ['en'],
      });

      const res = await request(app)
        .post('/api/v1/onboarding/step-4/submit')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          bciRule36Acknowledged: true,
          truthfulnessDeclaration: true,
          dpdpConsentAcknowledged: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('At least one verification document');
    });

    it('should reject Step 4 submission if BCI Rule 36 or DPDP consent is false', async () => {
      // Add document first
      await request(app).post('/api/v1/onboarding/step-3/confirm-document').set('Authorization', `Bearer ${lspToken}`).send({
        credentialType: CredentialType.PHOTO_ID,
        certificateNumber: 'AADHAAR-9988',
        issuingAuthority: 'UIDAI',
        documentUrl: 'https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com/credentials/id.pdf',
      });

      const res = await request(app)
        .post('/api/v1/onboarding/step-4/submit')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          bciRule36Acknowledged: false, // Refused BCI Rule 36
          truthfulnessDeclaration: true,
          dpdpConsentAcknowledged: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 3. ADMIN VERIFICATION DESK & STATUS TRANSITIONS
  // =========================================================================
  describe('2.3 Admin Verification Desk & Workflow Transitions', () => {
    let pendingProfileId: string;

    beforeEach(async () => {
      // Fully complete onboarding for the LSP so it enters PENDING status in the admin queue
      await request(app).post('/api/v1/onboarding/step-1').set('Authorization', `Bearer ${lspToken}`).send({
        providerType: ProviderType.ADVOCATE,
        state: 'Delhi',
        district: 'New Delhi',
        pincode: '110001',
        languagesSpoken: ['en', 'hi'],
      });
      await request(app).post('/api/v1/onboarding/step-2').set('Authorization', `Bearer ${lspToken}`).send({
        providerType: ProviderType.ADVOCATE,
        stateBarCouncil: 'Bar Council of Delhi',
        barRegistrationNo: 'D/8899/2014',
        enrolmentYear: 2014,
        primaryCourt: 'Delhi High Court',
        experienceYears: 10,
        practiceAreas: ['Commercial Litigation'],
        consultationFeeINR: 1800,
      });
      await request(app).post('/api/v1/onboarding/step-3/confirm-document').set('Authorization', `Bearer ${lspToken}`).send({
        credentialType: CredentialType.BAR_COUNCIL_ENROLMENT,
        certificateNumber: 'D/8899/2014',
        issuingAuthority: 'Bar Council of Delhi',
        documentUrl: 'https://legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com/credentials/cert.pdf',
      });
      await request(app).post('/api/v1/onboarding/step-4/submit').set('Authorization', `Bearer ${lspToken}`).send({
        bciRule36Acknowledged: true,
        truthfulnessDeclaration: true,
        dpdpConsentAcknowledged: true,
      });

      pendingProfileId = lspProfileId;
    });

    it('should prohibit Citizen and unverified LSP from accessing Admin verification desk', async () => {
      // Citizen attempt
      const citizenRes = await request(app)
        .get('/api/v1/admin/verification/queue')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(citizenRes.status).toBe(403);

      // LSP attempt
      const lspRes = await request(app)
        .get('/api/v1/admin/verification/queue')
        .set('Authorization', `Bearer ${lspToken}`);
      expect(lspRes.status).toBe(403);
    });

    it('should list pending submissions in the Admin verification queue with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/verification/queue?status=PENDING&page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const applicant = res.body.data.find((item: any) => item.providerProfileId === pendingProfileId);
      expect(applicant).toBeDefined();
      expect(applicant.providerName).toBe('Adv. Harish Salve');
      expect(applicant.barRegistrationNo).toBe('D/8899/2014');
      expect(applicant.status).toBe(VerificationStatus.PENDING);
    });

    it('should fetch complete provider dossier with credentials, badges, and OCR check', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/verification/${pendingProfileId}/dossier`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.barRegistrationNo).toBe('D/8899/2014');
      expect(res.body.data.credentials.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.verificationHistory.length).toBeGreaterThanOrEqual(1);
    });

    it('should transition status from PENDING to UNDER_REVIEW, dispatch notification, and record audit log', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/verification/${pendingProfileId}/decide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'SET_UNDER_REVIEW',
          reviewNotes: 'Bar Council roll cross-verification in progress by scrutiny team.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(VerificationStatus.UNDER_REVIEW);

      // Verify Provider Profile status updated
      const profile = dbStore.providerProfiles.find((p) => p.id === pendingProfileId);
      expect(profile?.verificationStatus).toBe(VerificationStatus.UNDER_REVIEW);

      // Verify Notification sent to Provider
      const notification = dbStore.notifications.find(
        (n) => n.userId === lspUserId && n.title.includes('Under Review')
      );
      expect(notification).toBeDefined();

      // Verify Audit Log
      const audit = dbStore.auditLogs.find(
        (a) => a.action === 'VERIFICATION_SET_UNDER_REVIEW' && a.resourceId === pendingProfileId
      );
      expect(audit).toBeDefined();
    });

    it('should handle REQUEST_MORE_INFO: update review notes and dispatch detailed notification to provider', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/verification/${pendingProfileId}/decide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'REQUEST_MORE_INFO',
          reviewNotes: 'The uploaded enrolment certificate scan is blurry. Please upload a clear color PDF.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(VerificationStatus.UNDER_REVIEW);

      // Verify notification sent with instructions
      const notification = dbStore.notifications.find(
        (n) => n.userId === lspUserId && n.title.includes('Clarification Requested')
      );
      expect(notification).toBeDefined();
      expect(notification?.message).toContain('blurry');
    });

    it('should reject application with reason code, record reason, notify provider, and write audit trail', async () => {
      // 1. Missing reasonCode on REJECT should fail validation
      const invalidReject = await request(app)
        .post(`/api/v1/admin/verification/${pendingProfileId}/decide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'REJECT',
          reviewNotes: 'Bar number not found',
        });
      expect(invalidReject.status).toBe(400);

      // 2. Valid REJECT with reasonCode
      const res = await request(app)
        .post(`/api/v1/admin/verification/${pendingProfileId}/decide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'REJECT',
          reasonCode: 'BAR_NO_NOT_FOUND_ON_STATE_ROLL',
          reviewNotes: 'State Bar Council records show this registration number as lapsed or unverified.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(VerificationStatus.REJECTED);

      // Verify profile rejection reason recorded
      const profile = dbStore.providerProfiles.find((p) => p.id === pendingProfileId);
      expect(profile?.verificationStatus).toBe(VerificationStatus.REJECTED);
      expect(profile?.rejectionReason).toContain('BAR_NO_NOT_FOUND_ON_STATE_ROLL');

      // Verify provider received rejection notification
      const notification = dbStore.notifications.find(
        (n) => n.userId === lspUserId && n.title.includes('Rejected')
      );
      expect(notification).toBeDefined();

      // Verify audit trail
      const audit = dbStore.auditLogs.find(
        (a) => a.action === 'VERIFICATION_REJECTED' && a.resourceId === pendingProfileId
      );
      expect(audit).toBeDefined();
    });

    it('should approve provider, bestow VERIFIED_PROVIDER badge, award 100 points, upgrade tier to Silver, and activate account', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/verification/${pendingProfileId}/decide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'APPROVE',
          reviewNotes: 'Bar Council credentials confirmed against official roll. All statutory criteria satisfied.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(VerificationStatus.APPROVED);
      expect(res.body.data.awardedPoints).toBe(100);

      // 1. Profile verified status & timestamp
      const profile = dbStore.providerProfiles.find((p) => p.id === pendingProfileId);
      expect(profile?.verificationStatus).toBe(VerificationStatus.APPROVED);
      expect(profile?.verifiedAt).toBeInstanceOf(Date);

      // 2. User account activated
      const user = dbStore.users.find((u) => u.id === lspUserId);
      expect(user?.status).toBe('ACTIVE');

      // 3. Official VERIFIED_PROVIDER badge bestowed
      const verifiedBadge = dbStore.badges.find((b) => b.code === 'VERIFIED_PROVIDER');
      const providerBadge = dbStore.providerBadges.find(
        (pb) => pb.providerProfileId === pendingProfileId && pb.badgeId === verifiedBadge?.id
      );
      expect(providerBadge).toBeDefined();

      // 4. Wallet credited with 100 verification bonus points (50 welcome + 50 onboarding + 100 verification = 200 pts)
      const wallet = dbStore.wallets.find((w) => w.userId === lspUserId);
      expect(wallet?.rewardPointsBalance).toBe(200);

      // 5. Points ledger contains immutable record
      const ledgerEntry = dbStore.pointsLedger.find(
        (l) => l.referenceType === 'VERIFICATION_APPROVAL' && l.referenceId === pendingProfileId
      );
      expect(ledgerEntry).toBeDefined();
      expect(ledgerEntry?.points).toBe(100);

      // 6. Tier auto-upgraded to Silver
      expect(profile?.tierId).toBe('tier-silver-02');

      // 7. Notification sent to provider
      const notification = dbStore.notifications.find(
        (n) => n.userId === lspUserId && n.title.includes('Approved')
      );
      expect(notification).toBeDefined();

      // 8. Audit log created
      const audit = dbStore.auditLogs.find(
        (a) => a.action === 'VERIFICATION_APPROVED' && a.resourceId === pendingProfileId
      );
      expect(audit).toBeDefined();
    });

    it('should confirm that an unverified provider (PENDING/REJECTED) has NO verified badge', async () => {
      const verifiedBadge = dbStore.badges.find((b) => b.code === 'VERIFIED_PROVIDER');

      // While in PENDING state, provider has NO verified badge
      const hasBadgePending = dbStore.providerBadges.some(
        (pb) => pb.providerProfileId === pendingProfileId && pb.badgeId === verifiedBadge?.id
      );
      expect(hasBadgePending).toBe(false);

      // Reject the profile
      await request(app)
        .post(`/api/v1/admin/verification/${pendingProfileId}/decide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'REJECT',
          reasonCode: 'DOC_BLURRY_OR_ILLEGIBLE',
          reviewNotes: 'Rejected document',
        });

      // While in REJECTED state, provider still has NO verified badge
      const hasBadgeRejected = dbStore.providerBadges.some(
        (pb) => pb.providerProfileId === pendingProfileId && pb.badgeId === verifiedBadge?.id
      );
      expect(hasBadgeRejected).toBe(false);
    });
  });
});
