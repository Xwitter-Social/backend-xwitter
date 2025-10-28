import { Injectable } from '@nestjs/common';
import { Prisma, Post } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import {
  CommentWithAuthor,
  IPostRepository,
  PostWithAuthorAndCounts,
} from './interfaces/post-repository.interface';

const authorSelect = {
  id: true,
  username: true,
  name: true,
} as const;

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.PostCreateInput): Promise<Post> {
    return this.prisma.post.create({ data });
  }

  async findById(postId: string): Promise<Post | null> {
    return this.prisma.post.findUnique({ where: { id: postId } });
  }

  async delete(postId: string): Promise<Post> {
    return this.prisma.post.delete({ where: { id: postId } });
  }

  async getTimelinePosts(userId: string): Promise<PostWithAuthorAndCounts[]> {
    const followings = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const authorIds = Array.from(
      new Set([userId, ...followings.map((follow) => follow.followingId)]),
    );

    if (!authorIds.length) {
      return [];
    }

    return this.prisma.post.findMany({
      where: { authorId: { in: authorIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: authorSelect },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
  }

  async getPostWithAuthorAndCounts(
    postId: string,
  ): Promise<PostWithAuthorAndCounts | null> {
    return this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: authorSelect },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
  }

  async getCommentsByPostId(postId: string): Promise<CommentWithAuthor[]> {
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: authorSelect },
      },
    });
  }

  async searchPosts(query: string): Promise<PostWithAuthorAndCounts[]> {
    return this.prisma.post.findMany({
      where: {
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: authorSelect },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      take: 50,
    });
  }
}
