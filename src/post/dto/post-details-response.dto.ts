import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TimelinePostResponseDto } from './timeline-post-response.dto';
import { CommentTreeNodeDto } from './comment-tree-node.dto';

export class PostDetailsResponseDto extends TimelinePostResponseDto {
  @ApiProperty({
    description: 'Árvore de comentários do post',
    type: () => [CommentTreeNodeDto],
    default: [],
  })
  @Type(() => CommentTreeNodeDto)
  comments: CommentTreeNodeDto[];
}
