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
      };
    };
  };
}>;

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
          };
        };
      };
    };
  };
}>;

export abstract class IPostRepository {
  abstract create(data: Prisma.PostCreateInput): Promise<Post>;
  abstract findById(postId: string): Promise<Post | null>;
  abstract delete(postId: string): Promise<Post>;
  abstract getTimelinePosts(userId: string): Promise<PostWithAuthorAndCounts[]>;
  abstract getPostWithAuthorAndCounts(
    postId: string,
  ): Promise<PostWithAuthorAndCounts | null>;
  abstract getCommentsByPostId(postId: string): Promise<CommentWithAuthor[]>;
  abstract searchPosts(query: string): Promise<PostWithAuthorAndCounts[]>;
  abstract getPostsByAuthor(userId: string): Promise<PostWithAuthorAndCounts[]>;
  abstract getRepostsByUser(userId: string): Promise<RepostWithPostAndCounts[]>;
}
