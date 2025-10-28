import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post as PostMethod,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Post as PostModel } from '@prisma/client';
import {
  PostService,
  PostDetailsDto,
  TimelinePostDto,
  RepostTimelineDto,
} from './post.service';
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
  ApiSearchPosts,
  ApiGetUserPosts,
  ApiGetUserReposts,
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
  @Get('search')
  @ApiSearchPosts()
  async searchPosts(
    @Query('search') query: string,
  ): Promise<TimelinePostDto[]> {
    return this.postService.searchPosts(query);
  }

  @UseGuards(AuthGuard)
  @Get('user/:userId')
  @ApiGetUserPosts()
  async getPostsByUser(
    @Param('userId') userId: string,
  ): Promise<TimelinePostDto[]> {
    return this.postService.getPostsByUser(userId);
  }

  @UseGuards(AuthGuard)
  @Get('user/:userId/reposts')
  @ApiGetUserReposts()
  async getRepostsByUser(
    @Param('userId') userId: string,
  ): Promise<RepostTimelineDto[]> {
    return this.postService.getRepostsByUser(userId);
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
