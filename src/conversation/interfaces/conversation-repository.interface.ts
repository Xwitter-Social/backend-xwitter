import { Prisma } from '@prisma/client';

export type ConversationWithParticipants = Prisma.ConversationGetPayload<{
  include: {
    participants: {
      select: {
        id: true;
        username: true;
        name: true;
      };
    };
  };
}>;

export type MessageWithAuthor = Prisma.MessageGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        username: true;
        name: true;
      };
    };
  };
}>;

export type ConversationWithLatestMessage = Prisma.ConversationGetPayload<{
  include: {
    participants: {
      select: {
        id: true;
        username: true;
        name: true;
      };
    };
    messages: {
      include: {
        author: {
          select: {
            id: true;
            username: true;
            name: true;
          };
        };
      };
      orderBy: {
        createdAt: 'desc';
      };
      take: 1;
    };
  };
}>;

export abstract class IConversationRepository {
  abstract findConversationBetweenParticipants(
    userId: string,
    otherUserId: string,
  ): Promise<ConversationWithParticipants | null>;

  abstract createConversation(
    userId: string,
    otherUserId: string,
  ): Promise<ConversationWithParticipants>;

  abstract listConversationsByUser(
    userId: string,
  ): Promise<ConversationWithLatestMessage[]>;

  abstract findConversationById(
    conversationId: string,
  ): Promise<ConversationWithParticipants | null>;

  abstract createMessage(
    conversationId: string,
    authorId: string,
    content: string,
  ): Promise<MessageWithAuthor>;

  abstract getMessages(conversationId: string): Promise<MessageWithAuthor[]>;

  abstract deleteConversation(conversationId: string): Promise<void>;
}
