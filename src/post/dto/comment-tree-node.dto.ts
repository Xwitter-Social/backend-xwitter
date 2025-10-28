import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PostAuthorResponseDto } from './post-author-response.dto';

export class CommentTreeNodeDto {
  @ApiProperty({
    description: 'Identificador único do comentário',
    example: '7d7b5ee3-5a5f-4a19-ae75-332f6e84e5d3',
  })
  id: string;

  @ApiProperty({
    description: 'Conteúdo do comentário',
    example: 'Concordo totalmente com o que você disse!',
  })
  content: string;

  @ApiProperty({
    description: 'Data de criação do comentário',
    example: '2025-02-17T14:35:22.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Autor do comentário',
    type: () => PostAuthorResponseDto,
  })
  @Type(() => PostAuthorResponseDto)
  author: PostAuthorResponseDto;

  @ApiProperty({
    description: 'Lista de respostas deste comentário',
    type: () => [CommentTreeNodeDto],
    default: [],
  })
  @Type(() => CommentTreeNodeDto)
  replies: CommentTreeNodeDto[];
}
