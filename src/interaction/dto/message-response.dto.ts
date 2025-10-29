import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Mensagem de confirmação da operação',
    example: 'Operação realizada com sucesso.',
  })
  message: string;
}
