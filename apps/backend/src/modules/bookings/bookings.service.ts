import { v4 as uuidv4 } from 'uuid';
import { dbStore, BookingRecord, InvoiceRecord, ConversationRecord } from '../../config/database';
import { envConfig } from '../../config/env.config';
import { SecurityUtils } from '../../common/utils/security.utils';
import {
  BookingStatus,
  PaymentStatus,
  DisputeStatus,
  PointsType,
  VerificationStatus,
  RoleType,
} from '../../common/types';
import { CreateBookingInput, CancelBookingInput, DisputeBookingInput, RescheduleBookingInput } from './bookings.dto';
import { notificationsService } from '../notifications/notifications.service';

export class BookingsService {
  public async createBooking(citizenId: string, input: CreateBookingInput): Promise<BookingRecord> {
    const providerProfile = dbStore.providerProfiles.find((p) => p.id === input.providerProfileId);
    if (!providerProfile) {
      throw new Error('Provider profile not found');
    }

    if (providerProfile.verificationStatus !== VerificationStatus.APPROVED) {
      throw new Error('Cannot book unverified legal service provider.');
    }

    const startTime = new Date(input.scheduledStartTime);
    const endTime = new Date(startTime.getTime() + input.durationMinutes * 60 * 1000);

    // Prevent past dates
    if (startTime.getTime() < Date.now() - 60 * 1000) {
      throw new Error('Appointment scheduled time cannot be in the past.');
    }

    // Atomic Double Booking Check
    const overlapping = dbStore.bookings.find((b) => {
      if (b.providerProfileId !== providerProfile.id) return false;
      if (b.bookingStatus === BookingStatus.CANCELLED_BY_CITIZEN || b.bookingStatus === BookingStatus.CANCELLED_BY_PROVIDER) {
        return false;
      }
      return startTime < b.scheduledEndTime && endTime > b.scheduledStartTime;
    });

    if (overlapping) {
      throw new Error('The selected calendar slot is already reserved. Please select another time.');
    }

    // Statutory Compliant Fee Calculation (Section 35 Advocates Act 1961)
    // Professional legal consultation fees go directly to the advocate (0% platform cut).
    // The platform charges a flat Technology Platform Facilitation Fee for infra + 18% GST.
    const providerFee = Number(providerProfile.consultationFeeINR);
    const platformFacilitationFee = 50.0; // Flat INR 50
    const gstOnPlatformFee = Math.round(platformFacilitationFee * 0.18 * 100) / 100; // INR 9.00
    const totalAmount = providerFee + platformFacilitationFee + gstOnPlatformFee;

    const bookingId = uuidv4();
    const reference = SecurityUtils.generateBookingReference();
    const now = new Date();

    const bookingRecord: BookingRecord = {
      id: bookingId,
      bookingReference: reference,
      citizenId,
      providerProfileId: providerProfile.id,
      serviceTitle: input.serviceTitle,
      deliveryMode: input.deliveryMode,
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      bookingStatus: BookingStatus.PENDING_PAYMENT,
      totalAmountINR: totalAmount,
      platformFeeINR: platformFacilitationFee,
      gstAmountINR: gstOnPlatformFee,
      providerEarningsINR: providerFee,
      cancellationReason: null,
      createdAt: now,
      updatedAt: now,
    };

    dbStore.bookings.push(bookingRecord);

    // Create Draft Invoice
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const invoice: InvoiceRecord = {
      id: uuidv4(),
      invoiceNumber,
      bookingId,
      subTotalINR: providerFee + platformFacilitationFee,
      cgstAmountINR: gstOnPlatformFee / 2,
      sgstAmountINR: gstOnPlatformFee / 2,
      totalAmountINR: totalAmount,
      sacCode: '998211',
      platformGstNumber: envConfig.compliance.platformGstNumber,
      providerEarningsINR: providerFee,
      platformFeeINR: platformFacilitationFee,
      statutoryNote:
        'Statutory legal fee paid 100% to legal practitioner pursuant to Section 35 Advocates Act 1961 (0% platform commission). Platform facilitation fee subjected to 18% GST (SAC 998211).',
      issuedAt: now,
    };
    dbStore.invoices.push(invoice);

    // Dispatch automated appointment reminders in IST
    const istTimeStr = this.formatIST(startTime);
    dbStore.notifications.push({
      id: uuidv4(),
      userId: citizenId,
      title: 'Appointment Scheduled & Slot Locked',
      message: `Your appointment for "${input.serviceTitle}" is scheduled for ${istTimeStr}. Please complete payment within 15 minutes to confirm.`,
      type: 'BOOKING',
      isRead: false,
      createdAt: now,
    });

    if (providerProfile) {
      dbStore.notifications.push({
        id: uuidv4(),
        userId: providerProfile.userId,
        title: 'New Consultation Slot Reserved',
        message: `A client has reserved a consultation slot for "${input.serviceTitle}" on ${istTimeStr}.`,
        type: 'BOOKING',
        isRead: false,
        createdAt: now,
      });

      await notificationsService.triggerBookingNotification(
        citizenId,
        providerProfile.userId,
        bookingRecord.bookingReference,
        'CREATED'
      );
    }

    return bookingRecord;
  }

