import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PostService } from './post.service';
import {
  CommentWithAuthor,
  IPostRepository,
  PostWithAuthorAndCounts,
} from './interfaces/post-repository.interface';
import { MockPostRepository } from './mocks/mock-post-repository';

const buildPostWithCounts = (params?: {
  id?: string;
  content?: string;
  authorId?: string;
  createdAt?: Date;
  author?: { id: string; username: string; name: string };
  likeCount?: number;
  commentCount?: number;
}): PostWithAuthorAndCounts => {
  const {
    id = 'post-1',
    content = 'Conteúdo de exemplo',
    authorId = 'author-1',
    createdAt = new Date('2025-01-01T08:00:00.000Z'),
    author = {
      id: authorId,
      username: `${authorId}-username`,
      name: `${authorId}-name`,
    },
    likeCount = 0,
    commentCount = 0,
  } = params || {};

  return {
    id,
    content,
    authorId,
    createdAt,
    author,
    _count: {
      likes: likeCount,
      comments: commentCount,
    },
  };
};

const buildCommentWithAuthor = (params: {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  parentId?: string | null;
  username?: string;
  name?: string;
}): CommentWithAuthor => {
  const {
    id,
    postId,
    authorId,
    content,
    createdAt,
    parentId = null,
    username = `${authorId}-username`,
    name = `${authorId}-name`,
  } = params;

  return {
    id,
    postId,
    authorId,
    content,
    createdAt,
    parentId,
    author: {
      id: authorId,
      username,
      name,
    },
  } as CommentWithAuthor;
};

