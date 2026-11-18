import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../../config/database';
import { VerificationStatus, PointsType, TierLevel } from '../../common/types';
import { VerificationDecisionInput } from './verification.dto';
import { notificationsService } from '../notifications/notifications.service';

export class VerificationService {
  public async getQueue(status?: VerificationStatus, page: number = 1, limit: number = 10) {
    let requests = dbStore.verificationRequests.slice();

    if (status) {
      requests = requests.filter((r) => r.status === status);
    }

    requests.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

    const total = requests.length;
    const startIndex = (page - 1) * limit;
    const paginated = requests.slice(startIndex, startIndex + limit);

    const items = paginated.map((req) => {
      const profile = dbStore.providerProfiles.find((p) => p.id === req.providerProfileId);
      const user = profile ? dbStore.users.find((u) => u.id === profile.userId) : null;
      const credentials = dbStore.providerCredentials.filter((c) => c.providerProfileId === req.providerProfileId);

      return {
        requestId: req.id,
        providerProfileId: req.providerProfileId,
        providerName: user?.fullName || 'Unknown',
        phone: user?.phone || '',
        email: user?.email || null,
        providerType: profile?.providerType,
        stateBarCouncil: profile?.stateBarCouncil,
        barRegistrationNo: profile?.barRegistrationNo,
        notaryAppointmentNo: profile?.notaryAppointmentNo,
        state: profile?.state,
        district: profile?.district,
        status: req.status,
        submittedAt: req.submittedAt,
        credentialsCount: credentials.length,
        ocrPayload: req.ocrPayload,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async getDossier(providerProfileId: string) {
    const profile = dbStore.providerProfiles.find((p) => p.id === providerProfileId);
    if (!profile) throw new Error('Provider profile not found');

    const user = dbStore.users.find((u) => u.id === profile.userId);
    const credentials = dbStore.providerCredentials.filter((c) => c.providerProfileId === profile.id);
    const requests = dbStore.verificationRequests
      .filter((r) => r.providerProfileId === profile.id)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    const badges = dbStore.providerBadges.filter((b) => b.providerProfileId === profile.id);

    return {
      profile: {
        ...profile,
        user: user
          ? {
              fullName: user.fullName,
              phone: user.phone,
              email: user.email,
              preferredLanguage: user.preferredLanguage,
            }
          : null,
      },
      credentials,
      verificationHistory: requests,
      awardedBadges: badges.map((b) => {
        const badgeDef = dbStore.badges.find((bd) => bd.id === b.badgeId);
        return {
          ...badgeDef,
          awardedAt: b.awardedAt,
        };
      }),
    };
  }

  public async processDecision(
    adminUserId: string,
    providerProfileId: string,
    input: VerificationDecisionInput,
    ipAddress?: string
  ) {
    const profile = dbStore.providerProfiles.find((p) => p.id === providerProfileId);
    if (!profile) throw new Error('Provider profile not found');

    const user = dbStore.users.find((u) => u.id === profile.userId);
    const now = new Date();

    const request = dbStore.verificationRequests
      .filter((r) => r.providerProfileId === profile.id)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];

    if (input.action === 'SET_UNDER_REVIEW') {
      profile.verificationStatus = VerificationStatus.UNDER_REVIEW;
      if (request) {
        request.status = VerificationStatus.UNDER_REVIEW;
        request.reviewedAt = now;
        request.reviewedByUserId = adminUserId;
        request.reviewNotes = input.reviewNotes;
      }

      // Notify Provider
      dbStore.notifications.push({
        id: uuidv4(),
        userId: profile.userId,
        title: 'Onboarding Dossier Under Review',
        message: `Your professional credentials dossier is now under active review. Notes: ${input.reviewNotes}`,
        type: 'VERIFICATION',
        isRead: false,
        createdAt: now,
      });
      await notificationsService.triggerVerificationNotification(
        profile.userId,
        VerificationStatus.UNDER_REVIEW,
        input.reviewNotes
      );

      // Audit Log
      dbStore.auditLogs.push({
        id: uuidv4(),
        userId: adminUserId,
        action: 'VERIFICATION_SET_UNDER_REVIEW',
        resourceType: 'ProviderProfile',
        resourceId: profile.id,
        ipAddress: ipAddress || null,
        userAgent: null,
        diffPayload: { notes: input.reviewNotes },
        createdAt: now,
      });

      return { message: 'Provider dossier marked as Under Review', status: VerificationStatus.UNDER_REVIEW };
    }

    if (input.action === 'REQUEST_MORE_INFO') {
      profile.verificationStatus = VerificationStatus.UNDER_REVIEW;
      if (request) {
        request.status = VerificationStatus.UNDER_REVIEW;
        request.reviewedAt = now;
        request.reviewedByUserId = adminUserId;
        request.reviewNotes = input.reviewNotes;
      }

      // Notify Provider
      dbStore.notifications.push({
        id: uuidv4(),
        userId: profile.userId,
        title: 'Clarification Requested on Credentials',
        message: `The verification officer requested further information: ${input.reviewNotes}`,
        type: 'VERIFICATION',
        isRead: false,
        createdAt: now,
      });
      await notificationsService.triggerVerificationNotification(
        profile.userId,
        'CLARIFICATION_REQUESTED',
        input.reviewNotes
      );

      // Audit Log
      dbStore.auditLogs.push({
        id: uuidv4(),
        userId: adminUserId,
        action: 'VERIFICATION_MORE_INFO_REQUESTED',
        resourceType: 'ProviderProfile',
        resourceId: profile.id,
        ipAddress: ipAddress || null,
        userAgent: null,
        diffPayload: { notes: input.reviewNotes },
        createdAt: now,
      });

      return { message: 'Additional information requested from provider', status: VerificationStatus.UNDER_REVIEW };
    }

    if (input.action === 'REJECT') {
      profile.verificationStatus = VerificationStatus.REJECTED;
      profile.rejectionReason = `[${input.reasonCode}] ${input.reviewNotes}`;
      profile.updatedAt = now;

      if (request) {
        request.status = VerificationStatus.REJECTED;
        request.reviewedAt = now;
        request.reviewedByUserId = adminUserId;
        request.reviewNotes = profile.rejectionReason;
      }

      // Notify Provider
      dbStore.notifications.push({
        id: uuidv4(),
        userId: profile.userId,
        title: 'Verification Request Rejected',
        message: `Your credentials could not be verified. Reason: ${profile.rejectionReason}`,
        type: 'VERIFICATION',
        isRead: false,
        createdAt: now,
      });
      await notificationsService.triggerVerificationNotification(
        profile.userId,
        VerificationStatus.REJECTED,
        profile.rejectionReason
      );

      // Audit Log
      dbStore.auditLogs.push({
        id: uuidv4(),
        userId: adminUserId,
        action: 'VERIFICATION_REJECTED',
        resourceType: 'ProviderProfile',
        resourceId: profile.id,
        ipAddress: ipAddress || null,
        userAgent: null,
        diffPayload: { reasonCode: input.reasonCode, notes: input.reviewNotes },
        createdAt: now,
      });

      return {
        message: 'Provider verification rejected with statutory reason note.',
        status: VerificationStatus.REJECTED,
      };
    }

    if (input.action === 'APPROVE') {
      profile.verificationStatus = VerificationStatus.APPROVED;
      profile.verifiedAt = now;
      profile.rejectionReason = null;
      profile.updatedAt = now;

      if (user) {
        user.status = 'ACTIVE' as any;
        user.updatedAt = now;
      }

      // Mark credentials verified
      const credentials = dbStore.providerCredentials.filter((c) => c.providerProfileId === profile.id);
      credentials.forEach((c) => (c.isVerified = true));

      if (request) {
        request.status = VerificationStatus.APPROVED;
        request.reviewedAt = now;
        request.reviewedByUserId = adminUserId;
        request.reviewNotes = input.reviewNotes;
      }

      // 1. Bestow "VERIFIED_PROVIDER" badge
      const verifiedBadge = dbStore.badges.find((b) => b.code === 'VERIFIED_PROVIDER');
      if (verifiedBadge) {
        const hasBadge = dbStore.providerBadges.some(
          (pb) => pb.providerProfileId === profile.id && pb.badgeId === verifiedBadge.id
        );
        if (!hasBadge) {
          dbStore.providerBadges.push({
            id: uuidv4(),
            providerProfileId: profile.id,
            badgeId: verifiedBadge.id,
            awardedAt: now,
          });
        }
      }

      // 2. Bestow "FOUNDING_MEMBER" badge if early adopter
      const foundingBadge = dbStore.badges.find((b) => b.code === 'FOUNDING_MEMBER');
      if (foundingBadge) {
        const hasBadge = dbStore.providerBadges.some(
          (pb) => pb.providerProfileId === profile.id && pb.badgeId === foundingBadge.id
        );
        if (!hasBadge) {
          dbStore.providerBadges.push({
            id: uuidv4(),
            providerProfileId: profile.id,
            badgeId: foundingBadge.id,
            awardedAt: now,
          });
        }
      }

      // 3. Award 100 Verification Points in Wallet & Immutable Points Ledger
      const wallet = dbStore.wallets.find((w) => w.userId === profile.userId);
      if (wallet) {
        wallet.rewardPointsBalance += 100;
        wallet.updatedAt = now;
        profile.totalPoints += 100;

        dbStore.pointsLedger.push({
          id: uuidv4(),
          walletId: wallet.id,
          points: 100,
          type: PointsType.CREDIT,
          referenceType: 'VERIFICATION_APPROVAL',
          referenceId: profile.id,
          description: 'Awarded 100 points for official Bar Council verification approval.',
          balanceAfter: wallet.rewardPointsBalance,
          createdAt: now,
        });

        // 4. Auto-upgrade Tier if threshold crossed
        if (profile.totalPoints >= 100 && profile.tierId === 'tier-bronze-01') {
          profile.tierId = 'tier-silver-02';
        }
      }

      // 5. Notify Provider
      dbStore.notifications.push({
        id: uuidv4(),
        userId: profile.userId,
        title: 'Verification Approved - Verified Badge Bestowed!',
        message: 'Congratulations! Your professional credentials have been verified by the Bar Council scrutiny desk.',
        type: 'VERIFICATION',
        isRead: false,
        createdAt: now,
      });
      await notificationsService.triggerVerificationNotification(
        profile.userId,
        VerificationStatus.APPROVED,
        input.reviewNotes
      );

      // 6. Audit Log Entry
      dbStore.auditLogs.push({
        id: uuidv4(),
        userId: adminUserId,
        action: 'VERIFICATION_APPROVED',
        resourceType: 'ProviderProfile',
        resourceId: profile.id,
        ipAddress: ipAddress || null,
        userAgent: null,
        diffPayload: {
          approvedBy: adminUserId,
          barRegistrationNo: profile.barRegistrationNo,
          awardedPoints: 100,
          notes: input.reviewNotes,
        },
        createdAt: now,
      });

      return {
        message: 'Provider successfully verified and published to public directory!',
        status: VerificationStatus.APPROVED,
        awardedPoints: 100,
        assignedTier: profile.tierId,
      };
    }

    throw new Error('Invalid verification action specified.');
  }
}

