import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Post } from '@prisma/client';
import { CreatePostDto } from './dto';
import {
  CommentWithAuthor,
  IPostRepository,
  PostWithAuthorAndCounts,
} from './interfaces/post-repository.interface';

export interface PostAuthorSummary {
  id: string;
  username: string;
  name: string;
}

export interface CommentTreeNode {
  id: string;
  content: string;
  createdAt: Date;
  author: PostAuthorSummary;
  replies: CommentTreeNode[];
}

export interface TimelinePostDto {
  id: string;
  content: string;
  createdAt: Date;
  author: PostAuthorSummary;
  likeCount: number;
  commentCount: number;
}

export interface PostDetailsDto extends TimelinePostDto {
  comments: CommentTreeNode[];
}

@Injectable()
export class PostService {
  constructor(private readonly postRepo: IPostRepository) {}

  async createPost(
    createPostDto: CreatePostDto,
    authorId: string,
  ): Promise<Post> {
    const trimmedContent = createPostDto.content.trim();

    if (!trimmedContent) {
      throw new BadRequestException('Conteúdo não pode ser vazio.');
    }

    if (trimmedContent.length > 280) {
      throw new BadRequestException(
        'Conteúdo deve ter no máximo 280 caracteres.',
      );
    }

    const data: Prisma.PostCreateInput = {
      content: trimmedContent,
      author: {
        connect: { id: authorId },
      },
    };

    return this.postRepo.create(data);
  }

  async getTimeline(userId: string): Promise<TimelinePostDto[]> {
    const posts = await this.postRepo.getTimelinePosts(userId);

    return posts.map((post) => this.mapPostToTimelineDto(post));
  }

  async searchPosts(query: string): Promise<TimelinePostDto[]> {
    if (!query || !query.trim()) {
      return [];
    }

    const trimmedQuery = query.trim();
    const posts = await this.postRepo.searchPosts(trimmedQuery);

    return posts.map((post) => this.mapPostToTimelineDto(post));
  }

  async getPostDetails(postId: string): Promise<PostDetailsDto> {
    const post = await this.postRepo.getPostWithAuthorAndCounts(postId);

    if (!post) {
      throw new NotFoundException('Post não encontrado.');
    }

    const comments = await this.postRepo.getCommentsByPostId(postId);
    const commentsTree = this.buildCommentTree(comments);

    return {
      ...this.mapPostToTimelineDto(post),
      comments: commentsTree,
    };
  }

  async deletePost(postId: string, currentUserId: string): Promise<Post> {
    const post = await this.postRepo.findById(postId);

    if (!post) {
      throw new NotFoundException('Post não encontrado.');
    }

    if (post.authorId !== currentUserId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este post.',
      );
    }

    return this.postRepo.delete(postId);
  }

  private mapPostToTimelineDto(post: PostWithAuthorAndCounts): TimelinePostDto {
    return {
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      author: post.author,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
    };
  }

  private buildCommentTree(comments: CommentWithAuthor[]): CommentTreeNode[] {
    const commentMap = new Map<string, CommentTreeNode>();

    comments.forEach((comment) => {
      commentMap.set(comment.id, {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.author,
        replies: [],
      });
    });

    const rootComments: CommentTreeNode[] = [];

    comments.forEach((comment) => {
      const node = commentMap.get(comment.id);

      if (!node) {
        return;
      }

      if (comment.parentId) {
        const parentNode = commentMap.get(comment.parentId);

        if (parentNode) {
          parentNode.replies.push(node);
        }
      } else {
        rootComments.push(node);
      }
    });

    const sortTree = (nodes: CommentTreeNode[]) => {
      nodes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      nodes.forEach((node) => sortTree(node.replies));
    };

    sortTree(rootComments);

    return rootComments;
  }
}
