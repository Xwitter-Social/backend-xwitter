import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post as PostMethod,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InteractionService } from './interaction.service';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  CurrentUser,
  type CurrentUserData,
} from 'src/auth/current-user.decorator';
import {
  CreateCommentDto,
  CommentResponseDto,
  MessageResponseDto,
  RepostResponseDto,
} from './dto';
import {
  ApiFollowUser,
  ApiUnfollowUser,
  ApiLikePost,
  ApiUnlikePost,
  ApiCreateRepost,
  ApiDeleteRepost,
  ApiCreateComment,
  ApiDeleteComment,
} from '../common/decorators/swagger.decorators';

@ApiTags('interaction')
@Controller('interaction')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @UseGuards(AuthGuard)
  @PostMethod('follow/:targetUserId')
  @HttpCode(HttpStatus.CREATED)
  @ApiFollowUser()
  async followUser(
    @Param('targetUserId') targetUserId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<MessageResponseDto> {
    await this.interactionService.followUser(currentUser.sub, targetUserId);
    return { message: 'Usuário seguido com sucesso.' };
  }

  @UseGuards(AuthGuard)
  @Delete('follow/:targetUserId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiUnfollowUser()
  async unfollowUser(
    @Param('targetUserId') targetUserId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<void> {
    await this.interactionService.unfollowUser(currentUser.sub, targetUserId);
  }

  @UseGuards(AuthGuard)
  @PostMethod('like/:postId')
  @HttpCode(HttpStatus.CREATED)
  @ApiLikePost()
  async likePost(
    @Param('postId') postId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<MessageResponseDto> {
    await this.interactionService.likePost(currentUser.sub, postId);
    return { message: 'Post curtido com sucesso.' };
  }

  @UseGuards(AuthGuard)
  @Delete('like/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiUnlikePost()
  async unlikePost(
    @Param('postId') postId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<void> {
    await this.interactionService.unlikePost(currentUser.sub, postId);
  }

  @UseGuards(AuthGuard)
  @PostMethod('repost/:postId')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateRepost()
  async createRepost(
    @Param('postId') postId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<RepostResponseDto> {
    const repost = await this.interactionService.createRepost(
      currentUser.sub,
      postId,
    );

    return {
      id: repost.id,
      postId: repost.postId,
      userId: repost.userId,
      createdAt: repost.createdAt,
    };
  }

  @UseGuards(AuthGuard)
  @Delete('repost/:repostId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteRepost()
  async deleteRepost(
    @Param('repostId') repostId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<void> {
    await this.interactionService.deleteRepost(currentUser.sub, repostId);
  }

  @UseGuards(AuthGuard)
  @PostMethod('comment')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateComment()
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<CommentResponseDto> {
    const comment = await this.interactionService.createComment(
      currentUser.sub,
      createCommentDto,
    );

    return {
      id: comment.id,
      authorId: comment.authorId,
      postId: comment.postId,
      content: comment.content,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
    };
  }

  @UseGuards(AuthGuard)
  @Delete('comment/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteComment()
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<void> {
    await this.interactionService.deleteComment(currentUser.sub, commentId);
  }
}
