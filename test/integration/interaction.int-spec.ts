import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { InteractionService } from 'src/interaction/interaction.service';
import { InteractionRepository } from 'src/interaction/interaction.repository';
import { IInteractionRepository } from 'src/interaction/interfaces/interaction-repository.interface';
import { PrismaService } from 'src/database/prisma.service';
import { UserRepository } from 'src/user/user.repository';
import { IUserRepository } from 'src/user/interfaces/user-repository.interface';
import { PostRepository } from 'src/post/post.repository';
import { IPostRepository } from 'src/post/interfaces/post-repository.interface';
import { createTestPost, createTestUser } from './utils/factories';

describe('InteractionService (integration)', () => {
  let moduleRef: TestingModule;
  let service: InteractionService;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        InteractionService,
        InteractionRepository,
        UserRepository,
        PostRepository,
        {
          provide: IInteractionRepository,
          useClass: InteractionRepository,
        },
        {
          provide: IUserRepository,
          useClass: UserRepository,
        },
        {
          provide: IPostRepository,
          useClass: PostRepository,
        },
      ],
    }).compile();

    service = moduleRef.get<InteractionService>(InteractionService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('follows another user once and blocks duplicates', async () => {
    const follower = await createTestUser({
      email: 'follower2@example.com',
      username: 'follower2',
    });
    const target = await createTestUser({
      email: 'target@example.com',
      username: 'target_user',
    });

    const follow = await service.followUser(follower.id, target.id);

    expect(follow.followerId).toBe(follower.id);
    expect(follow.followingId).toBe(target.id);

    await expect(service.followUser(follower.id, target.id)).rejects.toThrow(
      ConflictException,
    );
  });

  it('creates comments trimming whitespace', async () => {
    const author = await createTestUser({
      email: 'author-post@example.com',
      username: 'author_post',
    });
    const commenter = await createTestUser({
      email: 'commenter@example.com',
      username: 'commenter_user',
    });
    const post = await createTestPost({
      authorId: author.id,
      content: 'Comment here',
    });

    const comment = await service.createComment(commenter.id, {
      postId: post.id,
      content: '   Nice job!   ',
    });

    expect(comment.authorId).toBe(commenter.id);
    expect(comment.content).toBe('Nice job!');

    const stored = await prisma.comment.findUnique({
      where: { id: comment.id },
    });
    expect(stored?.content).toBe('Nice job!');
  });

  it('likes a post only once', async () => {
    const author = await createTestUser({
      email: 'like-author@example.com',
      username: 'like_author',
    });
    const liker = await createTestUser({
      email: 'liker@example.com',
      username: 'liker_user',
    });
    const post = await createTestPost({
      authorId: author.id,
      content: 'Like this post',
    });

    const like = await service.likePost(liker.id, post.id);

    expect(like.userId).toBe(liker.id);
    expect(like.postId).toBe(post.id);

    await expect(service.likePost(liker.id, post.id)).rejects.toThrow(
      ConflictException,
    );
  });
});
