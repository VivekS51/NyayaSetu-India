import { v4 as uuidv4 } from 'uuid';
import { dbStore, ReviewRecord } from '../../config/database';
import { BookingStatus, PointsType } from '../../common/types';
import {
  CreateReviewInput,
  RespondReviewInput,
  FlagReviewInput,
  ModerateReviewInput,
} from './reviews.dto';

export class ReviewsService {
  public async createReview(citizenId: string, input: CreateReviewInput) {
    const booking = dbStore.bookings.find((b) => b.id === input.bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.citizenId !== citizenId) {
      throw new Error('Unauthorized: You can only review consultations you personally booked.');
    }

    if (booking.bookingStatus !== BookingStatus.COMPLETED) {
      throw new Error('Reviews can only be submitted after consultation is officially completed.');
    }

    // Check duplicate: strictly one review per consultation
    const existing = dbStore.reviews.find((r) => r.bookingId === booking.id);
    if (existing) {
      throw new Error('A review has already been submitted for this consultation.');
    }

    const now = new Date();
    const reviewRecord: ReviewRecord = {
      id: uuidv4(),
      bookingId: booking.id,
      citizenId,
      providerProfileId: booking.providerProfileId,
      rating: input.rating,
      feedbackText: input.feedbackText || null,
      providerResponse: null,
      isFlagged: false,
      isVerifiedBooking: true,
      createdAt: now,
      updatedAt: now,
    };

    dbStore.reviews.push(reviewRecord);

    // If rating is 4 or 5 stars, award provider activity incentive points
    if (input.rating >= 4) {
      const providerProfile = dbStore.providerProfiles.find((p) => p.id === booking.providerProfileId);
      if (providerProfile) {
        const providerWallet = dbStore.wallets.find((w) => w.userId === providerProfile.userId);
        if (providerWallet) {
          providerWallet.rewardPointsBalance += 15;
          providerProfile.totalPoints += 15;
          providerWallet.updatedAt = now;

          dbStore.pointsLedger.push({
            id: uuidv4(),
            walletId: providerWallet.id,
            points: 15,
            type: PointsType.CREDIT,
            referenceType: 'HIGH_RATING_RECEIVED',
            referenceId: reviewRecord.id,
            description: `Earned 15 activity points for high client satisfaction (${input.rating}★ rating).`,
            balanceAfter: providerWallet.rewardPointsBalance,
            createdAt: now,
          });
        }
      }
    }

    // Audit log
    dbStore.auditLogs.push({
      id: uuidv4(),
      userId: citizenId,
      action: 'REVIEW_SUBMITTED',
      resourceType: 'Review',
      resourceId: reviewRecord.id,
      ipAddress: null,
      userAgent: null,
      diffPayload: {
        bookingId: booking.id,
        rating: input.rating,
        providerProfileId: booking.providerProfileId,
      },
      createdAt: now,
    });

    return reviewRecord;
  }

  public async respondToReview(providerUserId: string, reviewId: string, input: RespondReviewInput) {
    const review = dbStore.reviews.find((r) => r.id === reviewId);
    if (!review) throw new Error('Review not found');

    const providerProfile = dbStore.providerProfiles.find((p) => p.id === review.providerProfileId);
    if (!providerProfile || providerProfile.userId !== providerUserId) {
      throw new Error('Unauthorized: You can only respond to reviews on your own profile.');
    }

    review.providerResponse = input.response;
    review.updatedAt = new Date();

    dbStore.auditLogs.push({
      id: uuidv4(),
      userId: providerUserId,
      action: 'REVIEW_RESPONSE_POSTED',
      resourceType: 'Review',
      resourceId: review.id,
      ipAddress: null,
      userAgent: null,
      diffPayload: { response: input.response },
      createdAt: new Date(),
    });

    return review;
  }

  public async flagReview(userId: string, reviewId: string, input: FlagReviewInput) {
    const review = dbStore.reviews.find((r) => r.id === reviewId);
    if (!review) throw new Error('Review not found');

    review.isFlagged = true;
    review.updatedAt = new Date();

    dbStore.auditLogs.push({
      id: uuidv4(),
      userId,
      action: 'REVIEW_FLAGGED_ABUSE',
      resourceType: 'Review',
      resourceId: review.id,
      ipAddress: null,
      userAgent: null,
      diffPayload: { reason: input.reason },
      createdAt: new Date(),
    });

    return { message: 'Review flagged for administrative content moderation.' };
  }

  public async getFlaggedReviews() {
    const flagged = dbStore.reviews.filter((r) => r.isFlagged);
    return flagged.map((r) => {
      const booking = dbStore.bookings.find((b) => b.id === r.bookingId);
      const providerProfile = dbStore.providerProfiles.find((p) => p.id === r.providerProfileId);
      const providerUser = providerProfile ? dbStore.users.find((u) => u.id === providerProfile.userId) : null;
      const citizen = dbStore.users.find((u) => u.id === r.citizenId);
      return {
        ...r,
        citizenName: citizen?.fullName || 'Verified Client',
        providerName: providerUser?.fullName || 'Advocate',
        bookingReference: booking?.bookingReference || 'N/A',
      };
    });
  }

  public async moderateReview(adminUserId: string, reviewId: string, input: ModerateReviewInput) {
    const review = dbStore.reviews.find((r) => r.id === reviewId);
    if (!review) throw new Error('Review not found');

    const now = new Date();
    if (input.action === 'RESTORE' || input.action === 'DISMISS_FLAG') {
      review.isFlagged = false;
      review.updatedAt = now;
    } else if (input.action === 'REMOVE') {
      const index = dbStore.reviews.findIndex((r) => r.id === reviewId);
      if (index !== -1) {
        dbStore.reviews.splice(index, 1);
      }
    }

    dbStore.auditLogs.push({
      id: uuidv4(),
      userId: adminUserId,
      action: `REVIEW_MODERATED_${input.action}`,
      resourceType: 'Review',
      resourceId: reviewId,
      ipAddress: null,
      userAgent: null,
      diffPayload: { action: input.action, notes: input.moderationNotes },
      createdAt: now,
    });

    return {
      message: `Review moderation completed: ${input.action}`,
      reviewId,
      action: input.action,
    };
  }

  public async getProviderReviews(providerProfileId: string) {
    const reviews = dbStore.reviews
      .filter((r) => r.providerProfileId === providerProfileId && !r.isFlagged)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = reviews.length;
    const averageRating =
      total > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : '5.0';

    const items = reviews.map((r) => {
      const citizen = dbStore.users.find((u) => u.id === r.citizenId);
      return {
        id: r.id,
        rating: r.rating,
        feedbackText: r.feedbackText,
        providerResponse: r.providerResponse,
        isVerifiedBooking: r.isVerifiedBooking,
        createdAt: r.createdAt,
        clientName: citizen ? `${citizen.fullName.split(' ')[0]} (Verified Client)` : 'Verified Client',
      };
    });

    return {
      total,
      averageRating: parseFloat(averageRating),
      items,
    };
  }
}
