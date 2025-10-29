import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import {
  CreateCommentParams,
  IInteractionRepository,
} from './interfaces/interaction-repository.interface';
import { Comment, Follow, Like, Repost } from '@prisma/client';

@Injectable()
export class InteractionRepository implements IInteractionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFollow(followerId: string, followingId: string): Promise<Follow | null> {
    return this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  createFollow(followerId: string, followingId: string): Promise<Follow> {
    return this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  async deleteFollow(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  findLike(userId: string, postId: string): Promise<Like | null> {
    return this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }

  createLike(userId: string, postId: string): Promise<Like> {
    return this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });
  }

  async deleteLike(userId: string, postId: string): Promise<void> {
    await this.prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }

  findRepostByUserAndPost(
    userId: string,
    postId: string,
  ): Promise<Repost | null> {
    return this.prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }

  findRepostById(repostId: string): Promise<Repost | null> {
    return this.prisma.repost.findUnique({
      where: { id: repostId },
    });
  }

  createRepost(userId: string, postId: string): Promise<Repost> {
    return this.prisma.repost.create({
      data: {
        userId,
        postId,
      },
    });
  }

  async deleteRepost(repostId: string): Promise<void> {
    await this.prisma.repost.delete({
      where: { id: repostId },
    });
  }

  findCommentById(commentId: string): Promise<Comment | null> {
    return this.prisma.comment.findUnique({
      where: { id: commentId },
    });
  }

  createComment(params: CreateCommentParams): Promise<Comment> {
    const { postId, authorId, content, parentId } = params;

    return this.prisma.comment.create({
      data: {
        postId,
        authorId,
        content,
        parentId: parentId ?? null,
      },
    });
  }

  deleteComment(commentId: string): Promise<Comment> {
    return this.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}
