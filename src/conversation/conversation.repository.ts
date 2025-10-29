import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  ConversationWithLatestMessage,
  ConversationWithParticipants,
  IConversationRepository,
  MessageWithAuthor,
} from './interfaces/conversation-repository.interface';

const participantSelect = {
  id: true,
  username: true,
  name: true,
} as const;

@Injectable()
export class ConversationRepository implements IConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findConversationBetweenParticipants(
    userId: string,
    otherUserId: string,
  ): Promise<ConversationWithParticipants | null> {
    return this.prisma.conversation.findFirst({
      where: {
        participants: {
          some: { id: userId },
        },
        AND: [
          {
            participants: {
              some: { id: otherUserId },
            },
          },
          {
            participants: {
              every: {
                id: {
                  in: [userId, otherUserId],
                },
              },
            },
          },
        ],
      },
      include: {
        participants: {
          select: participantSelect,
        },
      },
    });
  }

  createConversation(
    userId: string,
    otherUserId: string,
  ): Promise<ConversationWithParticipants> {
    return this.prisma.conversation.create({
      data: {
        participants: {
          connect: [{ id: userId }, { id: otherUserId }],
        },
      },
      include: {
        participants: {
          select: participantSelect,
        },
      },
    });
  }

  listConversationsByUser(
    userId: string,
  ): Promise<ConversationWithLatestMessage[]> {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: userId },
        },
      },
      include: {
        participants: {
          select: participantSelect,
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            author: {
              select: participantSelect,
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  findConversationById(
    conversationId: string,
  ): Promise<ConversationWithParticipants | null> {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: participantSelect,
        },
      },
    });
  }

  async createMessage(
    conversationId: string,
    authorId: string,
    content: string,
  ): Promise<MessageWithAuthor> {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          authorId,
          content,
        },
        include: {
          author: {
            select: participantSelect,
          },
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
        },
      });

      return message;
    });
  }

  getMessages(conversationId: string): Promise<MessageWithAuthor[]> {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        author: {
          select: participantSelect,
        },
      },
    });
  }
}
