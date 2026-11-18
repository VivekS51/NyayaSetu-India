import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../../config/database';
import { AccountStatus, BookingStatus, DisputeStatus } from '../../common/types';
import { AuditService } from '../audit/audit.service';
import { envConfig } from '../../config/env.config';

export class ComplianceService {
  /**
   * Statutory Terms of Service (BCI Rule 36 & IT Act Intermediary Guidelines)
   */
  public getTermsOfService() {
    return {
      title: 'NyayaSetu India — Terms of Service & Intermediary Conditions',
      version: '2026.1',
      lastUpdated: '2026-01-15T00:00:00.000Z',
      governingLaw: 'Laws of India (New Delhi Jurisdiction)',
      statutoryFramework: [
        'Advocates Act, 1961 (Section 35 & 49[1][ah])',
        'Bar Council of India Rules, Part VI, Chapter II, Section IV, Rule 36',
        'Information Technology Act, 2000 (Section 79 Intermediary Safe Harbor)',
        'Digital Personal Data Protection Act, 2023',
        'Consumer Protection (E-Commerce) Rules, 2020',
      ],
      coreTerms: {
        platformStatus:
          'Neutral Technology Facilitation Platform. NyayaSetu is not a law firm, does not provide legal representation, does not solicit briefs, and does not charge commission on legal fees.',
        advocateFeeDecoupling:
          '100% of the consultation and professional fee fixed by the advocate is remitted in full to the practitioner without deduction pursuant to Section 35 Advocates Act 1961 (0% platform commission on legal fees).',
        prohibitionOnTouting:
          'Comparative rankings, subjective claims of superiority ("best lawyer", "100% win guarantee"), paid sponsored boosting, and commercial advertisement of legal services are strictly prohibited.',
        sovereignEscrow:
          'Client consultation payments are held in an authorized non-interest bearing escrow account pending verified delivery of the scheduled service.',
      },
    };
  }

  /**
   * DPDP Act 2023 Statutory Privacy Policy
   */
  public getPrivacyPolicy() {
    return {
      title: 'NyayaSetu India — Sovereign Data Protection & Privacy Notice',
      version: '2026.1',
      complianceStandard: 'Digital Personal Data Protection Act (DPDP Act), 2023',
      dataFiduciary: 'NyayaSetu India Justice Enablement Platform, Department of Justice Initiative',
      dataSovereigntyLocation: 'Mumbai Data Center, Republic of India (Zero Cross-Border Transfer)',
      purposesOfProcessing: [
        'Verification of Bar Council registration credentials and notary appointment gazettes',
        'Scheduling and conducting encrypted audio/video legal consultations',
        'Generation of statutory GST tax invoices and regulatory compliance reporting',
        'Resolution of consumer escrow grievances and dispute redressal',
      ],
      citizenRights: {
        rightToAccess: 'Right to obtain a comprehensive machine-readable summary of all personal data held.',
        rightToCorrection: 'Right to update and correct inaccurate identity or credential information.',
        rightToErasure: 'Right to request erasure and decommissioning of personal data when purpose is fulfilled.',
        rightToGrievanceRedressal: 'Right to lodge formal grievances with the Data Protection Grievance Officer.',
      },
    };
  }

  /**
   * Sovereign Escrow & Statutory Refund Policy
   */
  public getRefundPolicy() {
    return {
      title: 'NyayaSetu India — Sovereign Escrow & Citizen Refund Policy',
      version: '2026.1',
      statutoryCitation: 'Consumer Protection (E-Commerce) Rules 2020 & Indian Contract Act 1872',
      escrowMechanism:
        'Client funds are locked securely in sovereign escrow upon booking confirmation. Funds are never released to the provider until service completion is confirmed.',
      refundScenarios: [
        {
          scenario: 'Cancellation by Citizen (> 2 hours prior to consultation)',
          refundPercent: 100,
          deductionNote: 'Full refund of consultation fee and platform facilitation fee to original payment source.',
        },
        {
          scenario: 'Cancellation or No-Show by Legal Service Provider',
          refundPercent: 100,
          deductionNote: 'Immediate full refund to citizen. In addition, provider is penalized on activity points.',
        },
        {
          scenario: 'Active Escrow Grievance Dispute Upheld',
          refundPercent: 100,
          deductionNote: 'Full escrow refund upon Grievance Officer verification of non-delivery.',
        },
      ],
      turnaroundTime: 'Statutory refund credit to bank/UPI within 3-5 banking days.',
    };
  }

