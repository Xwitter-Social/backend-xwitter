import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { IInteractionRepository } from './interfaces/interaction-repository.interface';
import { MockInteractionRepository } from './mocks/mock-interaction-repository';
import { IUserRepository } from '../user/interfaces/user-repository.interface';
import { MockUserRepository } from '../user/mocks/mock-user-repository';
import { IPostRepository } from '../post/interfaces/post-repository.interface';
import { MockPostRepository } from '../post/mocks/mock-post-repository';
import { Post, User } from '@prisma/client';

const buildUser = (overrides?: Partial<User>): Partial<User> => ({
  id: overrides?.id ?? 'user-1',
  email: overrides?.email ?? 'user1@test.com',
  username: overrides?.username ?? 'user1',
  name: overrides?.name ?? 'User 1',
  password: overrides?.password ?? 'hashedPassword123',
  bio: overrides?.bio ?? null,
  createdAt: overrides?.createdAt ?? new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: overrides?.updatedAt ?? new Date('2025-01-01T00:00:00.000Z'),
});

const buildPost = (overrides?: Partial<Post>): Post => ({
  id: overrides?.id ?? 'post-1',
  content: overrides?.content ?? 'Conteúdo padrão',
  authorId: overrides?.authorId ?? 'author-1',
  createdAt: overrides?.createdAt ?? new Date('2025-01-01T12:00:00.000Z'),
});

