import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class StartConversationDto {
  @ApiProperty({
    description: 'Identificador do usuário que receberá a conversa',
    example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
  })
  @IsUUID('4', { message: 'recipientId deve ser um UUID válido' })
  recipientId: string;
}
