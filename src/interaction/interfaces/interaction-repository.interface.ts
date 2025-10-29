import { Comment, Follow, Like, Repost } from '@prisma/client';

export interface CreateCommentParams {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
}

export abstract class IInteractionRepository {
  abstract findFollow(
    followerId: string,
    followingId: string,
  ): Promise<Follow | null>;
  abstract createFollow(
    followerId: string,
    followingId: string,
  ): Promise<Follow>;
  abstract deleteFollow(followerId: string, followingId: string): Promise<void>;

  abstract findLike(userId: string, postId: string): Promise<Like | null>;
  abstract createLike(userId: string, postId: string): Promise<Like>;
  abstract deleteLike(userId: string, postId: string): Promise<void>;

  abstract findRepostByUserAndPost(
    userId: string,
    postId: string,
  ): Promise<Repost | null>;
  abstract findRepostById(repostId: string): Promise<Repost | null>;
  abstract createRepost(userId: string, postId: string): Promise<Repost>;
  abstract deleteRepost(repostId: string): Promise<void>;

  abstract findCommentById(commentId: string): Promise<Comment | null>;
  abstract createComment(params: CreateCommentParams): Promise<Comment>;
  abstract deleteComment(commentId: string): Promise<Comment>;
}
