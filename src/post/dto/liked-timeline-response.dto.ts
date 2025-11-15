import { ApiProperty } from '@nestjs/swagger';
import { TimelinePostResponseDto } from './timeline-post-response.dto';

export class LikedTimelineResponseDto extends TimelinePostResponseDto {
  @ApiProperty({
    description: 'Data em que a curtida foi realizada',
    example: '2025-04-21T14:35:00.000Z',
    format: 'date-time',
  })
  likedAt: Date;
}