  public async getBookingById(bookingId: string, currentUserId: string) {
    const booking = dbStore.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const providerProfile = dbStore.providerProfiles.find((p) => p.id === booking.providerProfileId);
    const providerUser = providerProfile ? dbStore.users.find((u) => u.id === providerProfile.userId) : null;
    const citizenUser = dbStore.users.find((u) => u.id === booking.citizenId);

    // Security Check: Only booking participants or admin can inspect
    const userRoles = dbStore.userRoles.filter((r) => r.userId === currentUserId).map((r) => r.role);
    const isParticipant =
      booking.citizenId === currentUserId ||
      providerProfile?.userId === currentUserId ||
      userRoles.includes(RoleType.ADMIN);

    if (!isParticipant) {
      throw new Error('Unauthorized - Access denied. You are not an authorized party to this legal booking.');
    }

    const payment = dbStore.payments.find((p) => p.bookingId === booking.id);
    const invoice = dbStore.invoices.find((i) => i.bookingId === booking.id);
    const conversation = dbStore.conversations.find((c) => c.bookingId === booking.id);
    const review = dbStore.reviews.find((r) => r.bookingId === booking.id);
    const dispute = dbStore.disputes.find((d) => d.bookingId === booking.id);

    return {
      booking,
      provider: providerProfile
        ? {
            id: providerProfile.id,
            fullName: providerUser?.fullName || 'Advocate',
            providerType: providerProfile.providerType,
            primaryCourt: providerProfile.primaryCourt,
            district: providerProfile.district,
            state: providerProfile.state,
            barRegistrationNo: providerProfile.barRegistrationNo,
          }
        : null,
      citizen: citizenUser
        ? {
            id: citizenUser.id,
            fullName: citizenUser.fullName,
            phone: SecurityUtils.maskPhoneNumber(citizenUser.phone),
          }
        : null,
      payment: payment || null,
      invoice: invoice || null,
      conversationId: conversation?.id || null,
      review: review || null,
      dispute: dispute || null,
    };
  }

  public async getUserBookings(userId: string, role: string) {
    let list: BookingRecord[] = [];

    if (role === RoleType.LSP) {
      const profile = dbStore.providerProfiles.find((p) => p.userId === userId);
      if (profile) {
        list = dbStore.bookings.filter((b) => b.providerProfileId === profile.id);
      }
    } else {
      list = dbStore.bookings.filter((b) => b.citizenId === userId);
    }

    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return list.map((b) => {
      const providerProfile = dbStore.providerProfiles.find((p) => p.id === b.providerProfileId);
      const providerUser = providerProfile ? dbStore.users.find((u) => u.id === providerProfile.userId) : null;
      const citizenUser = dbStore.users.find((u) => u.id === b.citizenId);

      return {
        ...b,
        providerName: providerUser?.fullName || 'Advocate',
        citizenName: citizenUser?.fullName || 'Citizen',
      };
    });
  }

