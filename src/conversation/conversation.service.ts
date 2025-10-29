import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IConversationRepository } from './interfaces/conversation-repository.interface';
import { IUserRepository } from '../user/interfaces/user-repository.interface';
import { MessageWithAuthor } from './interfaces/conversation-repository.interface';

export interface ConversationParticipant {
  id: string;
  username: string;
  name: string;
}

export interface ConversationSummary {
  id: string;
  updatedAt: Date;
  participant: ConversationParticipant;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: Date;
    author: ConversationParticipant;
  } | null;
}

export interface ConversationDetails {
  id: string;
  participants: ConversationParticipant[];
}

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async startOrGetConversation(
    currentUserId: string,
    recipientId: string,
  ): Promise<ConversationDetails> {
    if (currentUserId === recipientId) {
      throw new BadRequestException(
        'Você não pode iniciar uma conversa consigo mesmo.',
      );
    }

    await this.ensureUserExists(recipientId);

    const existing =
      await this.conversationRepository.findConversationBetweenParticipants(
        currentUserId,
        recipientId,
      );

    const conversation =
      existing ??
      (await this.conversationRepository.createConversation(
        currentUserId,
        recipientId,
      ));

    return {
      id: conversation.id,
      participants: conversation.participants.map((participant) => ({
        id: participant.id,
        username: participant.username,
        name: participant.name,
      })),
    };
  }

  async getConversationsForUser(
    currentUserId: string,
  ): Promise<ConversationSummary[]> {
    const conversations =
      await this.conversationRepository.listConversationsByUser(currentUserId);

    return conversations.map((conversation) => {
      const otherParticipant = conversation.participants.find(
        (participant) => participant.id !== currentUserId,
      );

      if (!otherParticipant) {
        throw new NotFoundException(
          'Conversa inválida: participante não encontrado.',
        );
      }

      const lastMessage = conversation.messages.at(0) ?? null;

      return {
        id: conversation.id,
        updatedAt: conversation.updatedAt,
        participant: {
          id: otherParticipant.id,
          username: otherParticipant.username,
          name: otherParticipant.name,
        },
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              author: {
                id: lastMessage.author.id,
                username: lastMessage.author.username,
                name: lastMessage.author.name,
              },
            }
          : null,
      };
    });
  }

  async getMessagesForConversation(
    currentUserId: string,
    conversationId: string,
  ): Promise<MessageWithAuthor[]> {
    const conversation = await this.ensureUserInConversation(
      currentUserId,
      conversationId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    return this.conversationRepository.getMessages(conversationId);
  }

  async sendMessage(
    currentUserId: string,
    conversationId: string,
    content: string,
  ): Promise<MessageWithAuthor> {
    const conversation = await this.ensureUserInConversation(
      currentUserId,
      conversationId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new BadRequestException('Mensagem não pode ser vazia.');
    }

    if (trimmedContent.length > 1000) {
      throw new BadRequestException(
        'Mensagem deve ter no máximo 1000 caracteres.',
      );
    }

    return this.conversationRepository.createMessage(
      conversationId,
      currentUserId,
      trimmedContent,
    );
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.userRepository.findUnique({ id: userId });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
  }

  private async ensureUserInConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationDetails | null> {
    const conversation =
      await this.conversationRepository.findConversationById(conversationId);

    if (!conversation) {
      return null;
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.id === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('Você não possui acesso a esta conversa.');
    }

    return {
      id: conversation.id,
      participants: conversation.participants.map((participant) => ({
        id: participant.id,
        username: participant.username,
        name: participant.name,
      })),
    };
  }
}
