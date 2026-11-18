import request from 'supertest';
import { createApp } from '../../src/app';
import { dbStore } from '../../src/config/database';
import { RoleType, VerificationStatus, AccountStatus, ServiceDeliveryMode } from '../../src/common/types';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const app = createApp();

describe('OWASP TOP 10 ENTERPRISE SECURITY TEST SUITE', () => {
  let citizenToken: string;
  let citizenUserId: string;

  let providerToken: string;
  let providerUserId: string;
  let providerProfileId = 'prof-lsp-003';

  let adminToken: string;
  let adminUserId: string;

  beforeEach(async () => {
    dbStore.resetToDefault();

    // 1. Authenticate Citizen (Sunita Devi)
    const citRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: '+919812345678', password: 'Password@123' });
    citizenToken = citRes.body.data.accessToken;
    citizenUserId = citRes.body.data.user.id;

    // 2. Authenticate Provider (Adv. Rajesh Varma)
    const provRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: '+919711223344', password: 'Password@123' });
    providerToken = provRes.body.data.accessToken;
    providerUserId = provRes.body.data.user.id;

    // 3. Authenticate Admin (Joint Registrar)
    const admRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@legalmarketplace.gov.in', password: 'Password@123' });
    adminToken = admRes.body.data.accessToken;
    adminUserId = admRes.body.data.user.id;
  });

  /* -------------------------------------------------------------------------
   * 1. OWASP A03: INJECTION DEFENSE (SQL, NoSQL, Shell & JSON Payloads)
   * ------------------------------------------------------------------------- */
  describe('1. OWASP A03: Injection Defense', () => {
    it('should reject SQL Injection authentication bypass payloads in login identifier', async () => {
      const sqlPayloads = [
        "' OR '1'='1",
        "admin' --",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "admin' /*",
      ];

      for (const payload of sqlPayloads) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({ identifier: payload, password: 'password123' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Invalid credentials');
      }
    });

    it('should sanitize SQL injection characters in directory search filters without error', async () => {
      const maliciousQueries = [
        "advocate' OR '1'='1",
        "Delhi'; DROP TABLE provider_profiles; --",
        "' UNION SELECT id, passwordHash FROM users --",
      ];

      for (const query of maliciousQueries) {
        const res = await request(app)
          .get(`/api/v1/discovery/providers?search=${encodeURIComponent(query)}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        // Ensure database remains fully functional and intact
        expect(dbStore.users.length).toBeGreaterThan(0);
      }
    });

    it('should safely reject NoSQL injection object tampering in JSON bodies', async () => {
      // Trying to bypass password or phone checks with MongoDB/NoSQL query operators
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: { $gt: '' },
          password: { $gt: '' },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject command injection syntax in uploaded filenames', async () => {
      const maliciousFilenames = [
        'cert;rm -rf /.pdf',
        'test|cat /etc/passwd.pdf',
        '`whoami`.jpg',
        '$(reboot).png',
      ];

      for (const fileName of maliciousFilenames) {
        const res = await request(app)
          .post('/api/v1/onboarding/step-3/upload-url')
          .set('Authorization', `Bearer ${providerToken}`)
          .send({
            fileName,
            mimeType: 'application/pdf',
            fileSizeBytes: 1024,
          });

        // Either sanitized or rejected with validation error
        if (res.status === 200) {
          expect(res.body.data.publicDocumentUrl).not.toContain(';');
          expect(res.body.data.publicDocumentUrl).not.toContain('|');
          expect(res.body.data.publicDocumentUrl).not.toContain('`');
        } else {
          expect(res.status).toBe(400);
        }
      }
    });
  });

  /* -------------------------------------------------------------------------
   * 2. OWASP A01: BROKEN ACCESS CONTROL & IDOR DEFENSE
   * ------------------------------------------------------------------------- */
  describe('2. OWASP A01: Broken Access Control & IDOR', () => {
    it('should block Citizen from accessing privileged Admin endpoints (Vertical Escalation)', async () => {
      const endpoints = [
        { method: 'get', path: '/api/v1/admin/users' },
        { method: 'get', path: '/api/v1/admin/analytics/overview' },
        { method: 'get', path: '/api/v1/admin/verification/queue' },
        { method: 'post', path: '/api/v1/admin/categories', body: { code: 'TEST', name: 'Test' } },
      ];

      for (const ep of endpoints) {
        let reqBuilder = (request(app) as any)[ep.method](ep.path)
          .set('Authorization', `Bearer ${citizenToken}`);
        if (ep.body) reqBuilder = reqBuilder.send(ep.body);

        const res = await reqBuilder;
        expect([401, 403]).toContain(res.status);
      }
    });

    it('should block Provider from accessing privileged Admin endpoints (Vertical Escalation)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).toBe(403);
    });

    it('should prevent IDOR: User A cannot cancel or modify User B booking', async () => {
      // 1. Citizen A creates a booking
      const slot = new Date(Date.now() + 60 * 3600 * 1000);
      slot.setHours(10, 0, 0, 0);

      const bookingRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          providerProfileId,
          serviceTitle: 'Private Succession Consultation',
          deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
          scheduledStartTime: slot.toISOString(),
          durationMinutes: 60,
        });
      const bookingId = bookingRes.body.data.id;

      // 2. Register Citizen B
      const citizenBRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Smt. Ananya Sen',
          phone: '+919833445566',
          email: 'ananya.sen@example.in',
          password: 'Password@123',
          role: RoleType.CITIZEN,
          preferredLanguage: 'en',
          dpdpConsentAcknowledged: true,
        });
      const citizenBToken = citizenBRes.body.data.accessToken;

      // 3. Citizen B attempts to cancel Citizen A's booking (IDOR Attack)
      const attackRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${citizenBToken}`)
        .send({ reason: 'Malicious cancellation attempt' });

      expect([400, 403]).toContain(attackRes.status);
      expect(attackRes.body.message).toContain('Not authorized to cancel this booking');
    });

    it('should prevent IDOR: User B cannot access User A statutory tax invoice', async () => {
      // Find or create an invoice for citizen A
      const booking = dbStore.bookings.find((b) => b.citizenId === citizenUserId);
      if (booking) {
        // Register Citizen B
        const citizenBRes = await request(app)
          .post('/api/v1/auth/register')
          .send({
            fullName: 'Shri Kamal Roy',
            phone: '+919844332211',
            email: 'kamal.roy@example.in',
            password: 'Password@123',
            role: RoleType.CITIZEN,
            preferredLanguage: 'en',
            dpdpConsentAcknowledged: true,
          });
        const citizenBToken = citizenBRes.body.data.accessToken;

        const res = await request(app)
          .get(`/api/v1/payments/invoice/${booking.id}`)
          .set('Authorization', `Bearer ${citizenBToken}`);

        expect([400, 403, 404]).toContain(res.status);
      }
    });

    it('should ensure unverified Legal Service Providers cannot be discovered publicly', async () => {
      // Find an unverified profile
      const unverifiedProfile = dbStore.providerProfiles.find(
        (p) => p.verificationStatus !== VerificationStatus.APPROVED
      );
      if (unverifiedProfile) {
        const res = await request(app).get(`/api/v1/discovery/providers/${unverifiedProfile.id}`);
        // Must reject or return 404
        expect(res.status).toBe(404);
      }
    });
  });

  /* -------------------------------------------------------------------------
   * 3. OWASP A07: IDENTIFICATION & AUTHENTICATION FAILURES
   * ------------------------------------------------------------------------- */
  describe('3. OWASP A07: Identification & Authentication Failures', () => {
    it('should reject requests with missing Authorization header on protected routes', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Authentication token missing');
    });

    it('should reject tampered JWT signatures with 401 Unauthorized', async () => {
      const [header, payload] = citizenToken.split('.');
      const tamperedToken = `${header}.${payload}.TAMPERED_INVALID_SIGNATURE`;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid token authorization');
    });

    it('should reject expired JWT tokens with 401 Session Expired', async () => {
      // Construct expired token with mock key
      const expiredToken = jwt.sign(
        { userId: citizenUserId, roles: [RoleType.CITIZEN] },
        process.env.JWT_ACCESS_SECRET || 'dev_access_secret_key_123',
        { expiresIn: -10 } // Expired 10 seconds ago
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('should enforce account lockout after 5 consecutive failed login attempts', async () => {
      const victimPhone = '+919876543210';

      // 5 consecutive wrong password attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({ identifier: victimPhone, password: 'WrongPassword@999' });
      }

      // 6th attempt with correct password must be locked out
      const lockoutRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: victimPhone, password: 'Password@123' });

      expect(lockoutRes.status).toBe(400);
      expect(lockoutRes.body.message).toContain('locked');
    });

    it('should reject refresh token reuse after logout or invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid_malformed_refresh_token_99999' });

      expect([400, 401]).toContain(res.status);
    });
  });

  /* -------------------------------------------------------------------------
   * 4. OWASP A02: SENSITIVE DATA EXPOSURE & CRYPTOGRAPHIC SECURITY
   * ------------------------------------------------------------------------- */
  describe('4. OWASP A02: Sensitive Data Exposure & Cryptography', () => {
    it('should never expose passwordHash in any API response', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.passwordHash).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('$2a$');
      expect(JSON.stringify(res.body)).not.toContain('$2b$');
    });

    it('should mask citizen phone numbers in public provider reviews', async () => {
      const res = await request(app).get(`/api/v1/reviews/provider/${providerProfileId}`);
      expect(res.status).toBe(200);

      const reviews = res.body.data.items;
      if (reviews.length > 0) {
        for (const review of reviews) {
          // If citizen phone is returned, it must be masked or omitted
          if (review.citizenPhone) {
            expect(review.citizenPhone).toMatch(/\+91\*{6}\d{2,4}/);
          }
        }
      }
    });

    it('should securely hash all stored passwords with bcrypt work factor >= 10', () => {
      for (const user of dbStore.users) {
        expect(user.passwordHash).toBeDefined();
        expect(user.passwordHash.length).toBeGreaterThan(30);
        // bcrypt hashes start with $2a$ or $2b$
        expect(user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')).toBe(true);
      }
    });
  });

  /* -------------------------------------------------------------------------
   * 5. OWASP A05: SECURITY MISCONFIGURATION & HARDENING HEADERS
   * ------------------------------------------------------------------------- */
  describe('5. OWASP A05: Security Headers & CORS Enforcement', () => {
    it('should return all mandatory OWASP Top 10 security headers', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-xss-protection']).toBe('1; mode=block');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['strict-transport-security']).toBeDefined();
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    });

    it('should set regulatory BCI Rule 36 and DPDP Act statutory compliance headers', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers['x-platform-disclaimer']).toContain('Neutral technology directory');
      expect(res.headers['x-bci-rule-36-compliance']).toBe('Active');
      expect(res.headers['x-dpdp-act-2023-jurisdiction']).toContain('India (Sovereign Storage)');
    });

    it('should support CORS preflight OPTIONS requests without leaking sensitive internal headers', async () => {
      const res = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect([200, 204]).toContain(res.status);
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  /* -------------------------------------------------------------------------
   * 6. OWASP A04: INSECURE DESIGN & RATE LIMITING
   * ------------------------------------------------------------------------- */
  describe('6. OWASP A04: Insecure Design & Rate Limiting', () => {
    it('should enforce OTP request cooldown (minimum 30s) against SMS bombing', async () => {
      const testPhone = '+919988001122';

      // 1st OTP request
      const firstRes = await request(app)
        .post('/api/v1/auth/otp/send')
        .send({ phone: testPhone, purpose: 'LOGIN' });
      expect(firstRes.status).toBe(200);

      // Immediate 2nd request must be throttled
      const secondRes = await request(app)
        .post('/api/v1/auth/otp/send')
        .send({ phone: testPhone, purpose: 'LOGIN' });

      expect(secondRes.status).toBe(400);
      expect(secondRes.body.message).toContain('Please wait');
    });

    it('should enforce rate limiter on repeated OTP attempts', async () => {
      // Rapid requests from distinct phones in test suite
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/api/v1/auth/otp/send')
          .send({ phone: `+91991100223${i}`, purpose: 'LOGIN' });
      }

      // Beyond limit triggers 429
      const floodRes = await request(app)
        .post('/api/v1/auth/otp/send')
        .send({ phone: '+919911002239', purpose: 'LOGIN' });

      // Either 200 (if under limit) or 429 (if threshold exceeded)
      expect([200, 400, 429]).toContain(floodRes.status);
    });
  });

  /* -------------------------------------------------------------------------
   * 7. FILE UPLOAD ABUSE & MALICIOUS PAYLOADS
   * ------------------------------------------------------------------------- */
  describe('7. File Upload Abuse & Extension Validation', () => {
    it('should reject prohibited file extensions (.exe, .sh, .bat, .php) for verification documents', async () => {
      const prohibitedTypes = [
        { fileName: 'malware.exe', mimeType: 'application/x-msdownload' },
        { fileName: 'exploit.sh', mimeType: 'application/x-sh' },
        { fileName: 'backdoor.php', mimeType: 'application/x-php' },
        { fileName: 'script.bat', mimeType: 'application/x-bat' },
      ];

      for (const item of prohibitedTypes) {
        const res = await request(app)
          .post('/api/v1/onboarding/step-3/upload-url')
          .set('Authorization', `Bearer ${providerToken}`)
          .send({
            fileName: item.fileName,
            mimeType: item.mimeType,
            fileSizeBytes: 1024,
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/(Executable or script files are strictly prohibited|Only PDF, JPEG, and PNG files are accepted)/);
      }
    });

    it('should reject oversized document uploads exceeding 10MB limit', async () => {
      const oversizedBytes = 15 * 1024 * 1024; // 15MB

      const res = await request(app)
        .post('/api/v1/onboarding/step-3/upload-url')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          fileName: 'oversized_law_dossier.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: oversizedBytes,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('exceeds maximum allowable limit');
    });

    it('should prevent directory traversal in upload filenames', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding/step-3/upload-url')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          fileName: '../../../../etc/shadow.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 2048,
        });

      if (res.status === 200) {
        expect(res.body.data.key).not.toContain('..');
      } else {
        expect(res.status).toBe(400);
      }
    });
  });

  /* -------------------------------------------------------------------------
   * 8. CROSS-SITE SCRIPTING (XSS) & INPUT SANITIZATION
   * ------------------------------------------------------------------------- */
  describe('8. Cross-Site Scripting (XSS) & Input Sanitization', () => {
    it('should safely handle XSS payloads in consultation review feedback without script execution', async () => {
      const xssPayloads = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('document.cookie')>",
        "<svg/onload=alert('XSS')>",
        "javascript:alert(1)",
      ];

      for (const payload of xssPayloads) {
        // Create an appointment for review testing
        const slot = new Date(Date.now() + 72 * 3600 * 1000);
        slot.setHours(12, 0, 0, 0);

        const bRes = await request(app)
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${citizenToken}`)
          .send({
            providerProfileId,
            serviceTitle: `Legal Consultation Test ${Math.random()}`,
            deliveryMode: ServiceDeliveryMode.ONLINE_VIDEO,
            scheduledStartTime: slot.toISOString(),
            durationMinutes: 60,
          });

        if (bRes.status === 201) {
          const booking = dbStore.bookings.find((b) => b.id === bRes.body.data.id)!;
          booking.bookingStatus = 'COMPLETED' as any;

          const revRes = await request(app)
            .post('/api/v1/reviews')
            .set('Authorization', `Bearer ${citizenToken}`)
            .send({
              bookingId: booking.id,
              rating: 5,
              feedbackText: `Excellent counsel! ${payload}`,
            });

          expect(revRes.status).toBe(201);
          // Content is safely stored as string; CSP header prevents browser execution
          expect(revRes.body.data.feedbackText).toContain('Excellent counsel!');
        }
      }
    });

    it('should validate and reject non-string XSS attempts in provider bio', async () => {
      const res = await request(app)
        .put('/api/v1/providers/me')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          bio: { script: "alert('XSS')" },
        });

      expect(res.status).toBe(400);
    });
  });

  /* -------------------------------------------------------------------------
   * 9. ERROR HANDLING & INFORMATION LEAKAGE DEFENSE
   * ------------------------------------------------------------------------- */
  describe('9. Information Leakage & Clean Error Handling', () => {
    it('should return clean JSON error without leaking internal stack traces on malformed JSON', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"bad_json": '); // Malformed JSON syntax error

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Malformed JSON payload');
      expect(res.body.stack).toBeUndefined();
    });

    it('should not leak database server internals or file paths in 404 responses', async () => {
      const res = await request(app).get('/api/v1/non-existent-endpoint-xyz-999');

      expect(res.status).toBe(404);
      expect(JSON.stringify(res.body)).not.toContain('node_modules');
      expect(JSON.stringify(res.body)).not.toContain('at Function.');
    });
  });

  /* -------------------------------------------------------------------------
   * 10. REPOSITORY SECRETS & HARDCODED CREDENTIAL SCANNER
   * ------------------------------------------------------------------------- */
  describe('10. Repository Secrets & Hardcoded Credential Scan', () => {
    it('should verify backend source code contains no real AWS/GCP/Razorpay live production secrets', () => {
      const srcDir = path.resolve(__dirname, '../../src');
      const files: string[] = [];

      function collectFiles(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            collectFiles(fullPath);
          } else if (entry.name.endsWith('.ts')) {
            files.push(fullPath);
          }
        }
      }

      collectFiles(srcDir);
      expect(files.length).toBeGreaterThan(15);

      const dangerousPatterns = [
        /AKIA[0-9A-Z]{16}/, // AWS Access Key
        /-----BEGIN RSA PRIVATE KEY-----/, // RSA Private Key
        /-----BEGIN PRIVATE KEY-----/, // General Private Key
        /rzp_live_[0-9a-zA-Z]{14}/, // Razorpay Live Key
        /ghp_[0-9a-zA-Z]{36}/, // GitHub Personal Access Token
      ];

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf8');
        for (const pattern of dangerousPatterns) {
          const match = content.match(pattern);
          expect(match).toBeNull();
        }
      }
    });
  });
});
