import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { IConversationRepository } from './interfaces/conversation-repository.interface';
import { IUserRepository } from '../user/interfaces/user-repository.interface';
import { MockConversationRepository } from './mocks/mock-conversation-repository';
import { MockUserRepository } from '../user/mocks/mock-user-repository';

const buildParticipant = (id: string) => ({
  id,
  username: `${id}-username`,
  name: `${id}-name`,
});

describe('ConversationService', () => {
  let service: ConversationService;
  let conversationRepository: MockConversationRepository;
  let userRepository: MockUserRepository;

  beforeEach(async () => {
    conversationRepository = new MockConversationRepository();
    userRepository = new MockUserRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        {
          provide: IConversationRepository,
          useValue: conversationRepository,
        },
        {
          provide: IUserRepository,
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
  });

  afterEach(() => {
    conversationRepository.clear();
    userRepository.clear();
  });

  describe('startOrGetConversation', () => {
    test.each([
      {
        description:
          'should create a new conversation when none exists between participants',
        execute: async () => {
          const currentUser = buildParticipant('user-1');
          const otherUser = buildParticipant('user-2');

          userRepository.seed([
            {
              id: currentUser.id,
              username: currentUser.username,
              name: currentUser.name,
              email: 'user1@example.com',
              password: 'hashed',
            },
            {
              id: otherUser.id,
              username: otherUser.username,
              name: otherUser.name,
              email: 'user2@example.com',
              password: 'hashed',
            },
          ]);

          conversationRepository.seedParticipants([currentUser, otherUser]);

          const result = await service.startOrGetConversation(
            currentUser.id,
            otherUser.id,
          );

          const participantIds = result.participants.map(
            (participant) => participant.id,
          );
          expect(participantIds).toEqual(
            expect.arrayContaining([currentUser.id, otherUser.id]),
          );

          const storedConversations =
            await conversationRepository.listConversationsByUser(
              currentUser.id,
            );

          expect(storedConversations).toHaveLength(1);
          expect(
            storedConversations[0].participants.map(
              (participant) => participant.id,
            ),
          ).toEqual(expect.arrayContaining([currentUser.id, otherUser.id]));
        },
      },
      {
        description:
          'should reuse existing conversation between two participants',
        execute: async () => {
          const currentUser = buildParticipant('user-1');
          const otherUser = buildParticipant('user-2');

          userRepository.seed([
            {
              id: currentUser.id,
              username: currentUser.username,
              name: currentUser.name,
              email: 'user1@example.com',
              password: 'hashed',
            },
            {
              id: otherUser.id,
              username: otherUser.username,
              name: otherUser.name,
              email: 'user2@example.com',
              password: 'hashed',
            },
          ]);

          conversationRepository.seedParticipants([currentUser, otherUser]);
          conversationRepository.seedConversations([
            {
              id: 'conversation-1',
              participants: [currentUser, otherUser],
            },
          ]);

          const result = await service.startOrGetConversation(
            currentUser.id,
            otherUser.id,
          );

          expect(result.id).toBe('conversation-1');
          const conversations =
            await conversationRepository.listConversationsByUser(
              currentUser.id,
            );
          expect(conversations).toHaveLength(1);
        },
      },
    ])('$description', async ({ execute }) => {
      await execute();
    });

    test.each([
      {
        description: 'should reject when trying to converse with oneself',
        currentUserId: 'same-user',
        recipientId: 'same-user',
        expectedError: BadRequestException,
      },
      {
        description: 'should reject when recipient user does not exist',
        currentUserId: 'user-existing',
        recipientId: 'missing-user',
        expectedError: NotFoundException,
      },
    ])(
      '$description',
      async ({ currentUserId, recipientId, expectedError }) => {
        const users = [
          {
            id: currentUserId,
            username: `${currentUserId}-username`,
            name: `${currentUserId}-name`,
            email: `${currentUserId}@example.com`,
            password: 'hashed',
          },
        ];

        if (recipientId !== currentUserId) {
          users.push({
            id: `${currentUserId}-placeholder`,
            username: `${currentUserId}-placeholder-username`,
            name: `${currentUserId}-placeholder-name`,
            email: `${currentUserId}-placeholder@example.com`,
            password: 'hashed',
          });
        }

        userRepository.seed(users);

        await expect(
          service.startOrGetConversation(currentUserId, recipientId),
        ).rejects.toBeInstanceOf(expectedError);
      },
    );
  });

  describe('getConversationsForUser', () => {
    test.each([
      {
        description:
          'should map repository results to conversation summaries with last message',
        execute: async () => {
          const currentUser = buildParticipant('user-1');
          const otherUser = buildParticipant('user-2');

          conversationRepository.seedParticipants([currentUser, otherUser]);
          conversationRepository.seedConversations([
            {
              id: 'conversation-10',
              participants: [currentUser, otherUser],
              updatedAt: new Date('2025-01-01T12:05:00.000Z'),
            },
          ]);
          conversationRepository.seedMessages([
            {
              id: 'message-1',
              conversationId: 'conversation-10',
              authorId: otherUser.id,
              content: 'Olá!',
              createdAt: new Date('2025-01-01T12:05:00.000Z'),
            },
          ]);

          const result = await service.getConversationsForUser(currentUser.id);

          expect(result).toHaveLength(1);
          expect(result[0]).toMatchObject({
            id: 'conversation-10',
            participant: {
              id: otherUser.id,
              username: otherUser.username,
              name: otherUser.name,
            },
            lastMessage: {
              id: 'message-1',
              content: 'Olá!',
            },
          });
        },
      },
      {
        description:
          'should throw when repository returns conversation without another participant',
        execute: async () => {
          const currentUser = buildParticipant('user-1');

          conversationRepository.seedParticipants([currentUser]);
          conversationRepository.seedConversations([
            {
              id: 'conversation-20',
              participants: [currentUser],
            },
          ]);

          await expect(
            service.getConversationsForUser(currentUser.id),
          ).rejects.toBeInstanceOf(NotFoundException);
        },
      },
    ])('$description', async ({ execute }) => {
      await execute();
    });
  });

  describe('getMessagesForConversation', () => {
    test.each([
      {
        description:
          'should return messages when user participates in conversation',
        execute: async () => {
          const currentUser = buildParticipant('user-1');
          const otherUser = buildParticipant('user-2');

          conversationRepository.seedParticipants([currentUser, otherUser]);
          conversationRepository.seedConversations([
            {
              id: 'conversation-30',
              participants: [currentUser, otherUser],
            },
          ]);
          conversationRepository.seedMessages([
            {
              id: 'message-1',
              conversationId: 'conversation-30',
              authorId: currentUser.id,
              content: 'Mensagem inicial',
              createdAt: new Date('2025-01-01T12:00:00.000Z'),
            },
          ]);

          const result = await service.getMessagesForConversation(
            currentUser.id,
            'conversation-30',
          );

          expect(result).toHaveLength(1);
          expect(result[0]).toMatchObject({
            content: 'Mensagem inicial',
            authorId: currentUser.id,
          });
        },
      },
      {
        description: 'should throw NotFound when conversation does not exist',
        execute: async () => {
          await expect(
            service.getMessagesForConversation(
              'user-1',
              'missing-conversation',
            ),
          ).rejects.toBeInstanceOf(NotFoundException);
        },
      },
      {
        description: 'should throw Forbidden when user is not a participant',
        execute: async () => {
          const userA = buildParticipant('user-1');
          const userB = buildParticipant('user-2');

          conversationRepository.seedParticipants([userA, userB]);
          conversationRepository.seedConversations([
            {
              id: 'conversation-40',
              participants: [userA, userB],
            },
          ]);

          await expect(
            service.getMessagesForConversation('intruder', 'conversation-40'),
          ).rejects.toBeInstanceOf(ForbiddenException);
        },
      },
    ])('$description', async ({ execute }) => {
      await execute();
    });
  });

  describe('sendMessage', () => {
    const setupConversation = (): void => {
      const currentUser = buildParticipant('user-1');
      const otherUser = buildParticipant('user-2');

      conversationRepository.seedParticipants([currentUser, otherUser]);
      conversationRepository.seedConversations([
        {
          id: 'conversation-50',
          participants: [currentUser, otherUser],
        },
      ]);
    };

    test.each([
      {
        description: 'should create message trimming whitespace',
        execute: async () => {
          setupConversation();

          const result = await service.sendMessage(
            'user-1',
            'conversation-50',
            '   mensagem com espaços   ',
          );

          expect(result).toMatchObject({
            conversationId: 'conversation-50',
            content: 'mensagem com espaços',
            authorId: 'user-1',
          });

          const messages =
            await conversationRepository.getMessages('conversation-50');
          expect(messages).toHaveLength(1);
          expect(messages[0].content).toBe('mensagem com espaços');
        },
      },
    ])('$description', async ({ execute }) => {
      await execute();
    });

    test.each([
      {
        description: 'should reject when content is empty',
        content: '',
      },
      {
        description: 'should reject when content is only whitespace',
        content: '     ',
      },
      {
        description: 'should reject when content exceeds 1000 characters',
        content: 'a'.repeat(1001),
      },
    ])('$description', async ({ content }) => {
      setupConversation();

      await expect(
        service.sendMessage('user-1', 'conversation-50', content),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    test.each([
      {
        description: 'should throw NotFound when conversation does not exist',
        execute: async () => {
          await expect(
            service.sendMessage('user-1', 'missing-conversation', 'oi'),
          ).rejects.toBeInstanceOf(NotFoundException);
        },
      },
      {
        description: 'should throw Forbidden when user is not participant',
        execute: async () => {
          setupConversation();

          await expect(
            service.sendMessage('intruder', 'conversation-50', 'Mensagem'),
          ).rejects.toBeInstanceOf(ForbiddenException);
        },
      },
    ])('$description', async ({ execute }) => {
      await execute();
    });
  });
});
