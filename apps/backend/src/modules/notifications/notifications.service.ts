import { v4 as uuidv4 } from 'uuid';
import { dbStore, NotificationRecord, CommunicationLogRecord } from '../../config/database';
import { CreateNotificationInput } from './notifications.dto';

export class NotificationsService {
  /**
   * Fetch paginated notifications for an authenticated user
   */
  public async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    page: number = 1,
    limit: number = 20
  ) {
    let list = dbStore.notifications.filter((n) => n.userId === userId);

    if (unreadOnly) {
      list = list.filter((n) => !n.isRead);
    }

    // Sort descending by timestamp
    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = list.length;
    const unreadCount = dbStore.notifications.filter((n) => n.userId === userId && !n.isRead).length;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Mark a single notification as read
   */
  public async markAsRead(userId: string, notificationId: string): Promise<NotificationRecord> {
    const notification = dbStore.notifications.find((n) => n.id === notificationId && n.userId === userId);
    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    notification.isRead = true;
    return notification;
  }

  /**
   * Mark all notifications for a user as read
   */
  public async markAllAsRead(userId: string): Promise<{ markedCount: number }> {
    let count = 0;
    dbStore.notifications.forEach((n) => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        count++;
      }
    });

    return { markedCount: count };
  }

  /**
   * Dispatch system notification to a target user
   */
  public async createNotification(input: CreateNotificationInput): Promise<NotificationRecord> {
    const newRecord: NotificationRecord = {
      id: `notif-${uuidv4().substring(0, 8)}`,
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      metadata: input.metadata || {},
      isRead: false,
      createdAt: new Date(),
    };

    dbStore.notifications.push(newRecord);
    return newRecord;
  }

  /**
   * Dispatches a multi-channel alert (In-App, SMS, Email) to a user
   */
  public async dispatchMultiChannelNotification(params: {
    userId: string;
    title: string;
    message: string;
    type: 'VERIFICATION' | 'BOOKING' | 'ESCROW' | 'DISPUTE' | 'INCENTIVE' | 'SYSTEM';
    channels?: ('IN_APP' | 'SMS' | 'EMAIL')[];
    metadata?: Record<string, any>;
  }): Promise<{ inAppId?: string; logsDispatched: number }> {
    const channels = params.channels || ['IN_APP', 'SMS', 'EMAIL'];
    const user = dbStore.users.find((u) => u.id === params.userId);
    let inAppId: string | undefined;
    let logsDispatched = 0;
    const now = new Date();

    if (channels.includes('IN_APP')) {
      const inApp = await this.createNotification({
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        metadata: params.metadata,
      });
      inAppId = inApp.id;
      logsDispatched++;
    }

    if (channels.includes('SMS') && user?.phone) {
      dbStore.communicationLogs.push({
        id: `sms-${uuidv4().substring(0, 8)}`,
        userId: params.userId,
        channel: 'SMS',
        recipient: user.phone,
        template: params.type,
        content: `[NyayaSetu] ${params.title}: ${params.message}`,
        status: 'DELIVERED',
        sentAt: now,
      });
      logsDispatched++;
    }

    if (channels.includes('EMAIL') && user?.email) {
      dbStore.communicationLogs.push({
        id: `email-${uuidv4().substring(0, 8)}`,
        userId: params.userId,
        channel: 'EMAIL',
        recipient: user.email,
        template: params.type,
        subject: `NyayaSetu Alert: ${params.title}`,
        content: params.message,
        status: 'DELIVERED',
        sentAt: now,
      });
      logsDispatched++;
    }

    return { inAppId, logsDispatched };
  }

  /**
   * Trigger 1: User Signup & Welcome Alert
   */
  public async triggerSignupNotification(userId: string) {
    return this.dispatchMultiChannelNotification({
      userId,
      title: 'Welcome to NyayaSetu India',
      message: 'Your account has been registered successfully. Welcome bonus reward points have been credited to your wallet.',
      type: 'SYSTEM',
    });
  }

  /**
   * Trigger 2: Verification Status Change Alert
   */
  public async triggerVerificationNotification(userId: string, status: string, notes?: string) {
    return this.dispatchMultiChannelNotification({
      userId,
      title: `Credential Verification Status: ${status}`,
      message: `Your professional credential dossier has been updated to "${status}". ${notes ? `Notes: ${notes}` : ''}`,
      type: 'VERIFICATION',
      metadata: { status, notes },
    });
  }

  /**
   * Trigger 3: Booking Lifecycle Alert (Created, Rescheduled, Cancelled)
   */
  public async triggerBookingNotification(
    citizenId: string,
    providerUserId: string,
    bookingRef: string,
    event: 'CREATED' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED',
    timeInfo?: string
  ) {
    const titles = {
      CREATED: 'Legal Consultation Booking Scheduled',
      CONFIRMED: 'Booking Confirmed by Legal Provider',
      RESCHEDULED: 'Booking Rescheduled to New Time Slot',
      CANCELLED: 'Legal Consultation Cancelled',
    };

    const timeDetail = timeInfo ? ` (Slot: ${timeInfo})` : '';
    const citizenMsg = `Your booking ${bookingRef} has been ${event.toLowerCase()}.${timeDetail} Please check your dashboard for details.`;
    const providerMsg = `Consultation booking ${bookingRef} has been ${event.toLowerCase()}.${timeDetail} Please review the schedule.`;

    await this.dispatchMultiChannelNotification({
      userId: citizenId,
      title: titles[event],
      message: citizenMsg,
      type: 'BOOKING',
      metadata: { bookingRef, event },
    });

    if (providerUserId && providerUserId !== citizenId) {
      await this.dispatchMultiChannelNotification({
        userId: providerUserId,
        title: titles[event],
        message: providerMsg,
        type: 'BOOKING',
        metadata: { bookingRef, event },
      });
    }
  }

  /**
   * Trigger 4: Payment & Escrow Transaction Alert
   */
  public async triggerPaymentNotification(
    userId: string,
    amount: number,
    bookingRef: string,
    event: 'ESCROW_HELD' | 'ESCROW_RELEASED' | 'REFUNDED'
  ) {
    const messages = {
      ESCROW_HELD: `Payment of ₹${amount} received and securely locked in sovereign escrow for booking ${bookingRef}.`,
      ESCROW_RELEASED: `Escrow funds of ₹${amount} have been released to your legal provider for completed booking ${bookingRef}.`,
      REFUNDED: `A full refund of ₹${amount} has been processed back to your payment method for booking ${bookingRef}.`,
    };

    return this.dispatchMultiChannelNotification({
      userId,
      title: `Payment Update for Booking ${bookingRef}`,
      message: messages[event],
      type: 'ESCROW',
      metadata: { amount, bookingRef, event },
    });
  }

  /**
   * Trigger 5: Incentive / Reward Earned Alert
   */
  public async triggerRewardNotification(
    userId: string,
    points: number,
    reason: string,
    newTier?: string
  ) {
    const message = newTier
      ? `Congratulations! You earned ${points} points for "${reason}" and advanced to ${newTier} Tier!`
      : `You have been credited ${points} reward points for "${reason}".`;

    return this.dispatchMultiChannelNotification({
      userId,
      title: 'NyayaSetu Reward Points Earned!',
      message,
      type: 'INCENTIVE',
      metadata: { points, reason, newTier },
    });
  }

  /**
   * Retrieve communication logs (SMS, Email) for auditing
   */
  public async getCommunicationLogs(userId: string): Promise<CommunicationLogRecord[]> {
    return dbStore.communicationLogs.filter((log) => log.userId === userId);
  }
}

export const notificationsService = new NotificationsService();
