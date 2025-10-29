import { ApiProperty } from '@nestjs/swagger';

export class RepostResponseDto {
  @ApiProperty({
    description: 'Identificador do repost',
    example: '9f8e7d6c-5b4a-3f2e-1d0c-abcdef123456',
  })
  id: string;

  @ApiProperty({
    description: 'Identificador do post repostado',
    example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
  })
  postId: string;

  @ApiProperty({
    description: 'Identificador do usuário que realizou o repost',
    example: 'user-123',
  })
  userId: string;

  @ApiProperty({
    description: 'Data em que o repost foi realizado',
    example: '2025-04-02T12:30:45.000Z',
    format: 'date-time',
  })
  createdAt: Date;
}
