import { ApiProperty } from '@nestjs/swagger';
import { ConversationParticipantDto } from './conversation-participant.dto';

export class ConversationMessageDto {
  @ApiProperty({
    description: 'Identificador da mensagem',
    example: 'message-123',
  })
  id: string;

  @ApiProperty({
    description: 'Conteúdo textual da mensagem',
    example: 'Tudo certo, vamos alinhar ainda hoje.',
  })
  content: string;

  @ApiProperty({
    description: 'Data e hora da criação da mensagem',
    format: 'date-time',
    example: '2025-05-10T18:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Autor da mensagem',
    type: ConversationParticipantDto,
  })
  author: ConversationParticipantDto;
}
