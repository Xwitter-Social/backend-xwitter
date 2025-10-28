import { Post, Prisma } from '@prisma/client';
import {
  CommentWithAuthor,
  IPostRepository,
  PostWithAuthorAndCounts,
} from '../interfaces/post-repository.interface';

interface TimelineStore {
  userId: string;
  posts: PostWithAuthorAndCounts[];
}

interface PostDetailStore {
  postId: string;
  post: PostWithAuthorAndCounts;
  comments: CommentWithAuthor[];
}

export class MockPostRepository implements IPostRepository {
  private posts: Post[] = [];
  private timelineStore: TimelineStore[] = [];
  private postDetailStore: PostDetailStore[] = [];
  private idSequence = 1;
  private defaultDate = new Date('2025-01-01T00:00:00.000Z');

  create(data: Prisma.PostCreateInput): Promise<Post> {
    const authorRelation = data.author;

    const post: Post = {
      id: `post-${this.idSequence}`,
      content: data.content,
      authorId: authorRelation?.connect?.id || `author-${this.idSequence}`,
      createdAt: this.defaultDate,
    };

    this.idSequence += 1;
    this.posts.push(post);

    return Promise.resolve(post);
  }

  findById(postId: string): Promise<Post | null> {
    return Promise.resolve(
      this.posts.find((post) => post.id === postId) || null,
    );
  }

  delete(postId: string): Promise<Post> {
    const index = this.posts.findIndex((post) => post.id === postId);

    if (index === -1) {
      throw new Error('Post not found');
    }

    const [deleted] = this.posts.splice(index, 1);
    return Promise.resolve(deleted);
  }

  getTimelinePosts(userId: string): Promise<PostWithAuthorAndCounts[]> {
    const stored = this.timelineStore.find((entry) => entry.userId === userId);
    return Promise.resolve(stored ? stored.posts : []);
  }

  getPostWithAuthorAndCounts(
    postId: string,
  ): Promise<PostWithAuthorAndCounts | null> {
    const stored = this.postDetailStore.find(
      (entry) => entry.postId === postId,
    );
    return Promise.resolve(stored ? stored.post : null);
  }

  getCommentsByPostId(postId: string): Promise<CommentWithAuthor[]> {
    const stored = this.postDetailStore.find(
      (entry) => entry.postId === postId,
    );
    return Promise.resolve(stored ? stored.comments : []);
  }

  seedPosts(posts: Post[]): void {
    this.posts = posts.map((post) => ({ ...post }));
  }

  seedTimeline(userId: string, posts: PostWithAuthorAndCounts[]): void {
    const existingIndex = this.timelineStore.findIndex(
      (entry) => entry.userId === userId,
    );

    const clonedPosts = posts.map((post) => ({
      ...post,
      author: { ...post.author },
      _count: { ...post._count },
    }));

    if (existingIndex >= 0) {
      this.timelineStore[existingIndex] = { userId, posts: clonedPosts };
    } else {
      this.timelineStore.push({ userId, posts: clonedPosts });
    }
  }

  seedPostDetails(
    postId: string,
    post: PostWithAuthorAndCounts,
    comments: CommentWithAuthor[],
  ): void {
    const clonedPost = {
      ...post,
      author: { ...post.author },
      _count: { ...post._count },
    };

    const clonedComments = comments.map((comment) => ({
      ...comment,
      author: { ...comment.author },
    }));

    const existingIndex = this.postDetailStore.findIndex(
      (entry) => entry.postId === postId,
    );

    const entry: PostDetailStore = {
      postId,
      post: clonedPost,
      comments: clonedComments,
    };

    if (existingIndex >= 0) {
      this.postDetailStore[existingIndex] = entry;
    } else {
      this.postDetailStore.push(entry);
    }
  }

  clear(): void {
    this.posts = [];
    this.timelineStore = [];
    this.postDetailStore = [];
    this.idSequence = 1;
  }
}
