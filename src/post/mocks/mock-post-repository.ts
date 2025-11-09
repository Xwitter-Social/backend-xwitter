import { Post, Prisma } from '@prisma/client';
import {
  CommentWithAuthor,
  IPostRepository,
  PostWithInteractions,
  RepostWithPostInteractions,
} from '../interfaces/post-repository.interface';

interface TimelineStore {
  userId: string;
  posts: PostWithInteractions[];
}

interface PostDetailStore {
  postId: string;
  post: PostWithInteractions;
  comments: CommentWithAuthor[];
}

interface UserPostsStore {
  userId: string;
  posts: PostWithInteractions[];
}

interface UserRepostsStore {
  userId: string;
  reposts: RepostWithPostInteractions[];
}

const clonePost = (post: PostWithInteractions): PostWithInteractions => ({
  ...post,
  author: { ...post.author },
  _count: { ...post._count },
  likes: post.likes ? post.likes.map((like) => ({ ...like })) : undefined,
  reposts: post.reposts
    ? post.reposts.map((repost) => ({ ...repost }))
    : undefined,
});

const cloneComment = (comment: CommentWithAuthor): CommentWithAuthor => ({
  ...comment,
  author: { ...comment.author },
});

const cloneRepost = (
  repost: RepostWithPostInteractions,
): RepostWithPostInteractions => ({
  ...repost,
  post: clonePost(repost.post),
});

export class MockPostRepository implements IPostRepository {
  private posts: Post[] = [];
  private timelineStore: TimelineStore[] = [];
  private postDetailStore: PostDetailStore[] = [];
  private searchStore: PostWithInteractions[] = [];
  private userPostsStore: UserPostsStore[] = [];
  private userRepostsStore: UserRepostsStore[] = [];
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

  getTimelinePosts(userId: string): Promise<PostWithInteractions[]> {
    const stored = this.timelineStore.find((entry) => entry.userId === userId);
    return Promise.resolve(stored ? stored.posts.map(clonePost) : []);
  }

  getPostWithAuthorAndCounts(
    postId: string,
    currentUserId?: string,
  ): Promise<PostWithInteractions | null> {
    void currentUserId;
    const stored = this.postDetailStore.find(
      (entry) => entry.postId === postId,
    );
    return Promise.resolve(stored ? clonePost(stored.post) : null);
  }

  getCommentsByPostId(postId: string): Promise<CommentWithAuthor[]> {
    const stored = this.postDetailStore.find(
      (entry) => entry.postId === postId,
    );
    return Promise.resolve(stored ? stored.comments.map(cloneComment) : []);
  }

  searchPosts(
    query: string,
    currentUserId?: string,
  ): Promise<PostWithInteractions[]> {
    void currentUserId;
    const normalizedQuery = query.toLowerCase();

    const matches = this.searchStore.filter((post) =>
      post.content.toLowerCase().includes(normalizedQuery),
    );

    return Promise.resolve(matches.map(clonePost));
  }

  getPostsByAuthor(
    userId: string,
    currentUserId?: string,
  ): Promise<PostWithInteractions[]> {
    void currentUserId;
    const stored = this.userPostsStore.find((entry) => entry.userId === userId);

    if (!stored) {
      return Promise.resolve([]);
    }

    return Promise.resolve(stored.posts.map(clonePost));
  }

  getRepostsByUser(
    userId: string,
    currentUserId?: string,
  ): Promise<RepostWithPostInteractions[]> {
    void currentUserId;
    const stored = this.userRepostsStore.find(
      (entry) => entry.userId === userId,
    );

    if (!stored) {
      return Promise.resolve([]);
    }

    return Promise.resolve(stored.reposts.map(cloneRepost));
  }

  seedPosts(posts: Post[]): void {
    this.posts = posts.map((post) => ({ ...post }));
  }

  seedTimeline(userId: string, posts: PostWithInteractions[]): void {
    const existingIndex = this.timelineStore.findIndex(
      (entry) => entry.userId === userId,
    );

    const clonedPosts = posts.map((post) => clonePost(post));

    if (existingIndex >= 0) {
      this.timelineStore[existingIndex] = { userId, posts: clonedPosts };
    } else {
      this.timelineStore.push({ userId, posts: clonedPosts });
    }
  }

  seedPostDetails(
    postId: string,
    post: PostWithInteractions,
    comments: CommentWithAuthor[],
  ): void {
    const clonedPost = clonePost(post);
    const clonedComments = comments.map(cloneComment);

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

  seedPostSearch(posts: PostWithInteractions[]): void {
    this.searchStore = posts.map(clonePost);
  }

  seedUserPosts(userId: string, posts: PostWithInteractions[]): void {
    const clonedPosts = posts.map(clonePost);

    const existingIndex = this.userPostsStore.findIndex(
      (entry) => entry.userId === userId,
    );

    const entry: UserPostsStore = {
      userId,
      posts: clonedPosts,
    };

    if (existingIndex >= 0) {
      this.userPostsStore[existingIndex] = entry;
    } else {
      this.userPostsStore.push(entry);
    }
  }

  seedUserReposts(userId: string, reposts: RepostWithPostInteractions[]): void {
    const clonedReposts = reposts.map(cloneRepost);

    const existingIndex = this.userRepostsStore.findIndex(
      (entry) => entry.userId === userId,
    );

    const entry: UserRepostsStore = {
      userId,
      reposts: clonedReposts,
    };

    if (existingIndex >= 0) {
      this.userRepostsStore[existingIndex] = entry;
    } else {
      this.userRepostsStore.push(entry);
    }
  }

  clear(): void {
    this.posts = [];
    this.timelineStore = [];
    this.postDetailStore = [];
    this.searchStore = [];
    this.userPostsStore = [];
    this.userRepostsStore = [];
    this.idSequence = 1;
  }
}
