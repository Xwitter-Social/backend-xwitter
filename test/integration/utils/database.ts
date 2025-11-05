import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function clearDatabase(): Promise<void> {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.repost.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
}
