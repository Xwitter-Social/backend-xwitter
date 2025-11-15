import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TimelinePostResponseDto } from './timeline-post-response.dto';
import { PostAuthorResponseDto } from './post-author-response.dto';

export class RepostTimelineResponseDto extends TimelinePostResponseDto {
  @ApiProperty({
    description: 'Data em que o repost foi realizado',
    example: '2025-04-21T14:35:00.000Z',
    format: 'date-time',
  })
  override repostedAt: Date = undefined as unknown as Date;

  @ApiProperty({
    description: 'Usuário responsável pelo repost',
    type: () => PostAuthorResponseDto,
  })
  @Type(() => PostAuthorResponseDto)
  override repostedBy: PostAuthorResponseDto =
    undefined as unknown as PostAuthorResponseDto;
}
