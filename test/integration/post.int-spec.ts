import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from 'src/post/post.service';
import { PrismaService } from 'src/database/prisma.service';
import { PostRepository } from 'src/post/post.repository';
import { IPostRepository } from 'src/post/interfaces/post-repository.interface';
import { IUserRepository } from 'src/user/interfaces/user-repository.interface';
import { UserRepository } from 'src/user/user.repository';
import {
  createTestFollow,
  createTestLike,
  createTestPost,
  createTestUser,
  createTestRepost,
} from './utils/factories';

describe('PostService (integration)', () => {
  let moduleRef: TestingModule;
  let service: PostService;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        PostService,
        PostRepository,
        UserRepository,
        {
          provide: IPostRepository,
          useClass: PostRepository,
        },
        {
          provide: IUserRepository,
          useClass: UserRepository,
        },
      ],
    }).compile();

    service = moduleRef.get<PostService>(PostService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('trims content and persists new posts', async () => {
    const author = await createTestUser({
      email: 'author@example.com',
      username: 'author',
    });

    const created = await service.createPost(
      { content: '   Hello NestJS!   ' },
      author.id,
    );

    expect(created.content).toBe('Hello NestJS!');

    const stored = await prisma.post.findUnique({ where: { id: created.id } });
    expect(stored?.authorId).toBe(author.id);
    expect(stored?.content).toBe('Hello NestJS!');
  });

  it('includes followed users posts in the timeline', async () => {
    const author = await createTestUser({
      email: 'author2@example.com',
      username: 'author_two',
    });
    const follower = await createTestUser({
      email: 'follower@example.com',
      username: 'follower_user',
    });

    await createTestFollow({ followerId: follower.id, followingId: author.id });

    const created = await service.createPost(
      { content: 'Timeline ready' },
      author.id,
    );

    const timeline = await service.getTimeline(follower.id);

    expect(timeline).toHaveLength(1);
    expect(timeline[0].id).toBe(created.id);
    expect(timeline[0].author.id).toBe(author.id);
    expect(timeline[0].likeCount).toBe(0);
    expect(timeline[0].commentCount).toBe(0);
  });

  it('includes reposts from followed users in the timeline respecting chronology', async () => {
    const originalAuthor = await createTestUser({
      email: 'original@example.com',
      username: 'original_author',
    });

    const reposter = await createTestUser({
      email: 'reposter@example.com',
      username: 'reposter_user',
    });

    const follower = await createTestUser({
      email: 'timeline-follower@example.com',
      username: 'timeline_follower',
    });

    await createTestFollow({
      followerId: follower.id,
      followingId: reposter.id,
    });

    const originalPost = await createTestPost({
      authorId: originalAuthor.id,
      content: 'Post original para repost',
      createdAt: new Date('2025-01-01T08:00:00.000Z'),
    });

    const directPost = await createTestPost({
      authorId: reposter.id,
      content: 'Post direto do reposter',
      createdAt: new Date('2025-01-01T09:00:00.000Z'),
    });

    const repostCreatedAt = new Date('2025-01-02T12:00:00.000Z');

    await createTestRepost({
      userId: reposter.id,
      postId: originalPost.id,
      createdAt: repostCreatedAt,
    });

    const timeline = await service.getTimeline(follower.id);

    expect(timeline).toHaveLength(2);
    expect(timeline[0].id).toBe(originalPost.id);
    expect(timeline[0].repostedAt?.toISOString()).toBe(
      repostCreatedAt.toISOString(),
    );
    expect(timeline[0].repostedBy?.id).toBe(reposter.id);
    expect(timeline[1].id).toBe(directPost.id);
    expect(timeline[1].repostedAt).toBeNull();
  });

  it('returns liked posts ordered by like date', async () => {
    const author = await createTestUser({
      email: 'author-like@example.com',
      username: 'author_like',
    });
    const liker = await createTestUser({
      email: 'liker@example.com',
      username: 'liker_user',
    });

    const olderPost = await createTestPost({
      authorId: author.id,
      content: 'Post curtido mais antigo',
    });
    const newerPost = await createTestPost({
      authorId: author.id,
      content: 'Post curtido mais recente',
    });

    const olderDate = new Date('2025-05-01T10:00:00.000Z');
    const newerDate = new Date('2025-06-01T10:00:00.000Z');

    await createTestLike({
      userId: liker.id,
      postId: newerPost.id,
      createdAt: newerDate,
    });

    await createTestLike({
      userId: liker.id,
      postId: olderPost.id,
      createdAt: olderDate,
    });

    const likedPosts = await service.getLikedPostsByUser(liker.id, liker.id);

    expect(likedPosts).toHaveLength(2);
    expect(likedPosts[0].id).toBe(newerPost.id);
    expect(likedPosts[0].likedAt.toISOString()).toBe(newerDate.toISOString());
    expect(likedPosts[0].isLiked).toBe(true);
    expect(likedPosts[1].id).toBe(olderPost.id);
    expect(likedPosts[1].likedAt.toISOString()).toBe(olderDate.toISOString());
  });
});
