import { ApiProperty } from '@nestjs/swagger';

export class ConversationParticipantDto {
  @ApiProperty({
    description: 'Identificador do participante',
    example: 'user-123',
  })
  id: string;

  @ApiProperty({
    description: 'Username do participante',
    example: 'maria.dev',
  })
  username: string;

  @ApiProperty({
    description: 'Nome exibido do participante',
    example: 'Maria Oliveira',
  })
  name: string;
}
