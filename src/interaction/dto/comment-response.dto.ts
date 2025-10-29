import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentResponseDto {
  @ApiProperty({
    description: 'Identificador do comentário',
    example: '5a7c9a12-3b45-4f62-9d1b-12ef567890ab',
  })
  id: string;

  @ApiProperty({
    description: 'Conteúdo do comentário',
    example: 'Concordo plenamente.',
  })
  content: string;

  @ApiProperty({
    description: 'Identificador do post associado',
    example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
  })
  postId: string;

  @ApiProperty({
    description: 'Identificador do autor do comentário',
    example: 'user-123',
  })
  authorId: string;

  @ApiPropertyOptional({
    description: 'Identificador do comentário pai quando for uma resposta',
    example: '1f2e3d4c-5b6a-7c8d-9e0f-1234567890ab',
    nullable: true,
  })
  parentId?: string | null;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-02-27T15:42:10.123Z',
    format: 'date-time',
  })
  createdAt: Date;
}