  /**
   * Grievance Redressal Officer Contact Details (Mandated by IT Rules 2021 & DPDP Act 2023)
   */
  public getGrievanceDetails() {
    return {
      title: 'Statutory Grievance Redressal Desk',
      regulatoryMandate: 'Rule 3(2) Information Technology (Intermediary Guidelines) Rules, 2021 & DPDP Act 2023',
      officer: {
        name: 'Shri Vivek K. Narayanan',
        designation: 'Chief Data Protection & Grievance Redressal Officer',
        email: 'grievance-officer@nyayasetu.gov.in',
        helpline: '+91-11-2338-1234',
        officeAddress: 'Room 402, Department of Justice, Jaisalmer House, 26 Man Singh Road, New Delhi - 110011',
        workingHours: 'Monday to Friday, 09:30 AM – 06:00 PM (IST)',
      },
      escalationLevels: [
        { level: 1, authority: 'Platform Grievance Officer', statutorySLA: 'Acknowledgement within 24 hours, resolution within 15 days' },
        { level: 2, authority: 'Data Protection Board of India (DPBI)', statutorySLA: 'Statutory appellate tribunal under DPDP Act 2023' },
      ],
    };
  }

  /**
   * DPDP Act 2023 Section 11: Machine-Readable Personal Data Export
   */
  public async exportUserData(userId: string) {
    const user = dbStore.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const roles = dbStore.userRoles.filter((r) => r.userId === userId).map((r) => r.role);
    const profile = dbStore.providerProfiles.find((p) => p.userId === userId);
    const wallet = dbStore.wallets.find((w) => w.userId === userId);
    const bookings = dbStore.bookings.filter(
      (b) => b.citizenId === userId || (profile && b.providerProfileId === profile.id)
    );
    const payments = dbStore.payments.filter((p) => bookings.some((b) => b.id === p.bookingId));
    const ledger = wallet ? dbStore.pointsLedger.filter((l) => l.walletId === wallet.id) : [];
    const reviews = dbStore.reviews.filter(
      (r) => r.citizenId === userId || (profile && r.providerProfileId === profile.id)
    );
    const auditEvents = dbStore.auditLogs.filter((a) => a.userId === userId);

    const exportPayload = {
      exportMetadata: {
        dpdpActVersion: '2023',
        exportTimestamp: new Date().toISOString(),
        userId: user.id,
        requestingUser: user.fullName,
      },
      profile: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        roles,
        preferredLanguage: user.preferredLanguage,
        status: user.status,
        createdAt: user.createdAt,
      },
      providerDetails: profile || null,
      walletAndLedger: {
        wallet: wallet || null,
        transactionCount: ledger.length,
        ledgerEntries: ledger,
      },
      consultationBookings: bookings,
      paymentTransactions: payments,
      reviewsAndFeedback: reviews,
      statutoryAuditTrail: auditEvents,
    };

    // Log statutory audit log
    await AuditService.log({
      userId,
      action: 'DPDP_DATA_EXPORT_REQUESTED',
      resourceType: 'USER',
      resourceId: userId,
      diffPayload: { recordsCount: bookings.length + payments.length + ledger.length },
    });

    return exportPayload;
  }

  /**
   * DPDP Act 2023 Section 12: Right to Erasure / Account Decommissioning
   */
  public async eraseUserData(userId: string) {
    const user = dbStore.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const profile = dbStore.providerProfiles.find((p) => p.userId === userId);

    // Active escrow / dispute guardrail: Cannot erase data while funds are actively disputed
    const activeDisputedBooking = dbStore.bookings.find(
      (b) =>
        (b.citizenId === userId || (profile && b.providerProfileId === profile.id)) &&
        (b.bookingStatus === BookingStatus.DISPUTED || b.bookingStatus === BookingStatus.PENDING_PAYMENT)
    );

    if (activeDisputedBooking) {
      throw new Error(
        'Cannot decommission account while an active legal booking or grievance dispute is open in sovereign escrow.'
      );
    }

    const previousPhone = user.phone;
    const previousEmail = user.email;

    // Anonymize and wipe personal identifiable information (PII)
    user.fullName = 'Anonymized Citizen (DPDP Act Erased)';
    user.phone = `+9100000${user.id.substring(0, 5)}`;
    user.email = `anonymized_${user.id.substring(0, 8)}@erased.internal`;
    user.status = AccountStatus.SUSPENDED;
    user.updatedAt = new Date();

    if (profile) {
      profile.bio = null;
      profile.updatedAt = new Date();
    }

    // Revoke all active sessions
    dbStore.revokedTokens.add(userId);

    // Statutory audit log of erasure
    await AuditService.log({
      userId,
      action: 'DPDP_ACCOUNT_ERASURE_COMPLETED',
      resourceType: 'USER',
      resourceId: userId,
      diffPayload: { previousPhoneMasked: `+91******${previousPhone.slice(-4)}`, status: 'ERASED' },
    });

    return {
      success: true,
      message:
        'Personal data successfully anonymized and account decommissioned pursuant to Section 12 DPDP Act 2023.',
      erasedAt: new Date().toISOString(),
    };
  }
}

export const complianceService = new ComplianceService();