  public async completeBooking(bookingId: string, currentUserId: string) {
    const booking = dbStore.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const providerProfile = dbStore.providerProfiles.find((p) => p.id === booking.providerProfileId);

    // Either party or Admin can complete
    const isParty =
      booking.citizenId === currentUserId ||
      providerProfile?.userId === currentUserId ||
      dbStore.userRoles.some((r) => r.userId === currentUserId && r.role === RoleType.ADMIN);

    if (!isParty) throw new Error('Unauthorized action');

    if (booking.bookingStatus === BookingStatus.COMPLETED) {
      return { message: 'Booking already completed', booking };
    }

    if (booking.bookingStatus === BookingStatus.DISPUTED) {
      throw new Error('Cannot complete booking: Escrow is frozen while a formal dispute is actively open.');
    }

    const now = new Date();
    booking.bookingStatus = BookingStatus.COMPLETED;
    booking.updatedAt = now;

    // Escrow Release: Transfer provider earnings to their wallet
    const payment = dbStore.payments.find((p) => p.bookingId === booking.id);
    if (payment && payment.status === PaymentStatus.CAPTURED_IN_ESCROW) {
      payment.status = PaymentStatus.RELEASED_TO_PROVIDER;
      payment.escrowReleasedAt = now;
      payment.updatedAt = now;

      if (providerProfile) {
        const providerWallet = dbStore.wallets.find((w) => w.userId === providerProfile.userId);
        if (providerWallet) {
          providerWallet.monetaryBalanceINR += Number(booking.providerEarningsINR);
          providerWallet.rewardPointsBalance += 25; // 25 activity points for completed booking
          providerWallet.updatedAt = now;

          dbStore.pointsLedger.push({
            id: uuidv4(),
            walletId: providerWallet.id,
            points: 25,
            type: PointsType.CREDIT,
            referenceType: 'BOOKING_COMPLETED',
            referenceId: booking.id,
            description: `Earned 25 activity points for completing consultation (${booking.bookingReference}).`,
            balanceAfter: providerWallet.rewardPointsBalance,
            createdAt: now,
          });
        }
      }
    }

    return {
      message: 'Consultation marked completed. Escrow released to provider wallet successfully.',
      booking,
    };
  }

  public async cancelBooking(bookingId: string, currentUserId: string, input: CancelBookingInput) {
    const booking = dbStore.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const isCitizen = booking.citizenId === currentUserId;
    const isProvider = dbStore.providerProfiles.some(
      (p) => p.id === booking.providerProfileId && p.userId === currentUserId
    );

    if (!isCitizen && !isProvider) {
      throw new Error('Not authorized to cancel this booking.');
    }

    booking.bookingStatus = isCitizen
      ? BookingStatus.CANCELLED_BY_CITIZEN
      : BookingStatus.CANCELLED_BY_PROVIDER;
    booking.cancellationReason = input.reason;
    booking.updatedAt = new Date();

    // Trigger Refund in Payment if in Escrow
    const payment = dbStore.payments.find((p) => p.bookingId === booking.id);
    if (payment && payment.status === PaymentStatus.CAPTURED_IN_ESCROW) {
      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = new Date();
      payment.updatedAt = new Date();

      await notificationsService.triggerPaymentNotification(
        booking.citizenId,
        payment.amountINR,
        booking.bookingReference,
        'REFUNDED'
      );
    }

    const providerProfile = dbStore.providerProfiles.find((p) => p.id === booking.providerProfileId);
    if (providerProfile) {
      await notificationsService.triggerBookingNotification(
        booking.citizenId,
        providerProfile.userId,
        booking.bookingReference,
        'CANCELLED'
      );
    }

    return {
      message: 'Booking cancelled. Escrow refund initiated per statutory refund policy.',
      booking,
    };
  }

  public async raiseDispute(bookingId: string, citizenId: string, input: DisputeBookingInput) {
    const booking = dbStore.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.citizenId !== citizenId) {
      throw new Error('Only the citizen who made the booking can raise a dispute.');
    }

    booking.bookingStatus = BookingStatus.DISPUTED;
    booking.updatedAt = new Date();

    const disputeId = uuidv4();
    dbStore.disputes.push({
      id: disputeId,
      bookingId,
      raisedByUserId: citizenId,
      reasonCode: input.reasonCode,
      description: input.description,
      status: DisputeStatus.OPEN,
      resolutionNotes: null,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      message: 'Dispute submitted. Funds frozen in escrow pending grievance officer investigation.',
      disputeId,
    };
  }

