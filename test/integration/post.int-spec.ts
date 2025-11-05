import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from 'src/post/post.service';
import { PrismaService } from 'src/database/prisma.service';
import { PostRepository } from 'src/post/post.repository';
import { IPostRepository } from 'src/post/interfaces/post-repository.interface';
import { IUserRepository } from 'src/user/interfaces/user-repository.interface';
import { UserRepository } from 'src/user/user.repository';
import { createTestFollow, createTestUser } from './utils/factories';

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
});
