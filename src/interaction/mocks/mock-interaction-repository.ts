import { Comment, Follow, Like, Repost } from '@prisma/client';
import {
  CreateCommentParams,
  IInteractionRepository,
} from '../interfaces/interaction-repository.interface';

const DEFAULT_BASE_DATE = new Date('2025-01-01T00:00:00.000Z');

const cloneFollow = (follow: Follow): Follow => ({ ...follow });
const cloneLike = (like: Like): Like => ({ ...like });
const cloneRepost = (repost: Repost): Repost => ({ ...repost });
const cloneComment = (comment: Comment): Comment => ({ ...comment });

export class MockInteractionRepository implements IInteractionRepository {
  private follows: Follow[] = [];
  private likes: Like[] = [];
  private reposts: Repost[] = [];
  private comments: Comment[] = [];
  private repostIdSequence = 1;
  private commentIdSequence = 1;

  findFollow(followerId: string, followingId: string): Promise<Follow | null> {
    const follow = this.follows.find(
      (entry) =>
        entry.followerId === followerId && entry.followingId === followingId,
    );

    return Promise.resolve(follow ? cloneFollow(follow) : null);
  }

  createFollow(followerId: string, followingId: string): Promise<Follow> {
    const follow: Follow = { followerId, followingId };
    this.follows.push(follow);
    return Promise.resolve(cloneFollow(follow));
  }

  deleteFollow(followerId: string, followingId: string): Promise<void> {
    this.follows = this.follows.filter(
      (follow) =>
        follow.followerId !== followerId || follow.followingId !== followingId,
    );

    return Promise.resolve();
  }

  findLike(userId: string, postId: string): Promise<Like | null> {
    const like = this.likes.find(
      (entry) => entry.userId === userId && entry.postId === postId,
    );

    return Promise.resolve(like ? cloneLike(like) : null);
  }

  createLike(userId: string, postId: string): Promise<Like> {
    const like: Like = { userId, postId };
    this.likes.push(like);
    return Promise.resolve(cloneLike(like));
  }

  deleteLike(userId: string, postId: string): Promise<void> {
    this.likes = this.likes.filter(
      (like) => like.userId !== userId || like.postId !== postId,
    );

    return Promise.resolve();
  }

  findRepostByUserAndPost(
    userId: string,
    postId: string,
  ): Promise<Repost | null> {
    const repost = this.reposts.find(
      (entry) => entry.userId === userId && entry.postId === postId,
    );

    return Promise.resolve(repost ? cloneRepost(repost) : null);
  }

  findRepostById(repostId: string): Promise<Repost | null> {
    const repost = this.reposts.find((entry) => entry.id === repostId);
    return Promise.resolve(repost ? cloneRepost(repost) : null);
  }

  createRepost(userId: string, postId: string): Promise<Repost> {
    const timestamp =
      DEFAULT_BASE_DATE.getTime() + this.repostIdSequence * 1000;
    const repost: Repost = {
      id: `repost-${this.repostIdSequence}`,
      userId,
      postId,
      createdAt: new Date(timestamp),
    };

    this.repostIdSequence += 1;
    this.reposts.push(repost);
    return Promise.resolve(cloneRepost(repost));
  }

  deleteRepost(repostId: string): Promise<void> {
    this.reposts = this.reposts.filter((repost) => repost.id !== repostId);
    return Promise.resolve();
  }

  findCommentById(commentId: string): Promise<Comment | null> {
    const comment = this.comments.find((entry) => entry.id === commentId);
    return Promise.resolve(comment ? cloneComment(comment) : null);
  }

  createComment(params: CreateCommentParams): Promise<Comment> {
    const timestamp =
      DEFAULT_BASE_DATE.getTime() + this.commentIdSequence * 1000;

    const comment: Comment = {
      id: `comment-${this.commentIdSequence}`,
      content: params.content,
      postId: params.postId,
      authorId: params.authorId,
      createdAt: new Date(timestamp),
      parentId: params.parentId ?? null,
    };

    this.commentIdSequence += 1;
    this.comments.push(comment);
    return Promise.resolve(cloneComment(comment));
  }

  deleteComment(commentId: string): Promise<Comment> {
    const index = this.comments.findIndex(
      (comment) => comment.id === commentId,
    );

    if (index === -1) {
      throw new Error('Comment not found');
    }

    const [deleted] = this.comments.splice(index, 1);
    return Promise.resolve(cloneComment(deleted));
  }

  clear(): void {
    this.follows = [];
    this.likes = [];
    this.reposts = [];
    this.comments = [];
    this.repostIdSequence = 1;
    this.commentIdSequence = 1;
  }

  seedFollows(follows: Array<Partial<Follow>>): void {
    this.follows = follows.map((follow, index) => ({
      followerId: follow.followerId ?? `follower-${index + 1}`,
      followingId: follow.followingId ?? `following-${index + 1}`,
    }));
  }

  seedLikes(likes: Array<Partial<Like>>): void {
    this.likes = likes.map((like, index) => ({
      userId: like.userId ?? `user-${index + 1}`,
      postId: like.postId ?? `post-${index + 1}`,
    }));
  }

  seedReposts(reposts: Array<Partial<Repost>>): void {
    this.reposts = reposts.map((repost, index) => ({
      id: repost.id ?? `repost-${index + 1}`,
      userId: repost.userId ?? `user-${index + 1}`,
      postId: repost.postId ?? `post-${index + 1}`,
      createdAt:
        repost.createdAt ??
        new Date(DEFAULT_BASE_DATE.getTime() + (index + 1) * 1000),
    }));

    this.repostIdSequence = this.reposts.length + 1;
  }

  seedComments(comments: Array<Partial<Comment>>): void {
    this.comments = comments.map((comment, index) => ({
      id: comment.id ?? `comment-${index + 1}`,
      content: comment.content ?? 'Conteúdo padrão',
      postId: comment.postId ?? `post-${index + 1}`,
      authorId: comment.authorId ?? `author-${index + 1}`,
      createdAt:
        comment.createdAt ??
        new Date(DEFAULT_BASE_DATE.getTime() + (index + 1) * 1000),
      parentId: comment.parentId ?? null,
    }));

    this.commentIdSequence = this.comments.length + 1;
  }
}
