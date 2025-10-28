import { ApiProperty } from '@nestjs/swagger';
import { TimelinePostResponseDto } from './timeline-post-response.dto';

export class RepostTimelineResponseDto extends TimelinePostResponseDto {
  @ApiProperty({
    description: 'Data em que o repost foi realizado',
    example: '2025-04-21T14:35:00.000Z',
    format: 'date-time',
  })
  repostedAt: Date;
}