describe('PostService', () => {
  let service: PostService;
  let repository: MockPostRepository;

  beforeEach(async () => {
    repository = new MockPostRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: IPostRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  afterEach(() => {
    repository.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPost', () => {
    test.each([
      {
        description: 'should create post trimming spaces',
        content: '   Olá, Xwitter!   ',
        expectedContent: 'Olá, Xwitter!',
      },
      {
        description: 'should create post with single space between words',
        content: 'Conteúdo simples',
        expectedContent: 'Conteúdo simples',
      },
      {
        description: 'should create post with maximum length (280 chars)',
        content: 'a'.repeat(280),
        expectedContent: 'a'.repeat(280),
      },
    ])('$description', async ({ content, expectedContent }) => {
      const result = await service.createPost({ content }, 'author-123');

      expect(result).toBeDefined();
      expect(result.content).toBe(expectedContent);
      expect(result.authorId).toBe('author-123');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    test.each([
      {
        description: 'should throw when content is empty',
        content: '',
      },
      {
        description: 'should throw when content has only spaces',
        content: '     ',
      },
      {
        description: 'should throw when content exceeds 280 characters',
        content: 'a'.repeat(281),
      },
    ])('$description', async ({ content }) => {
      await expect(
        service.createPost({ content }, 'author-123'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getTimeline', () => {
    it('should map posts returned by repository to timeline DTOs preserving order', async () => {
      const firstPost = buildPostWithCounts({
        id: 'post-1',
        content: 'Primeiro post',
        createdAt: new Date('2025-01-02T08:00:00.000Z'),
        likeCount: 5,
        commentCount: 2,
      });

      const secondPost = buildPostWithCounts({
        id: 'post-2',
        content: 'Segundo post',
        createdAt: new Date('2025-01-01T12:00:00.000Z'),
        likeCount: 1,
        commentCount: 0,
      });

      repository.seedTimeline('user-1', [firstPost, secondPost]);

      const result = await service.getTimeline('user-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'post-1',
        content: 'Primeiro post',
        likeCount: 5,
        commentCount: 2,
      });
      expect(result[0].author).toMatchObject(firstPost.author);
      expect(result[1]).toMatchObject({
        id: 'post-2',
        content: 'Segundo post',
      });
    });

    it('should return empty array when repository has no posts for user', async () => {
      const result = await service.getTimeline('user-sem-posts');
      expect(result).toEqual([]);
    });
  });

  describe('searchPosts', () => {
    const searchablePosts = [
      buildPostWithCounts({
        id: 'post-201',
        content: 'Atualização de produto lançada hoje',
        createdAt: new Date('2025-03-10T08:00:00.000Z'),
        likeCount: 10,
        commentCount: 2,
      }),
      buildPostWithCounts({
        id: 'post-202',
        content: 'Reflexões sobre produtividade remota',
        createdAt: new Date('2025-03-09T09:30:00.000Z'),
        likeCount: 4,
        commentCount: 1,
      }),
      buildPostWithCounts({
        id: 'post-203',
        content: 'Checklist para lançamento de produto',
        createdAt: new Date('2025-03-08T18:45:00.000Z'),
        likeCount: 7,
        commentCount: 5,
      }),
    ];

    beforeEach(() => {
      repository.seedPostSearch(searchablePosts);
    });

    it('should return posts whose content contains the query fragment', async () => {
      const result = await service.searchPosts('produto');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'post-201',
        content: 'Atualização de produto lançada hoje',
        likeCount: 10,
        commentCount: 2,
      });
      expect(result[1]).toMatchObject({
        id: 'post-203',
        content: 'Checklist para lançamento de produto',
      });
    });

    it('should trim query and ignore casing when searching', async () => {
      const result = await service.searchPosts('   PRODutividade   ');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('post-202');
    });

    test.each(['', '   '])(
      'should return empty array when query is only whitespace: "%s"',
      async (query) => {
        const result = await service.searchPosts(query);
        expect(result).toEqual([]);
      },
    );
  });

  describe('getPostDetails', () => {
    it('should return post details with comment tree', async () => {
      const postId = 'post-42';
      const post = buildPostWithCounts({
        id: postId,
        content: 'Post detalhado',
        likeCount: 7,
        commentCount: 3,
      });

      const rootCommentNewer = buildCommentWithAuthor({
        id: 'comment-2',
        postId,
        authorId: 'author-2',
        content: 'Comentário mais recente',
        createdAt: new Date('2025-01-03T12:00:00.000Z'),
      });

      const rootCommentOlder = buildCommentWithAuthor({
        id: 'comment-1',
        postId,
        authorId: 'author-1',
        content: 'Comentário mais antigo',
        createdAt: new Date('2025-01-02T12:00:00.000Z'),
      });

      const replyComment = buildCommentWithAuthor({
        id: 'comment-3',
        postId,
        authorId: 'author-3',
        content: 'Resposta ao comentário mais antigo',
        createdAt: new Date('2025-01-02T12:30:00.000Z'),
        parentId: 'comment-1',
      });

      repository.seedPostDetails(postId, post, [
        rootCommentOlder,
        replyComment,
        rootCommentNewer,
      ]);

      const result = await service.getPostDetails(postId);

      expect(result).toMatchObject({
        id: postId,
        likeCount: 7,
        commentCount: 3,
        content: 'Post detalhado',
      });

      expect(result.comments).toHaveLength(2);
      expect(result.comments[0].id).toBe('comment-2'); // mais recente primeiro
      expect(result.comments[1].id).toBe('comment-1');
      expect(result.comments[1].replies).toHaveLength(1);
      expect(result.comments[1].replies[0].id).toBe('comment-3');
    });

    it('should throw NotFoundException when post does not exist', async () => {
      await expect(
        service.getPostDetails('post-inexistente'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deletePost', () => {
    const existingPost = {
      id: 'post-99',
      content: 'Post para deletar',
      authorId: 'author-99',
      createdAt: new Date('2025-01-01T10:00:00.000Z'),
    };

    beforeEach(() => {
      repository.seedPosts([existingPost]);
    });

    it('should delete post when current user is the author', async () => {
      const result = await service.deletePost('post-99', 'author-99');

      expect(result).toMatchObject(existingPost);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      await repository.delete('post-99');

      await expect(
        service.deletePost('post-99', 'author-99'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException when current user is not the author', async () => {
      await expect(
        service.deletePost('post-99', 'other-author'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
