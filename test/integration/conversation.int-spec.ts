import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from 'src/conversation/conversation.service';
import { ConversationRepository } from 'src/conversation/conversation.repository';
import { IConversationRepository } from 'src/conversation/interfaces/conversation-repository.interface';
import { PrismaService } from 'src/database/prisma.service';
import { UserRepository } from 'src/user/user.repository';
import { IUserRepository } from 'src/user/interfaces/user-repository.interface';
import { createTestMessage, createTestUser } from './utils/factories';

describe('ConversationService (integration)', () => {
  let moduleRef: TestingModule;
  let service: ConversationService;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        ConversationService,
        ConversationRepository,
        UserRepository,
        {
          provide: IConversationRepository,
          useClass: ConversationRepository,
        },
        {
          provide: IUserRepository,
          useClass: UserRepository,
        },
      ],
    }).compile();

    service = moduleRef.get<ConversationService>(ConversationService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('starts a conversation or returns an existing one', async () => {
    const alice = await createTestUser({
      email: 'alice@example.com',
      username: 'alice_user',
    });
    const bob = await createTestUser({
      email: 'bob@example.com',
      username: 'bob_user',
    });

    const firstConversation = await service.startOrGetConversation(
      alice.id,
      bob.id,
    );

    expect(firstConversation.participants).toHaveLength(2);
    expect(firstConversation.participants.map((p) => p.id)).toEqual(
      expect.arrayContaining([alice.id, bob.id]),
    );

    const secondConversation = await service.startOrGetConversation(
      alice.id,
      bob.id,
    );

    expect(secondConversation.id).toBe(firstConversation.id);
  });

  it('sends and retrieves messages with trimmed content', async () => {
    const alice = await createTestUser({
      email: 'alice2@example.com',
      username: 'alice_two',
    });
    const bob = await createTestUser({
      email: 'bob2@example.com',
      username: 'bob_two',
    });

    const conversation = await service.startOrGetConversation(alice.id, bob.id);

    const message = await service.sendMessage(
      alice.id,
      conversation.id,
      '   Hello Bob!   ',
    );

    expect(message.content).toBe('Hello Bob!');
    expect(message.author.id).toBe(alice.id);

    const messages = await service.getMessagesForConversation(
      alice.id,
      conversation.id,
    );

    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Hello Bob!');

    const stored = await prisma.message.findUnique({
      where: { id: message.id },
    });
    expect(stored?.content).toBe('Hello Bob!');
  });

  it('lists conversations with the latest message summary', async () => {
    const alice = await createTestUser({
      email: 'alice3@example.com',
      username: 'alice_three',
    });
    const bob = await createTestUser({
      email: 'bob3@example.com',
      username: 'bob_three',
    });

    const conversation = await service.startOrGetConversation(alice.id, bob.id);

    await createTestMessage({
      conversationId: conversation.id,
      authorId: alice.id,
      content: 'Most recent',
    });

    const summaries = await service.getConversationsForUser(alice.id);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].id).toBe(conversation.id);
    expect(summaries[0].lastMessage?.content).toBe('Most recent');
    expect(summaries[0].participant.id).toBe(bob.id);
  });
});
