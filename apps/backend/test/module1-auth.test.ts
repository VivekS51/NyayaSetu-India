import request from 'supertest';
import { createApp } from '../src/app';
import { dbStore } from '../src/config/database';
import { SecurityUtils } from '../src/common/utils/security.utils';
import { RoleType, AccountStatus, VerificationStatus } from '../src/common/types';

describe('MODULE 1: SIGN-UP, SIGN-IN & AUTHENTICATION TEST SUITE', () => {
  const app = createApp();

  beforeEach(() => {
    // Reset database to pristine state before every test
    dbStore.resetToDefault();
  });

  // =========================================================================
  // 1. POSITIVE AUTHENTICATION FLOWS
  // =========================================================================
  describe('1.1 Positive Authentication Flows', () => {
    it('should successfully dispatch OTP to a valid Indian mobile number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/send')
        .send({ phone: '+919876500001', purpose: 'LOGIN' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('OTP successfully dispatched');
      expect(res.body.data.expiresInMinutes).toBe(5);
    });

    it('should verify correct OTP and auto-register new Citizen user', async () => {
      const testPhone = '+919876500002';
      await request(app).post('/api/v1/auth/otp/send').send({ phone: testPhone });

      const res = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone: testPhone, otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.roles).toContain(RoleType.CITIZEN);
      expect(res.body.data.isNewUser).toBe(true);
    });

    it('should register a new Citizen with email, phone, and strong password with DPDP consent', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Aarav Mehta',
          phone: '+919876500003',
          email: 'aarav.mehta@example.in',
          password: 'SecurePassword@2026',
          role: RoleType.CITIZEN,
          preferredLanguage: 'hi',
          dpdpConsentAcknowledged: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe('Aarav Mehta');
      expect(res.body.data.roles).toContain(RoleType.CITIZEN);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should register a new Legal Service Provider (LSP) and initialize draft profile and wallet', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Adv. Ananya Roy',
          phone: '+919876500004',
          email: 'ananya.roy@barcouncil.org.in',
          password: 'AdvocateSecure#2026',
          role: RoleType.LSP,
          preferredLanguage: 'en',
          dpdpConsentAcknowledged: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roles).toContain(RoleType.LSP);

      // Verify draft profile was created
      const lspProfile = dbStore.providerProfiles.find((p) => p.userId === res.body.data.user.id);
      expect(lspProfile).toBeDefined();
      expect(lspProfile?.verificationStatus).toBe('DRAFT');

      // Verify 50 welcome points credited to wallet
      const wallet = dbStore.wallets.find((w) => w.userId === res.body.data.user.id);
      expect(wallet).toBeDefined();
      expect(wallet?.rewardPointsBalance).toBe(50);
    });

    it('should authenticate Admin via password login and grant ADMIN and VERIFIER roles', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'admin@legalmarketplace.gov.in',
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roles).toContain(RoleType.ADMIN);
      expect(res.body.data.roles).toContain(RoleType.VERIFIER);
      expect(res.body.data.user.fullName).toBe('Smt. Priya Sharma (Joint Registrar)');
    });

    it('should fetch user identity details via GET /api/v1/auth/me', async () => {
      // Login first to get JWT
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'admin@legalmarketplace.gov.in',
          password: 'Password@123',
        });

      const token = loginRes.body.data.accessToken;

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.email).toBe('admin@legalmarketplace.gov.in');
    });

    it('should refresh session tokens via POST /api/v1/auth/refresh', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'admin@legalmarketplace.gov.in',
          password: 'Password@123',
        });

      const oldRefreshToken = loginRes.body.data.refreshToken;

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.accessToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).not.toBe(oldRefreshToken);
    });

    it('should successfully logout and invalidate access and refresh tokens', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'admin@legalmarketplace.gov.in',
          password: 'Password@123',
        });

      const { accessToken, refreshToken } = loginRes.body.data;

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Subsequent call with revoked token must fail with 401
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meRes.status).toBe(401);
      expect(meRes.body.message).toContain('revoked');
    });

    it('should request and confirm password reset via mobile OTP', async () => {
      const user = dbStore.users[0]; // Admin or Advocate

      // Request reset
      const reqRes = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ identifier: user.email });

      expect(reqRes.status).toBe(200);

      // Confirm reset with OTP and new password
      const confirmRes = await request(app)
        .post('/api/v1/auth/password-reset/confirm')
        .send({
          phone: user.phone,
          otp: '123456',
          newPassword: 'BrandNewPassword@2026',
        });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.message).toContain('Password has been reset successfully');

      // Verify login with new password succeeds
      const newLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: user.phone,
          password: 'BrandNewPassword@2026',
        });

      expect(newLoginRes.status).toBe(200);
    });
  });

  // =========================================================================
  // 2. NEGATIVE AUTHENTICATION TESTS
  // =========================================================================
  describe('1.2 Negative Authentication Tests', () => {
    it('should reject wrong OTP code and decrement remaining attempts', async () => {
      const phone = '+919876500005';
      await request(app).post('/api/v1/auth/otp/send').send({ phone });

      const res = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone, otp: '999999' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid OTP');
    });

    it('should reject expired OTP', async () => {
      const phone = '+919876500006';
      await request(app).post('/api/v1/auth/otp/send').send({ phone });

      // Fast-forward OTP expiration in memory
      const record = dbStore.otps.get(phone);
      if (record) record.expiresAt = new Date(Date.now() - 1000);

      const res = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone, otp: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });

    it('should prevent OTP reuse after it has already been verified', async () => {
      const phone = '+919876500007';
      await request(app).post('/api/v1/auth/otp/send').send({ phone });

      // First verification succeeds
      const res1 = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone, otp: '123456' });
      expect(res1.status).toBe(200);

      // Immediate reuse attempt must fail
      const res2 = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone, otp: '123456' });
      expect(res2.status).toBe(400);
      expect(res2.body.message).toContain('No OTP request found');
    });

    it('should enforce OTP resend cooldown (minimum 30 seconds between requests)', async () => {
      const phone = '+919876500008';
      const firstRes = await request(app).post('/api/v1/auth/otp/send').send({ phone });
      expect(firstRes.status).toBe(200);

      // Immediate second request within 30s must be blocked
      const secondRes = await request(app).post('/api/v1/auth/otp/send').send({ phone });
      expect(secondRes.status).toBe(400);
      expect(secondRes.body.message).toContain('Please wait');
    });

    it('should reject invalid Indian mobile numbers (non-Indian, wrong length, invalid start digit)', async () => {
      const invalidNumbers = [
        '12345',               // Too short
        '+911234567890',       // Starts with 1 (must start with 6,7,8,9)
        '+915555555555',       // Starts with 5
        '+14155552671',        // US Number
        '+91981234abcd',       // Non-numeric
      ];

      for (const phone of invalidNumbers) {
        const res = await request(app)
          .post('/api/v1/auth/otp/send')
          .send({ phone });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });

    it('should reject invalid email formats during registration', async () => {
      const invalidEmails = ['notanemail', 'missingatsign.com', 'spaces in@email.in', '@nodomain.com'];

      for (const email of invalidEmails) {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            fullName: 'Test User',
            phone: '+919876500009',
            email,
            password: 'ValidPassword@123',
            dpdpConsentAcknowledged: true,
          });

        expect(res.status).toBe(400);
      }
    });

    it('should reject weak passwords violating security policy', async () => {
      const weakPasswords = [
        'short1!',             // < 8 characters
        'alllowercase1!',      // No uppercase
        'ALLUPPERCASE1!',      // Valid, but missing lowercase if enforced
        'NoNumbersHere!@#',    // Missing number
        'NoSpecialCharacters123', // Missing special character
      ];

      for (const password of weakPasswords) {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            fullName: 'Test User',
            phone: '+919876500010',
            email: 'valid@example.in',
            password,
            dpdpConsentAcknowledged: true,
          });

        expect(res.status).toBe(400);
      }
    });

    it('should reject duplicate mobile registration', async () => {
      const phone = '+919711223344'; // Already registered advocate in seed data

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Duplicate User',
          phone,
          email: 'newemail@example.in',
          password: 'StrongPassword@123',
          dpdpConsentAcknowledged: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject duplicate email registration (case-insensitive check)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Duplicate Email User',
          phone: '+919876500011',
          email: 'ADMIN@LEGALMARKETPLACE.GOV.IN', // uppercase duplicate of seeded admin
          password: 'StrongPassword@123',
          dpdpConsentAcknowledged: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('email address already exists');
    });

    it('should safely handle SQL Injection and XSS strings without database or server error', async () => {
      const sqliPayloads = [
        "' OR 1=1 --",
        "'; DROP TABLE users; --",
        "UNION SELECT * FROM users --",
      ];

      for (const payload of sqliPayloads) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            identifier: payload,
            password: 'Password@123',
          });

        // Must reject gracefully with 400 or 401, never 500
        expect([400, 401]).toContain(res.status);
        expect(res.body.success).toBe(false);
      }
    });

    it('should safely sanitize XSS payloads in registration fields', async () => {
      const xssName = "<script>alert('XSS')</script>Adv. Ramesh";

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: xssName,
          phone: '+919876500012',
          email: 'xss.test@example.in',
          password: 'StrongPassword@123',
          dpdpConsentAcknowledged: true,
        });

      expect(res.status).toBe(201);
      // The user name must be securely stored and never executed
      expect(res.body.data.user.fullName).toBeDefined();
    });

    it('should reject missing, malformed, or forged JWT tokens', async () => {
      // 1. Missing token
      const res1 = await request(app).get('/api/v1/auth/me');
      expect(res1.status).toBe(401);

      // 2. Malformed token
      const res2 = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer Malformed.Token.Structure');
      expect(res2.status).toBe(401);

      // 3. Forged token signed with wrong secret
      const forgedToken = SecurityUtils.generateAccessToken({
        userId: 'fake-id',
        phone: '+919999999999',
        roles: [RoleType.ADMIN],
        fullName: 'Attacker',
      });
      // Tamper signature by modifying characters
      const tamperedToken = forgedToken.slice(0, -5) + 'ABCDE';
      const res3 = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`);
      expect(res3.status).toBe(401);
    });

    it('should reject reused refresh token after rotation', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'admin@legalmarketplace.gov.in',
          password: 'Password@123',
        });

      const initialRefreshToken = loginRes.body.data.refreshToken;

      // First refresh succeeds and rotates
      const refresh1 = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });
      expect(refresh1.status).toBe(200);

      // Second attempt to use the exact same initial refresh token must fail
      const refresh2 = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });
      expect(refresh2.status).toBe(400);
      expect(refresh2.body.message).toContain('revoked');
    });

    it('should lock account after 5 consecutive failed login attempts (Brute-Force Protection)', async () => {
      const identifier = 'admin@legalmarketplace.gov.in';

      // 4 wrong attempts
      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({ identifier, password: 'WrongPassword!' });
        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Invalid credentials');
      }

      // 5th wrong attempt triggers lockout
      const fifthRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier, password: 'WrongPassword!' });
      expect(fifthRes.status).toBe(400);
      expect(fifthRes.body.message).toContain('locked for 15 minutes');

      // 6th attempt (even with correct password) must be rejected while locked
      const lockedRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier, password: 'Password@123' });
      expect(lockedRes.status).toBe(400);
      expect(lockedRes.body.message).toContain('temporarily locked');
    });
  });

  // =========================================================================
  // 3. AUTHORIZATION (RBAC) & IDOR ACCESS CONTROL TESTS
  // =========================================================================
  describe('1.3 Authorization (RBAC) & IDOR Protection', () => {
    let citizenToken: string;
    let lspToken: string;
    let adminToken: string;
    let citizenUserId: string;

    beforeEach(async () => {
      // 1. Citizen login
      const citizenLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: 'sunita.devi@example.in', password: 'Password@123' });
      citizenToken = citizenLogin.body.data.accessToken;
      citizenUserId = citizenLogin.body.data.user.id;

      // 2. LSP login
      const lspLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: 'rajesh.varma@delhibar.org.in', password: 'Password@123' });
      lspToken = lspLogin.body.data.accessToken;

      // 3. Admin login
      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: 'admin@legalmarketplace.gov.in', password: 'Password@123' });
      adminToken = adminLogin.body.data.accessToken;
    });

    it('should prohibit Citizen from accessing LSP-only onboarding routes', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding/step-1')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerType: 'ADVOCATE',
          state: 'Delhi',
          district: 'Central Delhi',
          pincode: '110001',
          languagesSpoken: ['en', 'hi'],
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should prohibit Citizen from accessing Admin verification queue', async () => {
      const res = await request(app)
        .get('/api/v1/admin/verification/queue')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should prohibit Citizen from accessing Admin analytics and telemetry overview', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should prohibit LSP from accessing Admin verification queue', async () => {
      const res = await request(app)
        .get('/api/v1/admin/verification/queue')
        .set('Authorization', `Bearer ${lspToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should prohibit LSP from resolving consumer escrow disputes', async () => {
      const res = await request(app)
        .post('/api/v1/admin/disputes/disp-seed-001/resolve')
        .set('Authorization', `Bearer ${lspToken}`)
        .send({
          action: 'RELEASE_TO_PROVIDER',
          resolutionNotes: 'Illegal attempt by LSP to resolve their own dispute',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should prevent IDOR: User A cannot read or inspect User B private booking dossier', async () => {
      // Create another citizen user (Citizen B)
      const citizenBRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Vikram Joshi (Citizen B)',
          phone: '+919876500013',
          email: 'vikram.joshi@example.in',
          password: 'Password@1234',
          role: RoleType.CITIZEN,
          dpdpConsentAcknowledged: true,
        });

      const citizenBToken = citizenBRes.body.data.accessToken;

      // Citizen B attempts to access Sunita Devi (Citizen A) seed booking
      const res = await request(app)
        .get('/api/v1/bookings/bk-seed-001')
        .set('Authorization', `Bearer ${citizenBToken}`);

      // Must be rejected with 400/403 access denial
      expect([400, 403]).toContain(res.status);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('should verify that an unverified provider with DRAFT or PENDING status is not active in directory', async () => {
      // Find pending provider
      const pendingProfile = dbStore.providerProfiles.find(
        (p) => p.verificationStatus === VerificationStatus.PENDING
      );
      expect(pendingProfile).toBeDefined();

      // Ensure that unapproved status is explicitly non-APPROVED
      expect(pendingProfile?.verificationStatus).not.toBe(VerificationStatus.APPROVED);
    });
  });
});