describe('InteractionService', () => {
  let service: InteractionService;
  let interactionRepo: MockInteractionRepository;
  let userRepo: MockUserRepository;
  let postRepo: MockPostRepository;

  beforeEach(async () => {
    interactionRepo = new MockInteractionRepository();
    userRepo = new MockUserRepository();
    postRepo = new MockPostRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteractionService,
        {
          provide: IInteractionRepository,
          useValue: interactionRepo,
        },
        {
          provide: IUserRepository,
          useValue: userRepo,
        },
        {
          provide: IPostRepository,
          useValue: postRepo,
        },
      ],
    }).compile();

    service = module.get<InteractionService>(InteractionService);
  });

  afterEach(() => {
    interactionRepo.clear();
    userRepo.clear();
    postRepo.clear();
  });

  describe('followUser', () => {
    test.each([
      {
        description:
          'should create follow relation when target exists and is different from current user',
        execute: async () => {
          const currentUserId = 'user-1';
          const targetUserId = 'user-2';

          userRepo.seed([
            buildUser({ id: currentUserId, username: 'current-user' }),
            buildUser({ id: targetUserId, username: 'target-user' }),
          ]);

          const result = await service.followUser(currentUserId, targetUserId);

          expect(result).toMatchObject({
            followerId: currentUserId,
            followingId: targetUserId,
          });

          const stored = await interactionRepo.findFollow(
            currentUserId,
            targetUserId,
          );
          expect(stored).not.toBeNull();
        },
      },
    ])('$description', async ({ execute }) => {
      await execute();
    });

    test.each([
      {
        description: 'should throw BadRequestException when following itself',
        currentUserId: 'user-123',
        targetUserId: 'user-123',
        seed: () => {
          userRepo.seed([buildUser({ id: 'user-123' })]);
          return Promise.resolve();
        },
        expectedError: BadRequestException,
      },
      {
        description:
          'should throw NotFoundException when target user does not exist',
        currentUserId: 'user-1',
        targetUserId: 'missing-user',
        seed: () => {
          userRepo.seed([buildUser({ id: 'user-1' })]);
          return Promise.resolve();
        },
        expectedError: NotFoundException,
      },
      {
        description:
          'should throw ConflictException when already following target user',
        currentUserId: 'user-1',
        targetUserId: 'user-2',
        seed: async () => {
          userRepo.seed([
            buildUser({ id: 'user-1' }),
            buildUser({ id: 'user-2' }),
          ]);
          await interactionRepo.createFollow('user-1', 'user-2');
        },
        expectedError: ConflictException,
      },
    ])(
      '$description',
      async ({ currentUserId, targetUserId, seed, expectedError }) => {
        await seed();

        await expect(
          service.followUser(currentUserId, targetUserId),
        ).rejects.toBeInstanceOf(expectedError);
      },
    );
  });

  describe('unfollowUser', () => {
    test.each([
      {
        description: 'should remove follow relation when it exists',
        followerId: 'user-1',
        followingId: 'user-2',
        setup: async () => {
          await interactionRepo.createFollow('user-1', 'user-2');
        },
        assert: async (followerId: string, followingId: string) => {
          await service.unfollowUser(followerId, followingId);
          const stored = await interactionRepo.findFollow(
            followerId,
            followingId,
          );
          expect(stored).toBeNull();
        },
      },
      {
        description:
          'should throw NotFoundException when follow relation does not exist',
        followerId: 'user-1',
        followingId: 'user-2',
        setup: () => Promise.resolve(),
        assert: async (followerId: string, followingId: string) => {
          await expect(
            service.unfollowUser(followerId, followingId),
          ).rejects.toBeInstanceOf(NotFoundException);
        },
      },
    ])('$description', async ({ followerId, followingId, setup, assert }) => {
      await setup();
      await assert(followerId, followingId);
    });
  });

  describe('likePost', () => {
    const userId = 'user-like';
    const postId = 'post-like';

    beforeEach(() => {
      postRepo.seedPosts([buildPost({ id: postId })]);
    });

    test.each([
      {
        description: 'should create like when post exists and is not liked yet',
        execute: async () => {
          const result = await service.likePost(userId, postId);

          expect(result).toMatchObject({ userId, postId });

          const stored = await interactionRepo.findLike(userId, postId);
          expect(stored).not.toBeNull();
        },
      },
    ])('$description', async ({ execute }) => {
      await execute();
    });

    test.each([
      {
        description: 'should throw NotFoundException when post does not exist',
        setup: () => {
          postRepo.clear();
          return Promise.resolve();
        },
        likePostId: 'unknown-post',
        expectedError: NotFoundException,
      },
      {
        description: 'should throw ConflictException when like already exists',
        setup: async () => {
          await interactionRepo.createLike(userId, postId);
        },
        likePostId: postId,
        expectedError: ConflictException,
      },
    ])('$description', async ({ setup, likePostId, expectedError }) => {
      await setup();

      await expect(service.likePost(userId, likePostId)).rejects.toBeInstanceOf(
        expectedError,
      );
    });
  });

  describe('unlikePost', () => {
    const userId = 'user-unlike';
    const postId = 'post-unlike';

    test.each([
      {
        description: 'should remove like when it exists',
        setup: async () => {
          await interactionRepo.createLike(userId, postId);
        },
        assert: async () => {
          await service.unlikePost(userId, postId);
          const stored = await interactionRepo.findLike(userId, postId);
          expect(stored).toBeNull();
        },
      },
      {
        description: 'should throw NotFoundException when like does not exist',
        setup: () => Promise.resolve(),
        assert: async () => {
          await expect(
            service.unlikePost(userId, postId),
          ).rejects.toBeInstanceOf(NotFoundException);
        },
      },
    ])('$description', async ({ setup, assert }) => {
      await setup();
      await assert();
    });
  });

  describe('createRepost', () => {
    const userId = 'user-repost';
    const postId = 'post-repost';

    beforeEach(() => {
      postRepo.seedPosts([buildPost({ id: postId })]);
    });

    test.each([
      {
        description:
          'should create repost when post exists and user has not reposted yet',
        execute: async () => {
          const result = await service.createRepost(userId, postId);

          expect(result).toMatchObject({
            userId,
            postId,
          });
          expect(result.createdAt).toBeInstanceOf(Date);
        },
      },
    ])('$description', async ({ execute }) => {
      await execute();
    });

    test.each([
      {
        description: 'should throw NotFoundException when post does not exist',
        setup: () => {
          postRepo.clear();
          return Promise.resolve();
        },
        targetPostId: 'unknown-post',
        expectedError: NotFoundException,
      },
      {
        description:
          'should throw ConflictException when repost already exists for user',
        setup: async () => {
          await interactionRepo.createRepost(userId, postId);
        },
        targetPostId: postId,
        expectedError: ConflictException,
      },
    ])('$description', async ({ setup, targetPostId, expectedError }) => {
      await setup();

      await expect(
        service.createRepost(userId, targetPostId),
      ).rejects.toBeInstanceOf(expectedError);
    });
  });

  describe('deleteRepost', () => {
    const postId = 'post-delete-repost';

    beforeEach(() => {
      postRepo.seedPosts([buildPost({ id: postId })]);
    });

    test.each([
      {
        description: 'should delete repost when it belongs to current user',
        execute: async () => {
          const userId = 'owner-user';
          const repost = await interactionRepo.createRepost(userId, postId);

          await service.deleteRepost(userId, repost.id);

          const stored = await interactionRepo.findRepostById(repost.id);
          expect(stored).toBeNull();
        },
      },
    ])('$description', async ({ execute }) => {
      await execute();
    });

    test.each([
      {
        description:
          'should throw NotFoundException when repost does not exist',
        currentUserId: 'user-1',
        expectedError: NotFoundException,
        resolveRepostId: () => Promise.resolve('missing-repost'),
      },
      {
        description:
          'should throw ForbiddenException when repost belongs to another user',
        currentUserId: 'stranger',
        expectedError: ForbiddenException,
        resolveRepostId: async () => {
          const repost = await interactionRepo.createRepost('owner', postId);
          return repost.id;
        },
      },
    ])(
      '$description',
      async ({ currentUserId, expectedError, resolveRepostId }) => {
        const repostId = await resolveRepostId();

        await expect(
          service.deleteRepost(currentUserId, repostId),
        ).rejects.toBeInstanceOf(expectedError);
      },
    );
  });

  describe('createComment', () => {
    const postId = 'post-comment';

    beforeEach(() => {
      postRepo.seedPosts([buildPost({ id: postId })]);
    });

    test.each([
      {
        description: 'should create comment trimming content and linking user',
        execute: async () => {
          const result = await service.createComment('author-1', {
            postId,
            content: '   Comentário com espaços   ',
          });

          expect(result).toMatchObject({
            postId,
            authorId: 'author-1',
            content: 'Comentário com espaços',
          });
          expect(result.createdAt).toBeInstanceOf(Date);
        },
      },
      {
        description:
          'should create comment replying to another comment within the same post',
        execute: async () => {
          const parentCommentId = 'comment-parent';

          interactionRepo.seedComments([
            {
              id: parentCommentId,
              postId,
              authorId: 'other-user',
              content: 'Comentário original',
            },
          ]);

          const result = await service.createComment('author-2', {
            postId,
            content: 'Resposta ao comentário',
            parentCommentId,
          });

          expect(result.parentId).toBe(parentCommentId);
        },
      },
    ])('$description', async ({ execute }) => {
      await execute();
    });

    test.each([
      {
        description: 'empty string',
        content: '',
      },
      {
        description: 'only whitespace',
        content: '        ',
      },
    ])(
      'should throw BadRequestException when content is $description',
      async ({ content }) => {
        await expect(
          service.createComment('author-1', { postId, content }),
        ).rejects.toBeInstanceOf(BadRequestException);
      },
    );

    test.each([
      {
        description:
          'should throw BadRequestException when content exceeds 280 characters',
        setup: () => Promise.resolve(),
        payload: {
          postId,
          content: 'a'.repeat(281),
        },
        expectedError: BadRequestException,
      },
      {
        description: 'should throw NotFoundException when post does not exist',
        setup: () => {
          postRepo.clear();
          return Promise.resolve();
        },
        payload: {
          postId: 'missing-post',
          content: 'Olá',
        },
        expectedError: NotFoundException,
      },
      {
        description:
          'should throw NotFoundException when parent comment is not found',
        setup: () => Promise.resolve(),
        payload: {
          postId,
          content: 'Olá',
          parentCommentId: 'missing-parent',
        },
        expectedError: NotFoundException,
      },
      {
        description:
          'should throw BadRequestException when parent comment belongs to another post',
        setup: () => {
          postRepo.seedPosts([
            buildPost({ id: postId }),
            buildPost({ id: 'other-post', authorId: 'author-2' }),
          ]);

          interactionRepo.seedComments([
            {
              id: 'comment-different-post',
              postId: 'other-post',
              authorId: 'user-x',
              content: 'Comentário em outro post',
            },
          ]);

          return Promise.resolve();
        },
        payload: {
          postId,
          content: 'Comentário que deveria falhar',
          parentCommentId: 'comment-different-post',
        },
        expectedError: BadRequestException,
      },
    ])('$description', async ({ setup, payload, expectedError }) => {
      await setup();

      await expect(
        service.createComment('author-1', payload),
      ).rejects.toBeInstanceOf(expectedError);
    });
  });

  describe('deleteComment', () => {
    test.each([
      {
        description: 'should delete comment when it belongs to current user',
        execute: async () => {
          const commentId = 'comment-1';

          interactionRepo.seedComments([
            {
              id: commentId,
              postId: 'post-comment',
              authorId: 'author-1',
              content: 'Comentário a ser removido',
            },
          ]);

          await service.deleteComment('author-1', commentId);

          const stored = await interactionRepo.findCommentById(commentId);
          expect(stored).toBeNull();
        },
      },
    ])('$description', async ({ execute }) => {
      await execute();
    });

    test.each([
      {
        description:
          'should throw NotFoundException when comment does not exist',
        commentId: 'missing-comment',
        setup: () => Promise.resolve(),
        expectedError: NotFoundException,
      },
      {
        description:
          'should throw ForbiddenException when comment belongs to another user',
        commentId: 'comment-1',
        setup: () => {
          interactionRepo.seedComments([
            {
              id: 'comment-1',
              postId: 'post-comment',
              authorId: 'other-user',
              content: 'Comentário de outra pessoa',
            },
          ]);
          return Promise.resolve();
        },
        expectedError: ForbiddenException,
      },
    ])('$description', async ({ commentId, setup, expectedError }) => {
      await setup();

      await expect(
        service.deleteComment('author-1', commentId),
      ).rejects.toBeInstanceOf(expectedError);
    });
  });
});