  public async rescheduleBooking(
    bookingId: string,
    currentUserId: string,
    input: RescheduleBookingInput
  ) {
    const booking = dbStore.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const providerProfile = dbStore.providerProfiles.find((p) => p.id === booking.providerProfileId);
    const isParticipant =
      booking.citizenId === currentUserId ||
      providerProfile?.userId === currentUserId ||
      dbStore.userRoles.some((r) => r.userId === currentUserId && r.role === RoleType.ADMIN);

    if (!isParticipant) {
      throw new Error('Unauthorized - Access denied: You cannot reschedule this consultation.');
    }

    if (
      booking.bookingStatus === BookingStatus.CANCELLED_BY_CITIZEN ||
      booking.bookingStatus === BookingStatus.CANCELLED_BY_PROVIDER ||
      booking.bookingStatus === BookingStatus.COMPLETED ||
      booking.bookingStatus === BookingStatus.DISPUTED
    ) {
      throw new Error(`Cannot reschedule a booking that is currently ${booking.bookingStatus}.`);
    }

    const newStartTime = new Date(input.newStartTime);
    const duration =
      input.durationMinutes ||
      Math.round((booking.scheduledEndTime.getTime() - booking.scheduledStartTime.getTime()) / (60 * 1000));
    const newEndTime = new Date(newStartTime.getTime() + duration * 60 * 1000);

    // Prevent past dates
    if (newStartTime.getTime() < Date.now() - 60 * 1000) {
      throw new Error('Rescheduled appointment time cannot be in the past.');
    }

    // Atomic Double Booking Check for provider
    const overlapping = dbStore.bookings.find((b) => {
      if (b.id === booking.id) return false; // Exclude self
      if (b.providerProfileId !== booking.providerProfileId) return false;
      if (
        b.bookingStatus === BookingStatus.CANCELLED_BY_CITIZEN ||
        b.bookingStatus === BookingStatus.CANCELLED_BY_PROVIDER
      ) {
        return false;
      }
      return newStartTime < b.scheduledEndTime && newEndTime > b.scheduledStartTime;
    });

    if (overlapping) {
      throw new Error('The selected calendar slot is already reserved. Please select another time.');
    }

    const now = new Date();
    booking.scheduledStartTime = newStartTime;
    booking.scheduledEndTime = newEndTime;
    booking.updatedAt = now;

    // Dispatch Reschedule Notifications with IST formatting
    const istTimeStr = this.formatIST(newStartTime);
    dbStore.notifications.push({
      id: uuidv4(),
      userId: booking.citizenId,
      title: 'Consultation Rescheduled',
      message: `Your consultation (${booking.bookingReference}) has been rescheduled to ${istTimeStr}.`,
      type: 'BOOKING',
      isRead: false,
      createdAt: now,
    });

    if (providerProfile) {
      dbStore.notifications.push({
        id: uuidv4(),
        userId: providerProfile.userId,
        title: 'Consultation Rescheduled',
        message: `Consultation (${booking.bookingReference}) has been moved to ${istTimeStr}.`,
        type: 'BOOKING',
        isRead: false,
        createdAt: now,
      });

      await notificationsService.triggerBookingNotification(
        booking.citizenId,
        providerProfile.userId,
        booking.bookingReference,
        'RESCHEDULED',
        istTimeStr
      );
    }

    return {
      message: 'Booking rescheduled successfully.',
      booking,
      scheduledStartTimeIST: istTimeStr,
    };
  }

  public async getVideoRoomToken(bookingId: string, currentUserId: string) {
    const booking = dbStore.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const providerProfile = dbStore.providerProfiles.find((p) => p.id === booking.providerProfileId);
    const isCitizen = booking.citizenId === currentUserId;
    const isProvider = providerProfile?.userId === currentUserId;

    if (!isCitizen && !isProvider) {
      throw new Error('Unauthorized - Access denied: Only authorized consultation participants can join the video room.');
    }

    if (
      booking.bookingStatus === BookingStatus.CANCELLED_BY_CITIZEN ||
      booking.bookingStatus === BookingStatus.CANCELLED_BY_PROVIDER
    ) {
      throw new Error('Cannot access video room for a cancelled booking.');
    }

    if (booking.bookingStatus === BookingStatus.PENDING_PAYMENT) {
      throw new Error('Video room link is only available for confirmed and paid consultations.');
    }

    const roleName = isCitizen ? 'CITIZEN' : 'PROVIDER';
    const roomName = `nyayasetu-consultation-${booking.bookingReference}`;
    const token = SecurityUtils.generateAccessToken({
      userId: currentUserId,
      roles: [isCitizen ? RoleType.CITIZEN : RoleType.LSP],
      phone: '',
      fullName: isCitizen ? 'Citizen' : 'Advocate',
    });

    return {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      deliveryMode: booking.deliveryMode,
      roomName,
      participantRole: roleName,
      videoRoomUrl: `https://meet.nyayasetu.gov.in/room/${roomName}?sessionToken=${token}`,
      scheduledStartTime: booking.scheduledStartTime,
      scheduledStartTimeIST: this.formatIST(booking.scheduledStartTime),
    };
  }

  public formatIST(date: Date): string {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(date.getTime() + istOffset);
    return istTime.toISOString().replace('Z', '+05:30 (IST)');
  }
}

