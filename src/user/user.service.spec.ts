import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { IUserRepository } from './interfaces/user-repository.interface';
import { MockUserRepository } from './mocks/mock-user-repository';
import * as bcrypt from 'bcrypt';

// Mock do bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock do UserRepository para evitar dependências do Prisma
jest.mock('./user.repository');

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: MockUserRepository;

  beforeEach(async () => {
    mockUserRepository = new MockUserRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: IUserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    mockUserRepository.clear();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const createUserDto = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
      };

      mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);

      const result = await service.createUser(createUserDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(result.username).toBe(createUserDto.username);
      expect(result.name).toBe(createUserDto.name);
      expect(result.password).toBe('hashedPassword123');
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
    });

    it('should throw ConflictException for duplicate email', async () => {
      const createUserDto = {
        email: 'existing@test.com',
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
      };

      // Simular usuário existente
      await mockUserRepository.create({
        ...createUserDto,
        password: 'hashedPassword',
      });

      mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getUserByIdentifier', () => {
    beforeEach(() => {
      mockUserRepository.seed([
        {
          id: '550e8400-e29b-41d4-a716-446655440000', // UUID válido
          email: 'test@test.com',
          username: 'testuser',
          name: 'Test User',
        },
      ]);
    });

    it('should return user by email', async () => {
      const result = await service.getUserByIdentifier('test@test.com');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@test.com');
    });

    it('should return user by username', async () => {
      const result = await service.getUserByIdentifier('testuser');

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
    });

    it('should return user by id', async () => {
      const result = await service.getUserByIdentifier(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(
        service.getUserByIdentifier('nonexistent@test.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      mockUserRepository.seed([
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@test.com',
          username: 'testuser',
          name: 'Test User',
        },
      ]);
    });

    it('should update user successfully', async () => {
      const updateUserDto = { name: 'Updated Name' };
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const currentUserId = '550e8400-e29b-41d4-a716-446655440000';

      const result = await service.updateUser(
        userId,
        updateUserDto,
        currentUserId,
      );

      expect(result.name).toBe('Updated Name');
      expect(result.id).toBe(userId);
    });

    it('should throw ForbiddenException for unauthorized update', async () => {
      const updateUserDto = { name: 'Updated Name' };
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const currentUserId = '550e8400-e29b-41d4-a716-446655440001';

      await expect(
        service.updateUser(userId, updateUserDto, currentUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      mockUserRepository.seed([
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@test.com',
          username: 'testuser',
          name: 'Test User',
        },
      ]);
    });

    it('should delete user successfully', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const currentUserId = '550e8400-e29b-41d4-a716-446655440000';

      const result = await service.deleteUser(userId, currentUserId);

      expect(result.id).toBe(userId);

      // Verificar se o usuário foi removido
      const users = mockUserRepository.getAll();
      expect(users).toHaveLength(0);
    });

    it('should throw ForbiddenException for unauthorized deletion', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const currentUserId = '550e8400-e29b-41d4-a716-446655440001';

      await expect(service.deleteUser(userId, currentUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('searchUsers', () => {
    beforeEach(() => {
      mockUserRepository.seed([
        { username: 'john_doe', name: 'John Doe' },
        { username: 'jane_smith', name: 'Jane Smith' },
        { username: 'bob_jones', name: 'Bob Jones' },
      ]);
    });

    it('should return filtered users by username', async () => {
      const result = await service.searchUsers('john');

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('john_doe');
    });

    it('should return filtered users by name', async () => {
      const result = await service.searchUsers('Jane');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Jane Smith');
    });

    it('should return empty array for no matches', async () => {
      const result = await service.searchUsers('nonexistent');

      expect(result).toEqual([]);
    });
  });
});
