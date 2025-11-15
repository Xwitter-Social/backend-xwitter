import { Injectable } from '@nestjs/common';
import { Prisma, Post } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import {
  CommentWithAuthor,
  IPostRepository,
  LikedPostWithInteractions,
  PostWithInteractions,
  RepostWithPostInteractions,
} from './interfaces/post-repository.interface';

const authorSelect = {
  id: true,
  username: true,
  name: true,
} as const;

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getPostInclude(currentUserId?: string): Prisma.PostInclude {
    const include: Prisma.PostInclude = {
      author: { select: authorSelect },
      _count: {
        select: {
          likes: true,
          comments: true,
          reposts: true,
        },
      },
    };

    if (currentUserId) {
      include.likes = {
        where: { userId: currentUserId },
        select: { userId: true },
      };

      include.reposts = {
        where: { userId: currentUserId },
        select: { id: true, userId: true },
      };
    }

    return include;
  }

  async create(data: Prisma.PostCreateInput): Promise<Post> {
    return this.prisma.post.create({ data });
  }

  async findById(postId: string): Promise<Post | null> {
    return this.prisma.post.findUnique({ where: { id: postId } });
  }

  async delete(postId: string): Promise<Post> {
    return this.prisma.post.delete({ where: { id: postId } });
  }

  async getTimelinePosts(userId: string): Promise<PostWithInteractions[]> {
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
      include: this.getPostInclude(userId),
    }) as Promise<PostWithInteractions[]>;
  }

  async getPostWithAuthorAndCounts(
    postId: string,
    currentUserId?: string,
  ): Promise<PostWithInteractions | null> {
    return this.prisma.post.findUnique({
      where: { id: postId },
      include: this.getPostInclude(currentUserId),
    }) as Promise<PostWithInteractions | null>;
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

  async searchPosts(
    query: string,
    currentUserId?: string,
  ): Promise<PostWithInteractions[]> {
    return this.prisma.post.findMany({
      where: {
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
      include: this.getPostInclude(currentUserId),
      take: 50,
    }) as Promise<PostWithInteractions[]>;
  }

  async getPostsByAuthor(
    userId: string,
    currentUserId?: string,
  ): Promise<PostWithInteractions[]> {
    return this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: this.getPostInclude(currentUserId),
    }) as Promise<PostWithInteractions[]>;
  }

  async getRepostsByUser(
    userId: string,
    currentUserId?: string,
  ): Promise<RepostWithPostInteractions[]> {
    return this.prisma.repost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: this.getPostInclude(currentUserId),
        },
      },
    }) as Promise<RepostWithPostInteractions[]>;
  }

  async getLikedPostsByUser(
    userId: string,
    currentUserId?: string,
  ): Promise<LikedPostWithInteractions[]> {
    const likes = (await this.prisma.like.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        post: {
          include: this.getPostInclude(currentUserId),
        },
      },
    })) as Array<{
      createdAt: Date;
      post: PostWithInteractions;
    }>;

    return likes.map((like) => ({
      likedAt: like.createdAt,
      post: like.post,
    }));
  }
}
