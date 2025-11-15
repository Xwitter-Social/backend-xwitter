import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma } from './database';

const DEFAULT_PASSWORD = 'Password123!';

export async function createTestUser(
  overrides: Partial<Prisma.UserCreateInput> & { password?: string } = {},
) {
  const plainPassword = overrides.password ?? DEFAULT_PASSWORD;

  const data: Prisma.UserCreateInput = {
    email: overrides.email ?? `user-${randomUUID()}@example.com`,
    username: overrides.username ?? `user_${randomUUID().slice(0, 8)}`,
    name: overrides.name ?? 'Test User',
    bio: overrides.bio,
    password: await bcrypt.hash(plainPassword, 10),
  };

  return prisma.user.create({ data });
}

export async function createTestPost(params: {
  authorId: string;
  content?: string;
}) {
  return prisma.post.create({
    data: {
      authorId: params.authorId,
      content: params.content ?? 'Hello world! 🐦',
    },
  });
}

export async function createTestFollow(params: {
  followerId: string;
  followingId: string;
}) {
  return prisma.follow.create({
    data: {
      followerId: params.followerId,
      followingId: params.followingId,
    },
  });
}

export async function createTestLike(params: {
  userId: string;
  postId: string;
  createdAt?: Date;
}) {
  return prisma.like.create({
    data: {
      userId: params.userId,
      postId: params.postId,
      createdAt: params.createdAt,
    },
  });
}

export async function createTestConversation(params: {
  participantIds: [string, string];
}) {
  const [firstParticipantId, secondParticipantId] = params.participantIds;

  return prisma.conversation.create({
    data: {
      participants: {
        connect: [{ id: firstParticipantId }, { id: secondParticipantId }],
      },
    },
  });
}

export async function createTestMessage(params: {
  conversationId: string;
  authorId: string;
  content?: string;
}) {
  return prisma.message.create({
    data: {
      conversationId: params.conversationId,
      authorId: params.authorId,
      content: params.content ?? 'Hey there!',
    },
  });
}

export function getDefaultUserPassword(): string {
  return DEFAULT_PASSWORD;
}
