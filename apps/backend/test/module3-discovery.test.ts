import request from 'supertest';
import { createApp } from '../src/app';
import { dbStore } from '../src/config/database';
import { translations } from '../../frontend/src/lib/translations';
import {
  RoleType,
  ProviderType,
  VerificationStatus,
} from '../src/common/types';

describe('MODULE 3: PROFILE, SEARCH, DISCOVERY & MULTILINGUAL I18N TEST SUITE', () => {
  const app = createApp();

  let advocateToken: string;
  let notaryToken: string;
  let citizenToken: string;
  let advocateProfileId: string;
  let advocateUserId: string;
  let notaryProfileId: string;
  let notaryUserId: string;

  beforeEach(async () => {
    // Reset database to default seeded state before every test
    dbStore.resetToDefault();

    // 1. Authenticate Seeded Advocate (Adv. Rajesh Varma)
    const advLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'rajesh.varma@delhibar.org.in', password: 'Password@123' });
    advocateToken = advLogin.body.data.accessToken;
    advocateUserId = advLogin.body.data.user.id;
    advocateProfileId = 'prof-lsp-003';

    // 2. Authenticate Seeded Notary (Harpreet Singh)
    const notaryLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'h.singh.notary@punjab.gov.in', password: 'Password@123' });
    notaryToken = notaryLogin.body.data.accessToken;
    notaryUserId = notaryLogin.body.data.user.id;
    notaryProfileId = 'prof-lsp-005';

    // 3. Authenticate Citizen (Sunita Devi)
    const citizenLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'sunita.devi@example.in', password: 'Password@123' });
    citizenToken = citizenLogin.body.data.accessToken;
  });

  // =========================================================================
  // 1. PUBLIC PROFILES & PII MASKING TESTS
  // =========================================================================
  describe('3.1 Public Provider Profiles & PII Masking', () => {
    it('should retrieve factual public profile of a verified provider with BCI Rule 36 disclaimer', async () => {
      const res = await request(app).get(`/api/v1/providers/${advocateProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Adv. Rajesh Varma');
      expect(res.body.data.providerType).toBe(ProviderType.ADVOCATE);
      expect(res.body.data.barRegistrationNo).toBe('D/1428/2012');
      expect(res.body.data.stateBarCouncil).toBe('Bar Council of Delhi');
      expect(res.body.data.primaryCourt).toContain('Delhi High Court');
      expect(res.body.data.experienceYears).toBe(14);
      expect(res.body.data.practiceAreas).toContain('Property & Revenue Disputes');
      expect(res.body.data.verificationStatus).toBe(VerificationStatus.APPROVED);
      expect(res.body.data.disclaimer).toContain('Bar Council of India Rule 36');
    });

    it('should strictly mask PII (phone number, email address) on public profile view', async () => {
      const res = await request(app).get(`/api/v1/providers/${advocateProfileId}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // Phone must be masked (e.g. +91971******44)
      expect(data.maskedPhone).toBeDefined();
      expect(data.maskedPhone).toContain('******');
      expect(data.maskedPhone).not.toBe('+919711223344');

      // Email must be masked
      expect(data.maskedEmail).toBeDefined();
      expect(data.maskedEmail).toContain('***');
      expect(data.maskedEmail).not.toBe('rajesh.varma@delhibar.org.in');

      // Internal private fields must be omitted
      expect(data.passwordHash).toBeUndefined();
      expect(data.rejectionReason).toBeUndefined();
    });

    it('should allow authenticated provider to retrieve their own full profile via GET /me/profile', async () => {
      const res = await request(app)
        .get('/api/v1/providers/me/profile')
        .set('Authorization', `Bearer ${advocateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(advocateProfileId);
      expect(res.body.data.userId).toBe(advocateUserId);
      expect(res.body.data.consultationFeeINR).toBe(800);
    });

    it('should allow authenticated provider to update factual details (bio, fee, languages, practice areas)', async () => {
      const res = await request(app)
        .put('/api/v1/providers/me')
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({
          bio: 'Updated factual profile: 14 years litigating commercial arbitration and property disputes.',
          consultationFeeINR: 950,
          languagesSpoken: ['en', 'hi', 'pa'],
          isAvailableForProBono: true,
          practiceAreas: ['Civil Litigation', 'Arbitration', 'Cyber Law'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.consultationFeeINR).toBe(950);
      expect(res.body.data.bio).toContain('Updated factual profile');

      // Confirm persistence
      const profile = dbStore.providerProfiles.find((p) => p.id === advocateProfileId);
      expect(profile?.consultationFeeINR).toBe(950);
    });

    it('should strictly reject promotional claims violating BCI Rule 36 when updating profile bio', async () => {
      const res = await request(app)
        .put('/api/v1/providers/me')
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({
          bio: 'I am the best lawyer in Delhi High Court with guaranteed win in all appeals.',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('BCI Rule 36 Violation');
    });

    it('should reject Notary updating consultation fee exceeding statutory ceiling (Notaries Act 1952)', async () => {
      const res = await request(app)
        .put('/api/v1/providers/me')
        .set('Authorization', `Bearer ${notaryToken}`)
        .send({
          consultationFeeINR: 750, // Exceeds 500 ceiling
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Notaries Act 1952 Guardrail');
    });

    it('should prohibit public access to unverified provider profile (PENDING/REJECTED)', async () => {
      // prof-lsp-004 is Meenakshi Sundaram (status: PENDING)
      const res = await request(app).get('/api/v1/providers/prof-lsp-004');

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found or pending verification');
    });
  });

  // =========================================================================
  // 2. SEARCH & MULTI-FILTER DIRECTORY TESTS
  // =========================================================================
  describe('3.2 Search & Multi-Filter Directory Engine', () => {
    it('should list all verified providers in default directory query with BCI disclaimer', async () => {
      const res = await request(app).get('/api/v1/providers');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2); // Advocate & Notary seeded
      expect(res.body.meta.disclaimer).toContain('Bar Council of India Rule 36');

      // Verify unverified provider (prof-lsp-004) is strictly excluded
      const unverified = res.body.data.find((p: any) => p.id === 'prof-lsp-004');
      expect(unverified).toBeUndefined();
    });

    it('should perform text search (q) across advocate name, court, and practice area', async () => {
      // 1. Search by name
      const nameRes = await request(app).get('/api/v1/providers?q=Rajesh');
      expect(nameRes.status).toBe(200);
      expect(nameRes.body.data.length).toBe(1);
      expect(nameRes.body.data[0].fullName).toContain('Rajesh Varma');

      // 2. Search by court jurisdiction
      const courtRes = await request(app).get('/api/v1/providers?q=Jalandhar');
      expect(courtRes.status).toBe(200);
      expect(courtRes.body.data.length).toBe(1);
      expect(courtRes.body.data[0].fullName).toContain('Harpreet Singh');

      // 3. Search by legal practice domain
      const domainRes = await request(app).get('/api/v1/providers?q=Affidavit');
      expect(domainRes.status).toBe(200);
      expect(domainRes.body.data.length).toBe(1);
      expect(domainRes.body.data[0].providerType).toBe(ProviderType.NOTARY);
    });

    it('should safely handle SQL Injection and regex special characters in search queries without error', async () => {
      const injectionPayloads = [
        "' OR 1=1 --",
        "'; DROP TABLE provider_profiles; --",
        "<script>alert('XSS')</script>",
        ".*+?^${}()|[]\\",
        "UNION SELECT * FROM users",
      ];

      for (const q of injectionPayloads) {
        const res = await request(app).get(`/api/v1/providers?q=${encodeURIComponent(q)}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });

    it('should filter directory by providerType (ADVOCATE vs NOTARY)', async () => {
      // 1. ADVOCATE filter
      const advRes = await request(app).get('/api/v1/providers?providerType=ADVOCATE');
      expect(advRes.status).toBe(200);
      expect(advRes.body.data.every((p: any) => p.providerType === ProviderType.ADVOCATE)).toBe(true);

      // 2. NOTARY filter
      const notaryRes = await request(app).get('/api/v1/providers?providerType=NOTARY');
      expect(notaryRes.status).toBe(200);
      expect(notaryRes.body.data.every((p: any) => p.providerType === ProviderType.NOTARY)).toBe(true);
    });

    it('should filter directory by Geographic State and District', async () => {
      // 1. State: Delhi
      const delhiRes = await request(app).get('/api/v1/providers?state=Delhi');
      expect(delhiRes.status).toBe(200);
      expect(delhiRes.body.data.length).toBe(1);
      expect(delhiRes.body.data[0].state).toBe('Delhi');

      // 2. State: Punjab
      const punjabRes = await request(app).get('/api/v1/providers?state=Punjab');
      expect(punjabRes.status).toBe(200);
      expect(punjabRes.body.data.length).toBe(1);
      expect(punjabRes.body.data[0].state).toBe('Punjab');

      // 3. District: Jalandhar
      const distRes = await request(app).get('/api/v1/providers?district=Jalandhar');
      expect(distRes.status).toBe(200);
      expect(distRes.body.data[0].district).toBe('Jalandhar');
    });

    it('should filter directory by Practice Area / Legal Domain', async () => {
      const res = await request(app).get('/api/v1/providers?practiceArea=Property%20%26%20Revenue%20Disputes');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].fullName).toContain('Rajesh Varma');
    });

    it('should filter directory by Language spoken', async () => {
      const res = await request(app).get('/api/v1/providers?language=pa');

      expect(res.status).toBe(200);
      expect(res.body.data.every((p: any) => p.languagesSpoken.includes('pa'))).toBe(true);
    });

    it('should filter directory by Consultation Fee Range (feeMin and feeMax)', async () => {
      // Fee between 200 and 500 (Matches Notary ₹350, excludes Advocate ₹800)
      const res = await request(app).get('/api/v1/providers?feeMin=200&feeMax=500');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].consultationFeeINR).toBe(350);
      expect(res.body.data[0].providerType).toBe(ProviderType.NOTARY);
    });

    it('should filter directory by Pro Bono availability (proBono=true)', async () => {
      const res = await request(app).get('/api/v1/providers?proBono=true');

      expect(res.status).toBe(200);
      expect(res.body.data.every((p: any) => p.isAvailableForProBono === true)).toBe(true);
    });

    it('should combine multiple filters simultaneously (AND logic)', async () => {
      const res = await request(app).get(
        '/api/v1/providers?providerType=ADVOCATE&state=Delhi&language=hi&proBono=true&feeMin=500&feeMax=1000'
      );

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      const match = res.body.data[0];
      expect(match.fullName).toBe('Adv. Rajesh Varma');
      expect(match.state).toBe('Delhi');
      expect(match.isAvailableForProBono).toBe(true);
    });

    it('should return empty results gracefully (200 OK, empty items, total: 0) when no provider matches', async () => {
      const res = await request(app).get('/api/v1/providers?state=Goa&providerType=ARBITRATOR');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
      expect(res.body.meta.totalPages).toBe(0);
    });

    it('should support pagination (page and limit)', async () => {
      const res = await request(app).get('/api/v1/providers?page=1&limit=1');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(1);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
      expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('should sort results correctly by fee_asc, fee_desc, and experience (neutral ranking)', async () => {
      // 1. fee_asc (Notary ₹350 first, Advocate ₹800 second)
      const ascRes = await request(app).get('/api/v1/providers?sortBy=fee_asc');
      expect(ascRes.status).toBe(200);
      expect(ascRes.body.data[0].consultationFeeINR).toBeLessThanOrEqual(ascRes.body.data[1].consultationFeeINR);

      // 2. fee_desc (Advocate ₹800 first, Notary ₹350 second)
      const descRes = await request(app).get('/api/v1/providers?sortBy=fee_desc');
      expect(descRes.status).toBe(200);
      expect(descRes.body.data[0].consultationFeeINR).toBeGreaterThanOrEqual(descRes.body.data[1].consultationFeeINR);

      // 3. experience (Advocate 14 yrs first, Notary 11 yrs second)
      const expRes = await request(app).get('/api/v1/providers?sortBy=experience');
      expect(expRes.status).toBe(200);
      expect(expRes.body.data[0].experienceYears).toBeGreaterThanOrEqual(expRes.body.data[1].experienceYears);
    });

    it('should serve identical verified results via frontend discovery alias /api/v1/discovery/providers', async () => {
      const res = await request(app).get('/api/v1/discovery/providers');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // 3. MULTILINGUAL I18N PARITY TESTS (ENGLISH, HINDI, PUNJABI)
  // =========================================================================
  describe('3.3 Multilingual i18n Dictionary Parity (English, Hindi, Punjabi)', () => {
    it('should have complete translation dictionary for English (en), Hindi (hi), and Punjabi (pa)', () => {
      expect(translations.en).toBeDefined();
      expect(translations.hi).toBeDefined();
      expect(translations.pa).toBeDefined();
    });

    it('should ensure 100% key parity between English, Hindi, and Punjabi across all UI sections', () => {
      const sections = ['nav', 'hero', 'categories', 'onboarding', 'compliance'] as const;

      for (const section of sections) {
        const enKeys = Object.keys(translations.en[section]).sort();
        const hiKeys = Object.keys(translations.hi[section]).sort();
        const paKeys = Object.keys(translations.pa[section]).sort();

        // Hindi keys match English keys exactly
        expect(hiKeys).toEqual(enKeys);

        // Punjabi keys match English keys exactly
        expect(paKeys).toEqual(enKeys);
      }
    });

    it('should ensure all translation values are non-empty strings and contain statutory references', () => {
      // English disclaimer
      expect(translations.en.nav.disclaimer).toContain('BCI Rule 36');

      // Hindi disclaimer
      expect(translations.hi.nav.disclaimer).toContain('बीसीआई');

      // Punjabi disclaimer
      expect(translations.pa.nav.disclaimer).toContain('ਬਾਰ ਕੌਂਸਲ');

      // Ensure no blank values in any language
      const checkNonEmpty = (obj: Record<string, string>) => {
        for (const [key, value] of Object.entries(obj)) {
          expect(typeof value).toBe('string');
          expect(value.trim().length).toBeGreaterThan(0);
        }
      };

      (['en', 'hi', 'pa'] as const).forEach((lang) => {
        checkNonEmpty(translations[lang].nav);
        checkNonEmpty(translations[lang].hero);
        checkNonEmpty(translations[lang].categories);
        checkNonEmpty(translations[lang].onboarding);
        checkNonEmpty(translations[lang].compliance);
      });
    });
  });
});
