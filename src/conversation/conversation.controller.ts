import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post as PostMethod,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  CurrentUser,
  type CurrentUserData,
} from '../auth/current-user.decorator';
import {
  ConversationDetailsDto,
  ConversationMessageDto,
  ConversationParticipantDto,
  ConversationSummaryDto,
  SendMessageDto,
  StartConversationDto,
} from './dto';
import {
  ApiStartConversation,
  ApiGetMyConversations,
  ApiGetConversationMessages,
  ApiSendConversationMessage,
} from '../common/decorators/swagger.decorators';
import type { ConversationParticipant } from './conversation.service';
import type { MessageWithAuthor } from './interfaces/conversation-repository.interface';

type MessageLike = {
  id: string;
  content: string;
  createdAt: Date;
  author: ConversationParticipant;
};

@ApiTags('conversation')
@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @UseGuards(AuthGuard)
  @PostMethod('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiStartConversation()
  async startConversation(
    @Body() startConversationDto: StartConversationDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<ConversationDetailsDto> {
    const conversation = await this.conversationService.startOrGetConversation(
      currentUser.sub,
      startConversationDto.recipientId,
    );

    return {
      id: conversation.id,
      participants: conversation.participants.map((participant) =>
        this.toParticipantDto(participant),
      ),
    };
  }

  @UseGuards(AuthGuard)
  @Get()
  @ApiGetMyConversations()
  async getMyConversations(
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<ConversationSummaryDto[]> {
    const conversations =
      await this.conversationService.getConversationsForUser(currentUser.sub);

    return conversations.map((conversation) => ({
      id: conversation.id,
      updatedAt: conversation.updatedAt,
      participant: this.toParticipantDto(conversation.participant),
      lastMessage: conversation.lastMessage
        ? this.toMessageDto(conversation.lastMessage)
        : null,
    }));
  }

  @UseGuards(AuthGuard)
  @Get(':conversationId/messages')
  @ApiGetConversationMessages()
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<ConversationMessageDto[]> {
    const messages = await this.conversationService.getMessagesForConversation(
      currentUser.sub,
      conversationId,
    );

    return messages.map((message) => this.toMessageDto(message));
  }

  @UseGuards(AuthGuard)
  @PostMethod(':conversationId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiSendConversationMessage()
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() sendMessageDto: SendMessageDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<ConversationMessageDto> {
    const message = await this.conversationService.sendMessage(
      currentUser.sub,
      conversationId,
      sendMessageDto.content,
    );

    return this.toMessageDto(message);
  }

  private toParticipantDto(
    participant: ConversationParticipant,
  ): ConversationParticipantDto {
    return {
      id: participant.id,
      username: participant.username,
      name: participant.name,
    };
  }

  private toMessageDto(
    message: MessageLike | MessageWithAuthor,
  ): ConversationMessageDto {
    return {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      author: this.toParticipantDto(message.author),
    };
  }
}
