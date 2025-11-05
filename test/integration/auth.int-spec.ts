import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/database/prisma.service';
import { IUserRepository } from 'src/user/interfaces/user-repository.interface';
import { UserRepository } from 'src/user/user.repository';
import { createTestUser, getDefaultUserPassword } from './utils/factories';

describe('AuthService (integration)', () => {
  let moduleRef: TestingModule;
  let service: AuthService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: process.env.JWT_SECRET ?? 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        PrismaService,
        AuthService,
        UserRepository,
        {
          provide: IUserRepository,
          useClass: UserRepository,
        },
      ],
    }).compile();

    service = moduleRef.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('returns an access token when credentials are valid', async () => {
    const createdUser = await createTestUser();

    const result = await service.signIn({
      identifier: createdUser.email,
      password: getDefaultUserPassword(),
    });

    expect(result.accessToken).toBeDefined();
    expect(typeof result.accessToken).toBe('string');
    expect(result.accessToken.length).toBeGreaterThan(10);
  });

  it('rejects invalid password attempts', async () => {
    const createdUser = await createTestUser();

    await expect(
      service.signIn({
        identifier: createdUser.username,
        password: 'invalid-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
