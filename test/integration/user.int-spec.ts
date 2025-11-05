import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/database/prisma.service';
import { UserRepository } from 'src/user/user.repository';
import { IUserRepository } from 'src/user/interfaces/user-repository.interface';
import { CreateUserDto } from 'src/user/dto';
import { createTestUser } from './utils/factories';

describe('UserService (integration)', () => {
  let moduleRef: TestingModule;
  let service: UserService;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        UserService,
        UserRepository,
        {
          provide: IUserRepository,
          useClass: UserRepository,
        },
      ],
    }).compile();

    service = moduleRef.get<UserService>(UserService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('creates a user with encrypted password and sanitized response', async () => {
    const dto: CreateUserDto = {
      email: 'new-user@example.com',
      username: 'new_user123',
      password: 'StrongPass123!',
      name: 'Integration User',
      bio: 'Ready to tweet',
    };

    const created = await service.createUser(dto);

    expect('password' in created).toBe(false);
    expect(created.email).toBe(dto.email);
    expect(created.username).toBe(dto.username);

    const stored = await prisma.user.findUnique({ where: { id: created.id } });
    expect(stored).toBeTruthy();
    expect(stored?.password).not.toBe(dto.password);
    expect(stored?.password?.length).toBeGreaterThan(20);
  });

  it('searches users by partial username ignoring case', async () => {
    await createTestUser({ username: 'amazing_dev', email: 'dev@example.com' });
    await createTestUser({ username: 'otheruser', email: 'other@example.com' });

    const results = await service.searchUsers('Amazing');

    expect(results).toHaveLength(1);
    expect(results[0].username).toBe('amazing_dev');
    expect(results[0]).not.toHaveProperty('password');
  });
});
