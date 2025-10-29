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
    it('should create follow relation when target exists and is different from current user', async () => {
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
    });

    it('should throw BadRequestException when following itself', async () => {
      const userId = 'user-123';
      userRepo.seed([buildUser({ id: userId })]);

      await expect(service.followUser(userId, userId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      const currentUserId = 'user-1';
      userRepo.seed([buildUser({ id: currentUserId })]);

      await expect(
        service.followUser(currentUserId, 'missing-user'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ConflictException when already following target user', async () => {
      const currentUserId = 'user-1';
      const targetUserId = 'user-2';

      userRepo.seed([
        buildUser({ id: currentUserId }),
        buildUser({ id: targetUserId }),
      ]);

      await interactionRepo.createFollow(currentUserId, targetUserId);

      await expect(
        service.followUser(currentUserId, targetUserId),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('unfollowUser', () => {
    it('should remove follow relation when it exists', async () => {
      const followerId = 'user-1';
      const followingId = 'user-2';

      await interactionRepo.createFollow(followerId, followingId);

      await service.unfollowUser(followerId, followingId);

      const stored = await interactionRepo.findFollow(followerId, followingId);
      expect(stored).toBeNull();
    });

    it('should throw NotFoundException when follow relation does not exist', async () => {
      await expect(
        service.unfollowUser('user-1', 'user-2'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('likePost', () => {
    const userId = 'user-like';
    const postId = 'post-like';

    beforeEach(() => {
      postRepo.seedPosts([buildPost({ id: postId })]);
    });

    it('should create like when post exists and is not liked yet', async () => {
      const result = await service.likePost(userId, postId);

      expect(result).toMatchObject({ userId, postId });

      const stored = await interactionRepo.findLike(userId, postId);
      expect(stored).not.toBeNull();
    });

    it('should throw NotFoundException when post does not exist', async () => {
      postRepo.clear();

      await expect(
        service.likePost(userId, 'unknown-post'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ConflictException when like already exists', async () => {
      await interactionRepo.createLike(userId, postId);

      await expect(service.likePost(userId, postId)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('unlikePost', () => {
    const userId = 'user-unlike';
    const postId = 'post-unlike';

    it('should remove like when it exists', async () => {
      await interactionRepo.createLike(userId, postId);

      await service.unlikePost(userId, postId);

      const stored = await interactionRepo.findLike(userId, postId);
      expect(stored).toBeNull();
    });

    it('should throw NotFoundException when like does not exist', async () => {
      await expect(service.unlikePost(userId, postId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('createRepost', () => {
    const userId = 'user-repost';
    const postId = 'post-repost';

    beforeEach(() => {
      postRepo.seedPosts([buildPost({ id: postId })]);
    });

    it('should create repost when post exists and user has not reposted yet', async () => {
      const result = await service.createRepost(userId, postId);

      expect(result).toMatchObject({
        userId,
        postId,
      });
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      postRepo.clear();

      await expect(
        service.createRepost(userId, 'unknown-post'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ConflictException when repost already exists for user', async () => {
      await interactionRepo.createRepost(userId, postId);

      await expect(service.createRepost(userId, postId)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('deleteRepost', () => {
    const postId = 'post-delete-repost';

    beforeEach(() => {
      postRepo.seedPosts([buildPost({ id: postId })]);
    });

    it('should delete repost when it belongs to current user', async () => {
      const userId = 'owner-user';
      const repost = await interactionRepo.createRepost(userId, postId);

      await service.deleteRepost(userId, repost.id);

      const stored = await interactionRepo.findRepostById(repost.id);
      expect(stored).toBeNull();
    });

    it('should throw NotFoundException when repost does not exist', async () => {
      await expect(
        service.deleteRepost('user-1', 'missing-repost'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException when repost belongs to another user', async () => {
      const repost = await interactionRepo.createRepost('owner', postId);

      await expect(
        service.deleteRepost('stranger', repost.id),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('createComment', () => {
    const postId = 'post-comment';

    beforeEach(() => {
      postRepo.seedPosts([buildPost({ id: postId })]);
    });

    it('should create comment trimming content and linking user', async () => {
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
    });

    it('should create comment replying to another comment within the same post', async () => {
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

    it('should throw BadRequestException when content exceeds 280 characters', async () => {
      const longContent = 'a'.repeat(281);

      await expect(
        service.createComment('author-1', { postId, content: longContent }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      postRepo.clear();

      await expect(
        service.createComment('author-1', {
          postId: 'missing-post',
          content: 'Olá',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException when parent comment is not found', async () => {
      await expect(
        service.createComment('author-1', {
          postId,
          content: 'Olá',
          parentCommentId: 'missing-parent',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException when parent comment belongs to another post', async () => {
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

      await expect(
        service.createComment('author-1', {
          postId,
          content: 'Comentário que deveria falhar',
          parentCommentId: 'comment-different-post',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment when it belongs to current user', async () => {
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
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      await expect(
        service.deleteComment('author-1', 'missing-comment'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException when comment belongs to another user', async () => {
      interactionRepo.seedComments([
        {
          id: 'comment-1',
          postId: 'post-comment',
          authorId: 'other-user',
          content: 'Comentário de outra pessoa',
        },
      ]);

      await expect(
        service.deleteComment('author-1', 'comment-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
