import { clearDatabase, prisma } from './utils/database';

export default async (): Promise<void> => {
  await clearDatabase();
  await prisma.$disconnect();
};
