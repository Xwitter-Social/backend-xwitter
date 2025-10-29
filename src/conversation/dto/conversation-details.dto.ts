import { ApiProperty } from '@nestjs/swagger';
import { ConversationParticipantDto } from './conversation-participant.dto';

export class ConversationDetailsDto {
  @ApiProperty({
    description: 'Identificador da conversa',
    example: 'conversation-123',
  })
  id: string;

  @ApiProperty({
    description: 'Participantes que compõem a conversa',
    type: ConversationParticipantDto,
    isArray: true,
  })
  participants: ConversationParticipantDto[];
}
