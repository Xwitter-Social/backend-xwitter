import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

function ensureTestDatabaseIsolation(): void {
  const url = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;

  if (!url) {
    throw new Error(
      'DATABASE_URL não definido durante os testes de integração. Configure TEST_DATABASE_URL para um banco ou schema dedicado.',
    );
  }

  const normalizedUrl = url.toLowerCase();
  const isIsolatedSchema = normalizedUrl.includes('schema=test');
  const isIsolatedDatabase = normalizedUrl.includes('_test');

  if (!isIsolatedSchema && !isIsolatedDatabase) {
    throw new Error(
      'Os testes de integração exigem um banco ou schema dedicado. Ajuste TEST_DATABASE_URL para incluir `schema=test` ou utilizar um database com sufixo `_test`.',
    );
  }
}

export async function clearDatabase(): Promise<void> {
  ensureTestDatabaseIsolation();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.repost.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
}
