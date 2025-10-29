import {
  ConversationWithLatestMessage,
  ConversationWithParticipants,
  IConversationRepository,
  MessageWithAuthor,
} from '../interfaces/conversation-repository.interface';

interface Participant {
  id: string;
  username: string;
  name: string;
}

interface StoredConversation {
  id: string;
  participants: Participant[];
  createdAt: Date;
  updatedAt: Date;
}

interface StoredMessage {
  id: string;
  conversationId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

const cloneParticipant = (participant: Participant): Participant => ({
  ...participant,
});

export class MockConversationRepository implements IConversationRepository {
  private conversations: StoredConversation[] = [];
  private messages: StoredMessage[] = [];
  private participantDirectory = new Map<string, Participant>();
  private conversationSequence = 1;
  private messageSequence = 1;

  findConversationBetweenParticipants(
    userId: string,
    otherUserId: string,
  ): Promise<ConversationWithParticipants | null> {
    const conversation = this.conversations.find((stored) =>
      this.hasParticipants(stored, [userId, otherUserId]),
    );

    if (!conversation) {
      return Promise.resolve(null);
    }

    return Promise.resolve(this.toConversationWithParticipants(conversation));
  }

  createConversation(
    userId: string,
    otherUserId: string,
  ): Promise<ConversationWithParticipants> {
    const now = this.buildDate();
    const conversation: StoredConversation = {
      id: `conversation-${this.conversationSequence++}`,
      participants: [
        this.resolveParticipant(userId),
        this.resolveParticipant(otherUserId),
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.conversations.push(conversation);

    return Promise.resolve(this.toConversationWithParticipants(conversation));
  }

  listConversationsByUser(
    userId: string,
  ): Promise<ConversationWithLatestMessage[]> {
    const conversations = this.conversations
      .filter((conversation) => this.isParticipant(conversation, userId))
      .map((conversation) => this.toConversationWithLatestMessage(conversation))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return Promise.resolve(conversations);
  }

  findConversationById(
    conversationId: string,
  ): Promise<ConversationWithParticipants | null> {
    const conversation = this.conversations.find(
      (stored) => stored.id === conversationId,
    );

    return Promise.resolve(
      conversation ? this.toConversationWithParticipants(conversation) : null,
    );
  }

  createMessage(
    conversationId: string,
    authorId: string,
    content: string,
  ): Promise<MessageWithAuthor> {
    const conversation = this.conversations.find(
      (stored) => stored.id === conversationId,
    );

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const message: StoredMessage = {
      id: `message-${this.messageSequence++}`,
      conversationId,
      authorId,
      content,
      createdAt: this.buildDate(),
    };

    this.messages.push(message);
    conversation.updatedAt = message.createdAt;

    return Promise.resolve(this.toMessageWithAuthor(message));
  }

  getMessages(conversationId: string): Promise<MessageWithAuthor[]> {
    const messages = this.messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((message) => this.toMessageWithAuthor(message));

    return Promise.resolve(messages);
  }

  seedParticipants(participants: Participant[]): void {
    this.participantDirectory.clear();
    participants.forEach((participant) => {
      this.participantDirectory.set(participant.id, { ...participant });
    });
  }

  seedConversations(
    conversations: Array<{
      id?: string;
      participants: Participant[];
      createdAt?: Date;
      updatedAt?: Date;
    }>,
  ): void {
    this.conversations = conversations.map((conversation, index) => ({
      id: conversation.id ?? `conversation-${index + 1}`,
      participants: conversation.participants.map((participant) =>
        cloneParticipant(participant),
      ),
      createdAt: conversation.createdAt ?? this.buildDate(index + 1),
      updatedAt: conversation.updatedAt ?? this.buildDate(index + 1),
    }));
    this.conversationSequence = this.conversations.length + 1;
  }

  seedMessages(
    messages: Array<{
      id?: string;
      conversationId: string;
      authorId: string;
      content: string;
      createdAt?: Date;
    }>,
  ): void {
    this.messages = messages.map((message, index) => ({
      id: message.id ?? `message-${index + 1}`,
      conversationId: message.conversationId,
      authorId: message.authorId,
      content: message.content,
      createdAt: message.createdAt ?? this.buildDate(index + 1),
    }));
    this.messageSequence = this.messages.length + 1;
  }

  clear(): void {
    this.conversations = [];
    this.messages = [];
    this.conversationSequence = 1;
    this.messageSequence = 1;
  }

  private hasParticipants(
    conversation: StoredConversation,
    participantIds: string[],
  ): boolean {
    const ids = conversation.participants.map((participant) => participant.id);
    return participantIds.every((id) => ids.includes(id)) && ids.length === 2;
  }

  private isParticipant(
    conversation: StoredConversation,
    userId: string,
  ): boolean {
    return conversation.participants.some(
      (participant) => participant.id === userId,
    );
  }

  private resolveParticipant(id: string): Participant {
    const existing = this.participantDirectory.get(id);

    if (existing) {
      return cloneParticipant(existing);
    }

    const participant: Participant = {
      id,
      username: `${id}-username`,
      name: `${id}-name`,
    };

    this.participantDirectory.set(id, participant);
    return cloneParticipant(participant);
  }

  private toConversationWithParticipants(
    conversation: StoredConversation,
  ): ConversationWithParticipants {
    return {
      id: conversation.id,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: conversation.participants.map((participant) =>
        cloneParticipant(participant),
      ),
    } as ConversationWithParticipants;
  }

  private toConversationWithLatestMessage(
    conversation: StoredConversation,
  ): ConversationWithLatestMessage {
    const latestMessage =
      this.messages
        .filter((message) => message.conversationId === conversation.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ??
      null;

    const messages = latestMessage
      ? [this.toMessageWithAuthor(latestMessage)]
      : [];

    return {
      id: conversation.id,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: conversation.participants.map((participant) =>
        cloneParticipant(participant),
      ),
      messages,
    } as ConversationWithLatestMessage;
  }

  private toMessageWithAuthor(message: StoredMessage): MessageWithAuthor {
    const author = this.resolveParticipant(message.authorId);

    return {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      author: cloneParticipant(author),
      conversationId: message.conversationId,
      authorId: message.authorId,
    } as MessageWithAuthor;
  }

  private buildDate(offsetSeconds = 0): Date {
    return new Date(2025, 0, 1, 12, 0, offsetSeconds);
  }
}
