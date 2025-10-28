import { ApiProperty } from '@nestjs/swagger';

export class PostAuthorResponseDto {
  @ApiProperty({
    description: 'Identificador único do autor',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Username do autor',
    example: 'joaosilva',
  })
  username: string;

  @ApiProperty({
    description: 'Nome do autor',
    example: 'João Silva',
  })
  name: string;
}
