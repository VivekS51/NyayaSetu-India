import { v4 as uuidv4 } from 'uuid';
import { dbStore, MessageRecord } from '../../config/database';
import { SendMessageInput } from './chat.dto';

export class ChatService {
  public async getConversationHistory(bookingId: string, userId: string) {
    const booking = dbStore.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const providerProfile = dbStore.providerProfiles.find((p) => p.id === booking.providerProfileId);
    const isParticipant = booking.citizenId === userId || providerProfile?.userId === userId;

    if (!isParticipant) {
      throw new Error('Access denied: You are not authorized to view this confidential legal channel.');
    }

    let conversation = dbStore.conversations.find((c) => c.bookingId === booking.id);
    if (!conversation) {
      conversation = {
        id: uuidv4(),
        bookingId: booking.id,
        isActive: true,
        createdAt: new Date(),
      };
      dbStore.conversations.push(conversation);
    }

    const messages = dbStore.messages
      .filter((m) => m.conversationId === conversation!.id)
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());

    // Mark unread messages as read
    messages.forEach((m) => {
      if (m.senderUserId !== userId) {
        m.isRead = true;
      }
    });

    const citizenUser = dbStore.users.find((u) => u.id === booking.citizenId);
    const providerUser = providerProfile ? dbStore.users.find((u) => u.id === providerProfile.userId) : null;

    return {
      conversationId: conversation.id,
      bookingReference: booking.bookingReference,
      deliveryMode: booking.deliveryMode,
      bookingStatus: booking.bookingStatus,
      participants: {
        citizen: {
          id: citizenUser?.id,
          name: citizenUser?.fullName,
        },
        provider: {
          id: providerUser?.id,
          name: providerUser?.fullName,
          court: providerProfile?.primaryCourt,
        },
      },
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderUserId,
        isSystem: m.senderUserId === 'SYSTEM',
        content: m.content,
        attachmentUrl: m.attachmentUrl,
        attachmentName: m.attachmentName,
        isAadhaarSigned: m.isAadhaarSigned,
        sentAt: m.sentAt,
      })),
    };
  }

  public async postMessage(bookingId: string, senderUserId: string, input: SendMessageInput) {
    const booking = dbStore.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const providerProfile = dbStore.providerProfiles.find((p) => p.id === booking.providerProfileId);
    const isParticipant = booking.citizenId === senderUserId || providerProfile?.userId === senderUserId;

    if (!isParticipant) {
      throw new Error('Unauthorized: You cannot post messages to this consultation channel.');
    }

    let conversation = dbStore.conversations.find((c) => c.bookingId === booking.id);
    if (!conversation) {
      conversation = {
        id: uuidv4(),
        bookingId: booking.id,
        isActive: true,
        createdAt: new Date(),
      };
      dbStore.conversations.push(conversation);
    }

    const messageRecord: MessageRecord = {
      id: uuidv4(),
      conversationId: conversation.id,
      senderUserId,
      content: input.content,
      isRead: false,
      attachmentUrl: input.attachmentUrl || null,
      attachmentName: input.attachmentName || null,
      isAadhaarSigned: input.isAadhaarSigned || false,
      sentAt: new Date(),
    };

    dbStore.messages.push(messageRecord);

    return messageRecord;
  }
}

