import request from 'supertest';
import { createApp } from '../src/app';
import { dbStore } from '../src/config/database';
import {
  RoleType,
  ProviderType,
  AccountStatus,
  BookingStatus,
  PaymentStatus,
  DisputeStatus,
} from '../src/common/types';

describe('MODULE 8: ADMIN PANEL & TELEMETRY TEST SUITE (Analytics, RBAC, Categories, Disputes & CSV)', () => {
  const app = createApp();

  let adminToken: string;
  let adminUserId: string;

  let citizenToken: string;
  let citizenUserId: string;

  let advocateToken: string;
  let advocateUserId: string;

  beforeAll(async () => {
    dbStore.resetToDefault();

    // 1. Admin Login
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@legalmarketplace.gov.in', password: 'Password@123' });
    adminToken = adminLogin.body.data.accessToken;
    adminUserId = adminLogin.body.data.user.id;

    // 2. Seeded Citizen (Sunita Devi)
    const citizenLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'sunita.devi@example.in', password: 'Password@123' });
    citizenToken = citizenLogin.body.data.accessToken;
    citizenUserId = citizenLogin.body.data.user.id;

    // 3. Seeded Advocate (Adv. Rajesh Varma)
    const advLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'rajesh.varma@delhibar.org.in', password: 'Password@123' });
    advocateToken = advLogin.body.data.accessToken;
    advocateUserId = advLogin.body.data.user.id;
  });

  afterAll(() => {
    dbStore.resetToDefault();
  });

  // =========================================================================
  // SUB-SUITE 8.1: Dashboard Numbers Match DB Counts Exactly
  // =========================================================================
  describe('8.1 Dashboard Metrics & DB Count Parity', () => {
    it('summary card figures must accurately reflect live database records', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cards = res.body.data.summaryCards;

      // 1. Total Citizens matches DB user roles
      const expectedCitizens = dbStore.userRoles.filter((r) => r.role === RoleType.CITIZEN).length;
      expect(cards.totalCitizens).toBe(expectedCitizens);

      // 2. Total Providers matches DB user roles
      const expectedProviders = dbStore.userRoles.filter((r) => r.role === RoleType.LSP).length;
      expect(cards.totalProviders).toBe(expectedProviders);

      // 3. Active Escrow Held matches DB payments
      const expectedEscrow = dbStore.payments
        .filter((p) => p.status === 'CAPTURED_IN_ESCROW' || p.status === 'ESCROW_LOCKED')
        .reduce((sum, p) => sum + p.amountINR, 0);
      expect(cards.activeEscrowHeldINR).toBe(expectedEscrow);

      // 4. Settled Provider Earnings matches completed bookings
      const expectedSettled = dbStore.bookings
        .filter((b) => b.bookingStatus === BookingStatus.COMPLETED)
        .reduce((sum, b) => sum + b.providerEarningsINR, 0);
      expect(cards.totalSettledEarningsINR).toBe(expectedSettled);

      // 5. Active disputes count matches open disputes
      const expectedDisputes = dbStore.disputes.filter(
        (d) => d.status === 'PENDING_ADMIN_REVIEW' || d.status === 'OPEN'
      ).length;
      expect(cards.activeDisputes).toBe(expectedDisputes);
    });

    it('reject non-admin users from accessing dashboard telemetry (HTTP 403)', async () => {
      const citizenRes = await request(app)
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(citizenRes.status).toBe(403);

      const lspRes = await request(app)
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${advocateToken}`);
      expect(lspRes.status).toBe(403);
    });

    it('analytics endpoint filters financial metrics by date range (startDate / endDate)', async () => {
      const pastDate = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
      const futureDate = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();

      const res = await request(app)
        .get(`/api/v1/admin/analytics/overview?startDate=${pastDate}&endDate=${futureDate}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.financialTelemetry).toBeDefined();
    });
  });

  // =========================================================================
  // SUB-SUITE 8.2: User Management (Directory, Search, Suspend & Reactivate)
  // =========================================================================
  describe('8.2 User Management & Account Governance', () => {
    it('should retrieve paginated user directory with roles and account statuses', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);

      const user = res.body.data.items[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('fullName');
      expect(user).toHaveProperty('roles');
      expect(user).toHaveProperty('status');
    });

    it('should filter user directory by name search query', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?search=Sunita')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(items[0].fullName).toContain('Sunita');
    });

    it('should suspend a user account and record immutable audit log (HTTP 200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${citizenUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: AccountStatus.SUSPENDED,
          reason: 'Investigation of suspicious booking cancellation patterns',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(AccountStatus.SUSPENDED);

      // Verify db update
      const userInDb = dbStore.users.find((u) => u.id === citizenUserId);
      expect(userInDb?.status).toBe(AccountStatus.SUSPENDED);

      // Verify audit log
      const audit = dbStore.auditLogs.find(
        (a) => a.resourceId === citizenUserId && a.action === 'ADMIN_USER_STATUS_CHANGE'
      );
      expect(audit).toBeDefined();
      expect(audit?.diffPayload.newStatus).toBe(AccountStatus.SUSPENDED);
    });

    it('should reactivate a suspended user account and record audit log (HTTP 200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${citizenUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: AccountStatus.ACTIVE,
          reason: 'Verification completed: account cleared of any irregularities',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(AccountStatus.ACTIVE);

      const userInDb = dbStore.users.find((u) => u.id === citizenUserId);
      expect(userInDb?.status).toBe(AccountStatus.ACTIVE);
    });

    it('reject invalid user status value with validation error (HTTP 400)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${citizenUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'INVALID_STATUS_CODE',
          reason: 'Test invalid status',
        });

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // SUB-SUITE 8.3: Legal Category Management (CRUD)
  // =========================================================================
  describe('8.3 Legal Category Management (CRUD)', () => {
    let createdCategoryId: string;

    it('should retrieve list of statutory legal practice categories (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);

      const codes = res.body.data.map((c: any) => c.code);
      expect(codes).toContain('CIVIL_LITIGATION');
      expect(codes).toContain('FAMILY_MATRIMONIAL');
      expect(codes).toContain('NOTARIAL_AFFIDAVIT');
      expect(codes).toContain('ARBITRATION_MEDIATION');
    });

    it('should allow admin to create a new legal practice category (HTTP 201)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CYBER_DATA_PRIVACY',
          name: 'Cyber Law & DPDP Act Compliance',
          description: 'Data protection compliance, IT Act disputes, and digital consumer rights.',
          applicableProviderTypes: [ProviderType.ADVOCATE, ProviderType.LEGAL_CONSULTANT],
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('CYBER_DATA_PRIVACY');
      createdCategoryId = res.body.data.id;

      // Verify category in dbStore
      const catInDb = dbStore.categories.find((c) => c.id === createdCategoryId);
      expect(catInDb).toBeDefined();

      // Verify audit log
      const audit = dbStore.auditLogs.find(
        (a) => a.resourceId === createdCategoryId && a.action === 'CATEGORY_CREATED'
      );
      expect(audit).toBeDefined();
    });

    it('should reject creation of duplicate category code (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CYBER_DATA_PRIVACY', // Duplicate
          name: 'Duplicate Category',
          description: 'Testing duplicate rejection',
          applicableProviderTypes: [ProviderType.ADVOCATE],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already exists');
    });

    it('should allow admin to update category details (HTTP 200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Cyber Crimes & DPDP Digital Compliance',
          description: 'Updated description for digital legal assistance.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Cyber Crimes & DPDP Digital Compliance');

      // Verify audit log
      const audit = dbStore.auditLogs.find(
        (a) => a.resourceId === createdCategoryId && a.action === 'CATEGORY_UPDATED'
      );
      expect(audit).toBeDefined();
    });

    it('should allow admin to delete a category (HTTP 200)', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('deleted successfully');

      // Verify removed from dbStore
      const catInDb = dbStore.categories.find((c) => c.id === createdCategoryId);
      expect(catInDb).toBeUndefined();

      // Verify audit log
      const audit = dbStore.auditLogs.find(
        (a) => a.resourceId === createdCategoryId && a.action === 'CATEGORY_DELETED'
      );
      expect(audit).toBeDefined();
    });
  });

  // =========================================================================
  // SUB-SUITE 8.4: Citizen Escrow Dispute Handling
  // =========================================================================
  describe('8.4 Dispute Handling & Escrow Adjudication', () => {
    it('should fetch list of active citizen escrow disputes (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/disputes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);

      const dispute = res.body.data.items[0];
      expect(dispute).toHaveProperty('id');
      expect(dispute).toHaveProperty('escrowAmountINR');
      expect(dispute).toHaveProperty('raisedBy');
      expect(dispute).toHaveProperty('reasonCode');
    });

    it('should resolve dispute with REFUND_CITIZEN action and release escrow back to client (HTTP 200)', async () => {
      const openDispute = dbStore.disputes.find(
        (d) => d.status === 'PENDING_ADMIN_REVIEW' || d.status === 'OPEN'
      );
      expect(openDispute).toBeDefined();

      const res = await request(app)
        .post(`/api/v1/admin/disputes/${openDispute!.id}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'REFUND_CITIZEN',
          resolutionNotes: 'Provider unexcused absence verified from server video room attendance telemetry.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RESOLVED_REFUNDED');

      // Verify payment refunded in dbStore
      const payment = dbStore.payments.find((p) => p.bookingId === openDispute!.bookingId);
      expect(payment?.status).toBe('REFUNDED');
      expect(payment?.refundedAt).toBeDefined();

      // Verify audit log recorded
      const audit = dbStore.auditLogs.find(
        (a) => a.resourceId === openDispute!.id && a.action === 'DISPUTE_REFUND_CITIZEN'
      );
      expect(audit).toBeDefined();
    });

    it('should reject resolving an already resolved dispute (HTTP 400)', async () => {
      const resolvedDispute = dbStore.disputes.find((d) => d.status.startsWith('RESOLVED'));
      expect(resolvedDispute).toBeDefined();

      const res = await request(app)
        .post(`/api/v1/admin/disputes/${resolvedDispute!.id}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'RELEASE_TO_PROVIDER',
          resolutionNotes: 'Attempting to re-resolve',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Dispute is already resolved');
    });
  });

  // =========================================================================
  // SUB-SUITE 8.5: Incentive Rule Governance & Metrics
  // =========================================================================
  describe('8.5 Incentive Configuration & Telemetry', () => {
    it('should retrieve all incentive rules with live trigger metrics (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/incentive-rules')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      for (const rule of res.body.data) {
        expect(rule).toHaveProperty('ruleCode');
        expect(rule).toHaveProperty('pointsAwarded');
        expect(rule).toHaveProperty('timesTriggered');
        expect(rule).toHaveProperty('totalPointsIssued');
      }
    });

    it('should allow admin to update rule points and A/B test cohort (HTTP 200)', async () => {
      const rule = dbStore.incentiveRules[0];

      const res = await request(app)
        .patch(`/api/v1/admin/incentive-rules/${rule.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pointsAwarded: 60,
          abTestGroup: 'B',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.pointsAwarded).toBe(60);
      expect(res.body.data.abTestGroup).toBe('B');

      // Verify audit log
      const audit = dbStore.auditLogs.find(
        (a) => a.resourceId === rule.id && a.action === 'INCENTIVE_RULE_UPDATED'
      );
      expect(audit).toBeDefined();
    });
  });

  // =========================================================================
  // SUB-SUITE 8.6: Statutory Audit Trail & CSV Data Export
  // =========================================================================
  describe('8.6 Statutory Audit Trail & CSV Export Engine', () => {
    it('should retrieve paginated statutory audit trail (DPDP Act & IT Act 2000) (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);

      const log = res.body.data.items[0];
      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('resourceType');
      expect(log).toHaveProperty('createdAt');
    });

    it('should export users directory as standard CSV file with headers (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/export/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment; filename="users-export.csv"');

      // Verify CSV header line
      expect(res.text).toContain('ID,Full Name,Phone,Email,Status,Roles,Created At');
      // Verify data lines present
      expect(res.text).toContain('Priya Sharma');
      expect(res.text).toContain('Rajesh Varma');
    });

    it('should export statutory audit logs as CSV file (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/export/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment; filename="audit-logs-export.csv"');

      expect(res.text).toContain('ID,Timestamp,User ID,Action,Resource Type,Resource ID,IP Address');
    });

    it('reject non-admin users from accessing CSV exports (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/export/users')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
    });
  });
});

