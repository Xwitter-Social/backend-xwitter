import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationParticipantDto } from './conversation-participant.dto';
import { ConversationMessageDto } from './conversation-message.dto';

export class ConversationSummaryDto {
  @ApiProperty({
    description: 'Identificador da conversa',
    example: 'conversation-123',
  })
  id: string;

  @ApiProperty({
    description: 'Data e hora da última atualização da conversa',
    format: 'date-time',
    example: '2025-05-10T18:45:30.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Participante com quem o usuário atual conversa',
    type: ConversationParticipantDto,
  })
  participant: ConversationParticipantDto;

  @ApiPropertyOptional({
    description: 'Última mensagem trocada na conversa',
    type: ConversationMessageDto,
    nullable: true,
  })
  lastMessage?: ConversationMessageDto | null;
}
