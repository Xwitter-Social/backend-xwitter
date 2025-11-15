import { Prisma, Post } from '@prisma/client';

export type PostWithAuthorAndCounts = Prisma.PostGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        username: true;
        name: true;
      };
    };
    _count: {
      select: {
        likes: true;
        comments: true;
        reposts: true;
      };
    };
  };
}>;

export type PostWithInteractions = PostWithAuthorAndCounts & {
  likes?: Array<{
    userId: string;
  }>;
  reposts?: Array<{
    id: string;
    userId: string;
  }>;
};

export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        username: true;
        name: true;
      };
    };
  };
}>;

export type RepostWithPostAndCounts = Prisma.RepostGetPayload<{
  include: {
    post: {
      include: {
        author: {
          select: {
            id: true;
            username: true;
            name: true;
          };
        };
        _count: {
          select: {
            likes: true;
            comments: true;
            reposts: true;
          };
        };
      };
    };
  };
}>;

export type RepostWithPostInteractions = Omit<
  RepostWithPostAndCounts,
  'post'
> & {
  post: PostWithInteractions;
};

export interface LikedPostWithInteractions {
  likedAt: Date;
  post: PostWithInteractions;
}

export abstract class IPostRepository {
  abstract create(data: Prisma.PostCreateInput): Promise<Post>;
  abstract findById(postId: string): Promise<Post | null>;
  abstract delete(postId: string): Promise<Post>;
  abstract getTimelinePosts(userId: string): Promise<PostWithInteractions[]>;
  abstract getPostWithAuthorAndCounts(
    postId: string,
    currentUserId?: string,
  ): Promise<PostWithInteractions | null>;
  abstract getCommentsByPostId(postId: string): Promise<CommentWithAuthor[]>;
  abstract searchPosts(
    query: string,
    currentUserId?: string,
  ): Promise<PostWithInteractions[]>;
  abstract getPostsByAuthor(
    userId: string,
    currentUserId?: string,
  ): Promise<PostWithInteractions[]>;
  abstract getRepostsByUser(
    userId: string,
    currentUserId?: string,
  ): Promise<RepostWithPostInteractions[]>;
  abstract getLikedPostsByUser(
    userId: string,
    currentUserId?: string,
  ): Promise<LikedPostWithInteractions[]>;
}
