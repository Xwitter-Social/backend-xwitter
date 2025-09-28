import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma, User as UserModel } from '@prisma/client';
import { IUserRepository } from './interfaces/user-repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<UserModel> {
    return this.prisma.user.create({ data });
  }

  async findUnique(
    where: Prisma.UserWhereUniqueInput,
  ): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where });
  }

  async update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<UserModel> {
    const { where, data } = params;
    return this.prisma.user.update({ where, data });
  }

  async delete(where: Prisma.UserWhereUniqueInput): Promise<UserModel> {
    return this.prisma.user.delete({ where });
  }

  async searchUsers(query: string): Promise<UserModel[]> {
    return this.prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: 50,
      orderBy: [
        {
          username: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }
}
