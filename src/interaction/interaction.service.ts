import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IInteractionRepository } from './interfaces/interaction-repository.interface';
import { IUserRepository } from '../user/interfaces/user-repository.interface';
import { IPostRepository } from '../post/interfaces/post-repository.interface';
import { CreateCommentDto } from './dto';
import { Comment, Follow, Like, Repost } from '@prisma/client';

@Injectable()
export class InteractionService {
  constructor(
    private readonly interactionRepo: IInteractionRepository,
    private readonly userRepo: IUserRepository,
    private readonly postRepo: IPostRepository,
  ) {}

  async followUser(
    currentUserId: string,
    targetUserId: string,
  ): Promise<Follow> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Você não pode seguir a si mesmo.');
    }

    await this.ensureUserExists(targetUserId);

    const alreadyFollowing = await this.interactionRepo.findFollow(
      currentUserId,
      targetUserId,
    );

    if (alreadyFollowing) {
      throw new ConflictException('Você já segue este usuário.');
    }

    return this.interactionRepo.createFollow(currentUserId, targetUserId);
  }

  async unfollowUser(
    currentUserId: string,
    targetUserId: string,
  ): Promise<void> {
    const existingFollow = await this.interactionRepo.findFollow(
      currentUserId,
      targetUserId,
    );

    if (!existingFollow) {
      throw new NotFoundException('Relação de follow não encontrada.');
    }

    await this.interactionRepo.deleteFollow(currentUserId, targetUserId);
  }

  async likePost(currentUserId: string, postId: string): Promise<Like> {
    await this.ensurePostExists(postId);

    const existingLike = await this.interactionRepo.findLike(
      currentUserId,
      postId,
    );

    if (existingLike) {
      throw new ConflictException('Você já curtiu este post.');
    }

    return this.interactionRepo.createLike(currentUserId, postId);
  }

  async unlikePost(currentUserId: string, postId: string): Promise<void> {
    const existingLike = await this.interactionRepo.findLike(
      currentUserId,
      postId,
    );

    if (!existingLike) {
      throw new NotFoundException('Curtida não encontrada.');
    }

    await this.interactionRepo.deleteLike(currentUserId, postId);
  }

  async createRepost(currentUserId: string, postId: string): Promise<Repost> {
    await this.ensurePostExists(postId);

    const existingRepost = await this.interactionRepo.findRepostByUserAndPost(
      currentUserId,
      postId,
    );

    if (existingRepost) {
      throw new ConflictException('Você já repostou este conteúdo.');
    }

    return this.interactionRepo.createRepost(currentUserId, postId);
  }

  async deleteRepost(currentUserId: string, repostId: string): Promise<void> {
    const repost = await this.interactionRepo.findRepostById(repostId);

    if (!repost) {
      throw new NotFoundException('Repost não encontrado.');
    }

    if (repost.userId !== currentUserId) {
      throw new ForbiddenException('Você não pode excluir este repost.');
    }

    await this.interactionRepo.deleteRepost(repostId);
  }

  async createComment(
    currentUserId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const { postId, content, parentCommentId } = createCommentDto;
    await this.ensurePostExists(postId);

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new BadRequestException('Comentário não pode ser vazio.');
    }

    if (trimmedContent.length > 280) {
      throw new BadRequestException(
        'Comentário deve ter no máximo 280 caracteres.',
      );
    }

    if (parentCommentId) {
      const parentComment =
        await this.interactionRepo.findCommentById(parentCommentId);

      if (!parentComment) {
        throw new NotFoundException('Comentário pai não encontrado.');
      }

      if (parentComment.postId !== postId) {
        throw new BadRequestException(
          'Comentário pai deve pertencer ao mesmo post.',
        );
      }
    }

    return this.interactionRepo.createComment({
      authorId: currentUserId,
      postId,
      content: trimmedContent,
      parentId: parentCommentId,
    });
  }

  async deleteComment(currentUserId: string, commentId: string): Promise<void> {
    const comment = await this.interactionRepo.findCommentById(commentId);

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado.');
    }

    if (comment.authorId !== currentUserId) {
      throw new ForbiddenException('Você não pode excluir este comentário.');
    }

    await this.interactionRepo.deleteComment(commentId);
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.userRepo.findUnique({ id: userId });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
  }

  private async ensurePostExists(postId: string): Promise<void> {
    const post = await this.postRepo.findById(postId);

    if (!post) {
      throw new NotFoundException('Post não encontrado.');
    }
  }
}
