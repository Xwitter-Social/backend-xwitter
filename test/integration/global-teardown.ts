import { prisma } from './utils/database';

export default async (): Promise<void> => {
  await prisma.$disconnect();
};
