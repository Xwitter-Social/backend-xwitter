import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Conteúdo textual da mensagem',
    example: 'Olá! Podemos conversar sobre o lançamento?',
    maxLength: 1000,
  })
  @IsString({ message: 'content deve ser uma string' })
  @IsNotEmpty({ message: 'content não pode ser vazio' })
  @MaxLength(1000, {
    message: 'content deve ter no máximo 1000 caracteres',
  })
  content: string;
}
