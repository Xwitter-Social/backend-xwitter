import { Prisma, User } from '@prisma/client';

export abstract class IUserRepository {
  abstract create(data: Prisma.UserCreateInput): Promise<User>;
  abstract findUnique(where: Prisma.UserWhereUniqueInput): Promise<User | null>;
  abstract update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User>;
  abstract delete(where: Prisma.UserWhereUniqueInput): Promise<User>;
  abstract searchUsers(query: string): Promise<User[]>;
  abstract findFollowers(userId: string): Promise<User[]>;
  abstract findFollowing(userId: string): Promise<User[]>;
}
