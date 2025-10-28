import { ApiProperty } from '@nestjs/swagger';

export class PostResponseDto {
  @ApiProperty({
    description: 'Identificador único do post',
    example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
  })
  id: string;

  @ApiProperty({
    description: 'Conteúdo publicado no post',
    example: 'Hoje lancei uma nova funcionalidade no Xwitter!',
  })
  content: string;

  @ApiProperty({
    description: 'Identificador do autor do post',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  authorId: string;

  @ApiProperty({
    description: 'Data de criação do post',
    example: '2025-02-17T10:15:30.000Z',
    format: 'date-time',
  })
  createdAt: Date;
}
