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
    // Testes parametrizados para criação bem-sucedida
    test.each([
      {
        description: 'should create user with all fields',
        userData: {
          email: 'complete@test.com',
          username: 'completeuser',
          password: 'password123',
          name: 'Complete User',
          bio: 'Complete bio',
        },
        expectedFields: ['email', 'username', 'name', 'bio'],
      },
      {
        description: 'should create user without optional bio',
        userData: {
          email: 'minimal@test.com',
          username: 'minimaluser',
          password: 'password123',
          name: 'Minimal User',
        },
        expectedFields: ['email', 'username', 'name'],
      },
      {
        description: 'should create user with minimum valid username length',
        userData: {
          email: 'min@test.com',
          username: 'abc', // 3 caracteres (mínimo)
          password: 'password123',
          name: 'Min User',
        },
        expectedFields: ['email', 'username', 'name'],
      },
      {
        description: 'should create user with maximum valid username length',
        userData: {
          email: 'max@test.com',
          username: 'a'.repeat(30), // 30 caracteres (máximo)
          password: 'password123',
          name: 'Max User',
        },
        expectedFields: ['email', 'username', 'name'],
      },
      {
        description: 'should create user with minimum valid password length',
        userData: {
          email: 'minpass@test.com',
          username: 'minpassuser',
          password: '12345678', // 8 caracteres (mínimo)
          name: 'Min Pass User',
        },
        expectedFields: ['email', 'username', 'name'],
      },
    ])('$description', async ({ userData, expectedFields }) => {
      mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);

      const result = await service.createUser(userData);

      expect(result).toBeDefined();
      expectedFields.forEach((field) => {
        expect(result[field]).toBe(userData[field]);
      });
      expect('password' in result).toBe(false);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
    });

    // Testes parametrizados para conflitos de dados únicos
    test.each([
      {
        description: 'should throw ConflictException for duplicate email',
        existingUser: {
          email: 'duplicate@test.com',
          username: 'existinguser1',
          password: 'hashedPassword',
          name: 'Existing User',
        },
        newUser: {
          email: 'duplicate@test.com', // Email duplicado
          username: 'newuser1',
          password: 'password123',
          name: 'New User',
        },
      },
      {
        description: 'should throw ConflictException for duplicate username',
        existingUser: {
          email: 'existing1@test.com',
          username: 'duplicateuser',
          password: 'hashedPassword',
          name: 'Existing User',
        },
        newUser: {
          email: 'new1@test.com',
          username: 'duplicateuser', // Username duplicado
          password: 'password123',
          name: 'New User',
        },
      },
      {
        description:
          'should throw ConflictException when both email and username are duplicated',
        existingUser: {
          email: 'both@test.com',
          username: 'bothuser',
          password: 'hashedPassword',
          name: 'Existing User',
        },
        newUser: {
          email: 'both@test.com', // Email e username duplicados
          username: 'bothuser',
          password: 'password123',
          name: 'New User',
        },
      },
    ])('$description', async ({ existingUser, newUser }) => {
      await mockUserRepository.create(existingUser);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);

      await expect(service.createUser(newUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getUserByIdentifier', () => {
    beforeEach(() => {
      mockUserRepository.seed([
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@test.com',
          username: 'testuser',
          name: 'Test User',
          bio: 'Test bio',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'another@test.com',
          username: 'anotheruser',
          name: 'Another User',
        },
      ]);
    });

    // Testes parametrizados para identificação bem-sucedida
    test.each([
      {
        description: 'should return user by valid email',
        identifier: 'test@test.com',
        expectedProperty: 'email',
        expectedValue: 'test@test.com',
        shouldIncludeBio: true,
      },
      {
        description: 'should return user by valid username',
        identifier: 'testuser',
        expectedProperty: 'username',
        expectedValue: 'testuser',
        shouldIncludeBio: true,
      },
      {
        description: 'should return user by valid UUID',
        identifier: '550e8400-e29b-41d4-a716-446655440000',
        expectedProperty: 'id',
        expectedValue: '550e8400-e29b-41d4-a716-446655440000',
        shouldIncludeBio: true,
      },
      {
        description: 'should return user without bio when bio is null',
        identifier: 'anotheruser',
        expectedProperty: 'username',
        expectedValue: 'anotheruser',
        shouldIncludeBio: false,
      },
      {
        description: 'should return user by case-sensitive email',
        identifier: 'test@test.com', // Email é case-sensitive
        expectedProperty: 'email',
        expectedValue: 'test@test.com',
        shouldIncludeBio: true,
      },
    ])(
      '$description',
      async ({
        identifier,
        expectedProperty,
        expectedValue,
        shouldIncludeBio,
      }) => {
        const result = await service.getUserByIdentifier(identifier);

        expect(result).toBeDefined();
        expect(result[expectedProperty]).toBe(expectedValue);

        if (shouldIncludeBio) {
          expect(result.bio).toBeDefined();
        }

        // Verificar se todos os campos obrigatórios estão presentes
        expect(result.id).toBeDefined();
        expect(result.email).toBeDefined();
        expect(result.username).toBeDefined();
        expect(result.name).toBeDefined();
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
        expect('password' in result).toBe(false);
      },
    );

    // Testes parametrizados para identificadores não encontrados
    test.each([
      {
        description: 'should throw NotFoundException for non-existent email',
        identifier: 'nonexistent@test.com',
        reason: 'email não existe no sistema',
      },
      {
        description: 'should throw NotFoundException for non-existent username',
        identifier: 'nonexistentuser',
        reason: 'username não existe no sistema',
      },
      {
        description: 'should throw NotFoundException for non-existent UUID',
        identifier: '550e8400-e29b-41d4-a716-446655440099',
        reason: 'UUID não existe no sistema',
      },
      {
        description: 'should throw NotFoundException for malformed email',
        identifier: 'invalid-email-format',
        reason: 'formato de email inválido é tratado como username',
      },
      {
        description: 'should throw NotFoundException for empty string',
        identifier: '',
        reason: 'string vazia',
      },
      {
        description: 'should throw NotFoundException for whitespace only',
        identifier: '   ',
        reason: 'apenas espaços em branco',
      },
    ])('$description', async ({ identifier }) => {
      await expect(service.getUserByIdentifier(identifier)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      mockUserRepository.seed([
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'original@test.com',
          username: 'originaluser',
          name: 'Original User',
          bio: 'Original bio',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'other@test.com',
          username: 'otheruser',
          name: 'Other User',
        },
      ]);
    });

    // Testes parametrizados para atualizações bem-sucedidas
    test.each([
      {
        description: 'should update only name',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        currentUserId: '550e8400-e29b-41d4-a716-446655440000',
        updateData: { name: 'Updated Name' },
        expectedChanges: { name: 'Updated Name' },
        unchangedFields: ['email', 'username', 'bio'],
      },
      {
        description: 'should update only email',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        currentUserId: '550e8400-e29b-41d4-a716-446655440000',
        updateData: { email: 'updated@test.com' },
        expectedChanges: { email: 'updated@test.com' },
        unchangedFields: ['name', 'username', 'bio'],
      },
      {
        description: 'should update only username',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        currentUserId: '550e8400-e29b-41d4-a716-446655440000',
        updateData: { username: 'updateduser' },
        expectedChanges: { username: 'updateduser' },
        unchangedFields: ['name', 'email', 'bio'],
      },
      {
        description: 'should update only bio',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        currentUserId: '550e8400-e29b-41d4-a716-446655440000',
        updateData: { bio: 'Updated bio' },
        expectedChanges: { bio: 'Updated bio' },
        unchangedFields: ['name', 'email', 'username'],
      },
      {
        description: 'should update multiple fields simultaneously',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        currentUserId: '550e8400-e29b-41d4-a716-446655440000',
        updateData: {
          name: 'New Name',
          email: 'newemail@test.com',
          bio: 'New bio',
        },
        expectedChanges: {
          name: 'New Name',
          email: 'newemail@test.com',
          bio: 'New bio',
        },
        unchangedFields: ['username'],
      },
      {
        description: 'should clear bio when set to empty string',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        currentUserId: '550e8400-e29b-41d4-a716-446655440000',
        updateData: { bio: '' },
        expectedChanges: { bio: '' },
        unchangedFields: ['name', 'email', 'username'],
      },
    ])(
      '$description',
      async ({
        userId,
        currentUserId,
        updateData,
        expectedChanges,
        unchangedFields,
      }) => {
        const originalUser = await service.getUserByIdentifier(userId);

        const result = await service.updateUser(
          userId,
          updateData,
          currentUserId,
        );

        expect(result).toBeDefined();
        expect(result.id).toBe(userId);

        // Verificar campos alterados
        Object.entries(expectedChanges).forEach(([field, expectedValue]) => {
          expect(result[field as keyof typeof result]).toBe(expectedValue);
        });

        // Verificar campos não alterados
        unchangedFields.forEach((field) => {
          const originalValue =
            originalUser[field as keyof typeof originalUser];
          if (originalValue !== undefined) {
            expect(result[field as keyof typeof result]).toBe(originalValue);
          }
        });

        // Verificar que updatedAt foi atualizado
        expect(result.updatedAt).toBeDefined();
      },
    );

    // Testes parametrizados para cenários de erro
    test.each([
      {
        description: 'should throw ForbiddenException for unauthorized update',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        currentUserId: '550e8400-e29b-41d4-a716-446655440001', // Usuário diferente
        updateData: { name: 'Unauthorized Update' },
        expectedError: ForbiddenException,
        errorReason: 'usuário não tem permissão para editar este perfil',
      },
      {
        description: 'should throw NotFoundException for non-existent user',
        userId: '550e8400-e29b-41d4-a716-446655440099', // ID inexistente
        currentUserId: '550e8400-e29b-41d4-a716-446655440099',
        updateData: { name: 'Non-existent User' },
        expectedError: NotFoundException,
        errorReason: 'usuário não existe',
      },
      {
        description:
          'should throw ForbiddenException when trying to update other user',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        currentUserId: '550e8400-e29b-41d4-a716-446655440000', // Tentando editar outro usuário
        updateData: { name: 'Hacker Attempt' },
        expectedError: ForbiddenException,
        errorReason: 'não é possível editar perfil de outro usuário',
      },
    ])(
      '$description',
      async ({ userId, currentUserId, updateData, expectedError }) => {
        await expect(
          service.updateUser(userId, updateData, currentUserId),
        ).rejects.toThrow(expectedError);
      },
    );
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      mockUserRepository.seed([
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'delete@test.com',
          username: 'deleteuser',
          name: 'Delete User',
          bio: 'User to be deleted',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'keep@test.com',
          username: 'keepuser',
          name: 'Keep User',
        },
      ]);
    });

    // Testes parametrizados para deleção bem-sucedida
    test.each([
      {
        description:
          'should delete user successfully and return deleted user data',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        currentUserId: '550e8400-e29b-41d4-a716-446655440000',
        initialUserCount: 2,
        finalUserCount: 1,
        shouldReturnUserData: true,
      },
      {
        description:
          'should delete user and maintain other users in the system',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        currentUserId: '550e8400-e29b-41d4-a716-446655440001',
        initialUserCount: 2,
        finalUserCount: 1,
        shouldReturnUserData: true,
      },
    ])(
      '$description',
      async ({
        userId,
        currentUserId,
        initialUserCount,
        finalUserCount,
        shouldReturnUserData,
      }) => {
        // Verificar estado inicial
        expect(mockUserRepository.getAll()).toHaveLength(initialUserCount);

        const result = await service.deleteUser(userId, currentUserId);

        if (shouldReturnUserData) {
          expect(result).toBeDefined();
          expect(result.id).toBe(userId);
          // Verificar se os dados do usuário deletado são retornados
          expect(result.email).toBeDefined();
          expect(result.username).toBeDefined();
          expect(result.name).toBeDefined();
        }

        // Verificar se o usuário foi removido do repositório
        expect(mockUserRepository.getAll()).toHaveLength(finalUserCount);

        // Verificar se o usuário específico não existe mais
        const remainingUsers = mockUserRepository.getAll();
        const deletedUserExists = remainingUsers.some(
          (user) => user.id === userId,
        );
        expect(deletedUserExists).toBe(false);
      },
    );

    // Testes parametrizados para cenários de erro
    test.each([
      {
        description:
          'should throw ForbiddenException for unauthorized deletion',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        currentUserId: '550e8400-e29b-41d4-a716-446655440001', // Usuário diferente
        expectedError: ForbiddenException,
        errorReason: 'usuário não tem permissão para deletar este perfil',
      },
      {
        description: 'should throw NotFoundException for non-existent user',
        userId: '550e8400-e29b-41d4-a716-446655440099', // ID inexistente
        currentUserId: '550e8400-e29b-41d4-a716-446655440099',
        expectedError: NotFoundException,
        errorReason: 'usuário não existe',
      },
      {
        description:
          'should throw ForbiddenException when trying to delete other user',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        currentUserId: '550e8400-e29b-41d4-a716-446655440000', // Tentando deletar outro usuário
        expectedError: ForbiddenException,
        errorReason: 'não é possível deletar perfil de outro usuário',
      },
    ])('$description', async ({ userId, currentUserId, expectedError }) => {
      const initialCount = mockUserRepository.getAll().length;

      await expect(service.deleteUser(userId, currentUserId)).rejects.toThrow(
        expectedError,
      );

      // Verificar que nenhum usuário foi removido em caso de erro
      expect(mockUserRepository.getAll()).toHaveLength(initialCount);
    });
  });

  describe('searchUsers', () => {
    beforeEach(() => {
      mockUserRepository.seed([
        {
          username: 'john_doe',
          name: 'John Doe',
          email: 'john@test.com',
          bio: 'Developer from NY',
        },
        {
          username: 'jane_smith',
          name: 'Jane Smith',
          email: 'jane@test.com',
          bio: 'Designer from LA',
        },
        {
          username: 'bob_jones',
          name: 'Bob Jones',
          email: 'bob@test.com',
        },
        {
          username: 'alice_johnson',
          name: 'Alice Johnson',
          email: 'alice@test.com',
          bio: 'Product Manager',
        },
      ]);
    });

    // Testes parametrizados para diferentes cenários de busca bem-sucedida
    test.each([
      {
        description: 'should return users matching by username (exact partial)',
        query: 'john',
        expectedLength: 2, // john_doe e alice_johnson
        expectedUsernames: ['john_doe', 'alice_johnson'],
        searchType: 'username partial match',
      },
      {
        description: 'should return users matching by name (case insensitive)',
        query: 'Jane',
        expectedLength: 1,
        expectedUsernames: ['jane_smith'],
        searchType: 'name match',
      },
      {
        description: 'should return users matching by name (lowercase)',
        query: 'alice',
        expectedLength: 1,
        expectedUsernames: ['alice_johnson'],
        searchType: 'name case insensitive',
      },
      {
        description: 'should return multiple users with common character',
        query: 'o', // Matches john_doe, bob_jones, alice_johnson
        expectedLength: 3,
        expectedUsernames: ['john_doe', 'bob_jones', 'alice_johnson'],
        searchType: 'multiple character match',
      },
      {
        description: 'should return users with exact username match',
        query: 'jane_smith',
        expectedLength: 1,
        expectedUsernames: ['jane_smith'],
        searchType: 'exact username',
      },
      {
        description: 'should return users with single character match',
        query: 'B',
        expectedLength: 1,
        expectedUsernames: ['bob_jones'],
        searchType: 'single character name match',
      },
    ])('$description', async ({ query, expectedLength, expectedUsernames }) => {
      const result = await service.searchUsers(query);

      expect(result).toHaveLength(expectedLength);

      // Verificar se todos os usuários esperados estão presentes
      expectedUsernames.forEach((expectedUsername) => {
        const foundUser = result.find(
          (user) => user.username === expectedUsername,
        );
        expect(foundUser).toBeDefined();
        expect(foundUser?.username).toBe(expectedUsername);
      });

      // Verificar estrutura dos resultados
      result.forEach((user) => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('updatedAt');
        expect(user).not.toHaveProperty('password');
      });
    });

    // Testes parametrizados para cenários sem resultados
    test.each([
      {
        description: 'should return empty array for no matches',
        query: 'nonexistent',
        reason: 'termo não existe em nenhum campo',
      },
      {
        description: 'should return empty array for empty string',
        query: '',
        reason: 'string vazia é filtrada',
      },
      {
        description: 'should return empty array for whitespace only',
        query: '   ',
        reason: 'apenas espaços são filtrados',
      },
      {
        description: 'should return empty array for special characters only',
        query: '@#$%',
        reason: 'caracteres especiais não encontrados',
      },
      {
        description: 'should return empty array for numbers only',
        query: '12345',
        reason: 'números não encontrados em nenhum campo',
      },
    ])('$description', async ({ query }) => {
      const result = await service.searchUsers(query);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(result.every((user) => !('password' in user))).toBe(true);
    });

    // Testes parametrizados para validação de entrada
    test.each([
      {
        description: 'should handle query with leading/trailing spaces',
        query: '  john  ',
        expectedLength: 2,
        shouldTrimQuery: true,
      },
      {
        description: 'should handle query with mixed case',
        query: 'JANE',
        expectedLength: 1,
        shouldBeCaseInsensitive: true,
      },
      {
        description: 'should handle very long query string',
        query: 'a'.repeat(100),
        expectedLength: 0,
        shouldHandleLongQuery: true,
      },
    ])('$description', async ({ query, expectedLength }) => {
      const result = await service.searchUsers(query);
      expect(result).toHaveLength(expectedLength);
      expect(result.every((user) => !('password' in user))).toBe(true);
    });
  });
});
