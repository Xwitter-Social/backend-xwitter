import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PostAuthorResponseDto } from './post-author-response.dto';

export class TimelinePostResponseDto {
  @ApiProperty({
    description: 'Identificador único do post',
    example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
  })
  id: string;

  @ApiProperty({
    description: 'Conteúdo do post',
    example: 'Hoje lancei uma nova funcionalidade no Xwitter!',
  })
  content: string;

  @ApiProperty({
    description: 'Data de criação do post',
    example: '2025-02-17T10:15:30.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Dados do autor do post',
    type: () => PostAuthorResponseDto,
  })
  @Type(() => PostAuthorResponseDto)
  author: PostAuthorResponseDto;

  @ApiProperty({
    description: 'Quantidade total de curtidas do post',
    example: 42,
  })
  likeCount: number;

  @ApiProperty({
    description: 'Quantidade total de comentários do post',
    example: 5,
  })
  commentCount: number;
}
