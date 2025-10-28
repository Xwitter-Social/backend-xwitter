import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post as PostMethod,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Post as PostModel } from '@prisma/client';
import { PostService, PostDetailsDto, TimelinePostDto } from './post.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreatePostDto } from './dto';
import {
  CurrentUser,
  type CurrentUserData,
} from 'src/auth/current-user.decorator';
import {
  ApiCreatePost,
  ApiDeletePost,
  ApiGetPostDetails,
  ApiGetTimeline,
} from '../common/decorators/swagger.decorators';

@ApiTags('posts')
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(AuthGuard)
  @PostMethod()
  @ApiCreatePost()
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<PostModel> {
    return this.postService.createPost(createPostDto, currentUser.sub);
  }

  @UseGuards(AuthGuard)
  @Get('timeline')
  @ApiGetTimeline()
  async getTimeline(
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<TimelinePostDto[]> {
    return this.postService.getTimeline(currentUser.sub);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiGetPostDetails()
  async getPostDetails(@Param('id') id: string): Promise<PostDetailsDto> {
    return this.postService.getPostDetails(id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  @ApiDeletePost()
  async deletePost(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<PostModel> {
    return this.postService.deletePost(id, currentUser.sub);
  }
}
