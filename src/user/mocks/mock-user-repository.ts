import { Prisma, User } from '@prisma/client';
import { IUserRepository } from '../interfaces/user-repository.interface';

export class MockUserRepository implements IUserRepository {
  private users: User[] = [];
  private nextId = 1;

  create(data: Prisma.UserCreateInput): Promise<User> {
    const user: User = {
      id: this.nextId.toString(),
      email: data.email,
      username: data.username,
      password: data.password,
      name: data.name,
      bio: data.bio || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.nextId++;
    this.users.push(user);
    return Promise.resolve(user);
  }

  findUnique(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    const user = this.users.find((u) => {
      if (where.id) return u.id === where.id;
      if (where.email) return u.email === where.email;
      if (where.username) return u.username === where.username;
      return false;
    });

    return Promise.resolve(user || null);
  }

  update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    const userIndex = this.users.findIndex((u) => {
      if (where.id) return u.id === where.id;
      if (where.email) return u.email === where.email;
      if (where.username) return u.username === where.username;
      return false;
    });

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );

    const updatedUser = {
      ...this.users[userIndex],
      ...cleanData,
      updatedAt: new Date(),
    } as User;

    this.users[userIndex] = updatedUser;
    return Promise.resolve(updatedUser);
  }

  delete(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const userIndex = this.users.findIndex((u) => {
      if (where.id) return u.id === where.id;
      if (where.email) return u.email === where.email;
      if (where.username) return u.username === where.username;
      return false;
    });

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const deletedUser = this.users[userIndex];
    this.users.splice(userIndex, 1);
    return Promise.resolve(deletedUser);
  }

  searchUsers(query: string): Promise<User[]> {
    const result = this.users.filter(
      (user) =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.name.toLowerCase().includes(query.toLowerCase()),
    );

    return Promise.resolve(result.slice(0, 50));
  }

  // Métodos auxiliares para testes
  clear(): void {
    this.users = [];
    this.nextId = 1;
  }

  seed(users: Partial<User>[]): void {
    this.clear();
    users.forEach((userData, index) => {
      const user: User = {
        id: userData.id || (index + 1).toString(),
        email: userData.email || `user${index + 1}@test.com`,
        username: userData.username || `user${index + 1}`,
        password: userData.password || 'hashedPassword123',
        name: userData.name || `User ${index + 1}`,
        bio: userData.bio || null,
        createdAt: userData.createdAt || new Date(),
        updatedAt: userData.updatedAt || new Date(),
      };
      this.users.push(user);
    });
    this.nextId = this.users.length + 1;
  }

  getAll(): User[] {
    return [...this.users];
  }
}
