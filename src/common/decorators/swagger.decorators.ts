import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../../user/dto';
import {
  CreatePostDto,
  PostDetailsResponseDto,
  PostResponseDto,
  TimelinePostResponseDto,
  RepostTimelineResponseDto,
} from '../../post/dto';
import { SignInDto, AuthResponseDto } from '../../auth/dto';
import {
  CreateCommentDto,
  CommentResponseDto,
  MessageResponseDto,
  RepostResponseDto,
} from '../../interaction/dto';
import {
  StartConversationDto,
  ConversationDetailsDto,
  ConversationSummaryDto,
  ConversationMessageDto,
  SendMessageDto,
} from '../../conversation/dto';

export const ApiSignIn = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Login de usuário',
      description:
        'Autentica um usuário usando email/username e senha, retorna um token JWT',
    }),
    ApiBody({
      type: SignInDto,
      description: 'Dados de login do usuário',
    }),
    ApiResponse({
      status: 200,
      description: 'Login realizado com sucesso',
      type: AuthResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Credenciais inválidas',
    }),
  );

export const ApiCreateUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Criar novo usuário',
      description: 'Registra um novo usuário na plataforma',
    }),
    ApiBody({
      type: CreateUserDto,
      description: 'Dados do novo usuário',
    }),
    ApiResponse({
      status: 201,
      description: 'Usuário criado com sucesso',
      type: UserResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos',
    }),
    ApiResponse({
      status: 409,
      description: 'Email ou username já cadastrado',
    }),
  );

export const ApiGetAllUsers = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Listar usuários',
      description:
        'Busca usuários cujo username ou nome contém o termo informado',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Termo de busca para username ou nome',
      example: 'joão',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de usuários encontrados',
      type: [UserResponseDto],
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
  );

export const ApiGetCurrentUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obter perfil próprio',
      description: 'Retorna os dados do usuário autenticado',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiResponse({
      status: 200,
      description: 'Dados do usuário atual',
      type: UserResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
  );

export const ApiGetUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Buscar usuário por ID, email ou username',
      description: 'Retorna os dados de um usuário específico',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiResponse({
      status: 200,
      description: 'Usuário encontrado',
      type: UserResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuário não encontrado',
    }),
  );

export const ApiGetUserFollowers = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Listar seguidores do usuário',
      description: 'Retorna os usuários que seguem o usuário informado',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'ID do usuário',
      example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de seguidores',
      type: UserResponseDto,
      isArray: true,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuário não encontrado',
    }),
  );

export const ApiGetUserFollowing = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Listar usuários seguidos',
      description: 'Retorna os usuários que o usuário informado está seguindo',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'ID do usuário',
      example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de usuários seguidos',
      type: UserResponseDto,
      isArray: true,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuário não encontrado',
    }),
  );

export const ApiUpdateUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Atualizar perfil',
      description:
        'Atualiza os dados do próprio perfil (apenas o proprietário)',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'ID do usuário',
      example: 1,
    }),
    ApiBody({
      type: UpdateUserDto,
      description: 'Dados a serem atualizados',
    }),
    ApiResponse({
      status: 200,
      description: 'Perfil atualizado com sucesso',
      type: UserResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 403,
      description: 'Sem permissão para editar este perfil',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuário não encontrado',
    }),
    ApiResponse({
      status: 409,
      description: 'Email ou username já cadastrado por outro usuário',
    }),
  );

export const ApiDeleteUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Excluir conta',
      description: 'Exclui a própria conta (apenas o proprietário)',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'ID do usuário',
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Conta excluída com sucesso',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Usuário excluído com sucesso.',
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 403,
      description: 'Sem permissão para excluir esta conta',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuário não encontrado',
    }),
  );

export const ApiCreatePost = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Criar novo post',
      description: 'Cria um novo post para o usuário autenticado',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiBody({
      type: CreatePostDto,
      description: 'Dados do post a ser criado',
    }),
    ApiResponse({
      status: 201,
      description: 'Post criado com sucesso',
      type: PostResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos ou conteúdo vazio/excedido',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
  );

export const ApiGetTimeline = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obter timeline do usuário',
      description:
        'Retorna posts do usuário autenticado e de quem ele segue, ordenados do mais recente para o mais antigo',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiResponse({
      status: 200,
      description: 'Lista de posts da timeline',
      type: TimelinePostResponseDto,
      isArray: true,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
  );

export const ApiGetUserPosts = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Listar posts de um usuário',
      description:
        'Retorna posts criados por um usuário específico, do mais recente para o mais antigo',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'userId',
      description: 'ID do usuário',
      example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de posts de autoria do usuário',
      type: TimelinePostResponseDto,
      isArray: true,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuário não encontrado',
    }),
  );

export const ApiGetUserReposts = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Listar reposts de um usuário',
      description:
        'Retorna posts que o usuário repostou, ordenados pela data em que o repost foi realizado',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'userId',
      description: 'ID do usuário',
      example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de reposts do usuário',
      type: RepostTimelineResponseDto,
      isArray: true,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuário não encontrado',
    }),
  );

export const ApiSearchPosts = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Buscar posts',
      description: 'Busca posts cujo conteúdo contém o termo informado',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiQuery({
      name: 'search',
      required: true,
      description: 'Trecho a ser procurado no conteúdo dos posts',
      example: 'lançamento',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de posts encontrados',
      type: TimelinePostResponseDto,
      isArray: true,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
  );

export const ApiGetPostDetails = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obter detalhes de um post',
      description:
        'Retorna os detalhes de um post, incluindo autor, contagens e árvore de comentários',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'ID do post',
      example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
    }),
    ApiResponse({
      status: 200,
      description: 'Post encontrado com sucesso',
      type: PostDetailsResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Post não encontrado',
    }),
  );

export const ApiDeletePost = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Excluir post',
      description: 'Remove um post criado pelo usuário autenticado',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'ID do post',
      example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
    }),
    ApiResponse({
      status: 200,
      description: 'Post excluído com sucesso',
      type: PostResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 403,
      description: 'Sem permissão para excluir este post',
    }),
    ApiResponse({
      status: 404,
      description: 'Post não encontrado',
    }),
  );

export const ApiFollowUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Seguir usuário',
      description:
        'Permite que o usuário autenticado siga outro usuário informado pelo ID.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'targetUserId',
      description: 'ID do usuário que será seguido',
      example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
    }),
    ApiResponse({
      status: 201,
      description: 'Usuário seguido com sucesso',
      type: MessageResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Tentativa de seguir a si mesmo',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuário alvo não encontrado',
    }),
    ApiResponse({
      status: 409,
      description: 'Usuário já seguido anteriormente',
    }),
  );

export const ApiUnfollowUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Deixar de seguir usuário',
      description:
        'Remove a relação de follow entre o usuário autenticado e o usuário informado.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'targetUserId',
      description: 'ID do usuário que deixará de ser seguido',
      example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
    }),
    ApiResponse({
      status: 204,
      description: 'Relação de follow removida com sucesso',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Relação de follow não encontrada',
    }),
  );

export const ApiLikePost = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Curtir post',
      description: 'Registra uma curtida do usuário autenticado em um post.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'postId',
      description: 'ID do post que receberá a curtida',
      example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
    }),
    ApiResponse({
      status: 201,
      description: 'Post curtido com sucesso',
      type: MessageResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Post não encontrado',
    }),
    ApiResponse({
      status: 409,
      description: 'Post já foi curtido anteriormente',
    }),
  );

export const ApiUnlikePost = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Remover curtida de post',
      description:
        'Remove a curtida do usuário autenticado em relação ao post informado.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'postId',
      description: 'ID do post cuja curtida será removida',
      example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
    }),
    ApiResponse({
      status: 204,
      description: 'Curtida removida com sucesso',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Curtida não encontrada',
    }),
  );

export const ApiCreateRepost = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Criar repost',
      description:
        'Cria um repost do conteúdo indicado para o usuário autenticado.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'postId',
      description: 'ID do post que será repostado',
      example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
    }),
    ApiResponse({
      status: 201,
      description: 'Repost criado com sucesso',
      type: RepostResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Post não encontrado',
    }),
    ApiResponse({
      status: 409,
      description: 'Repost já existente para este usuário',
    }),
  );

export const ApiDeleteRepost = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Excluir repost',
      description: 'Remove um repost criado pelo usuário autenticado.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'repostId',
      description: 'ID do repost que será removido',
      example: '9f8e7d6c-5b4a-3f2e-1d0c-abcdef123456',
    }),
    ApiResponse({
      status: 204,
      description: 'Repost removido com sucesso',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 403,
      description: 'Usuário não possui permissão para remover este repost',
    }),
    ApiResponse({
      status: 404,
      description: 'Repost não encontrado',
    }),
  );

export const ApiCreateComment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Criar comentário',
      description:
        'Adiciona um comentário a um post, permitindo respostas encadeadas.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiBody({
      type: CreateCommentDto,
      description: 'Dados necessários para criar o comentário',
    }),
    ApiResponse({
      status: 201,
      description: 'Comentário criado com sucesso',
      type: CommentResponseDto,
    }),
    ApiResponse({
      status: 400,
      description:
        'Conteúdo inválido ou comentário pai pertencente a outro post',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Post ou comentário pai não encontrado',
    }),
  );

export const ApiDeleteComment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Excluir comentário',
      description: 'Remove um comentário criado pelo usuário autenticado.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'commentId',
      description: 'ID do comentário que será excluído',
      example: '5a7c9a12-3b45-4f62-9d1b-12ef567890ab',
    }),
    ApiResponse({
      status: 204,
      description: 'Comentário removido com sucesso',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 403,
      description: 'Usuário não possui permissão para excluir este comentário',
    }),
    ApiResponse({
      status: 404,
      description: 'Comentário não encontrado',
    }),
  );

export const ApiStartConversation = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Iniciar ou recuperar conversa',
      description:
        'Inicia uma nova conversa privada com outro usuário ou retorna a existente.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiBody({
      type: StartConversationDto,
      description:
        'Identificador do usuário com quem a conversa deve ser iniciada',
    }),
    ApiResponse({
      status: 201,
      description: 'Conversa criada ou recuperada com sucesso',
      type: ConversationDetailsDto,
    }),
    ApiResponse({
      status: 400,
      description:
        'Tentativa de iniciar conversa consigo mesmo ou dados inválidos',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuário destinatário não encontrado',
    }),
  );

export const ApiGetMyConversations = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Listar conversas do usuário',
      description:
        'Retorna as conversas privadas do usuário autenticado, incluindo última mensagem.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiResponse({
      status: 200,
      description: 'Lista de conversas recuperada com sucesso',
      type: ConversationSummaryDto,
      isArray: true,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
  );

export const ApiGetConversationMessages = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Listar mensagens da conversa',
      description:
        'Retorna todas as mensagens trocadas na conversa informada, ordenadas da mais antiga para a mais recente.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'conversationId',
      description: 'ID da conversa cujas mensagens serão listadas',
      example: 'conversation-123',
    }),
    ApiResponse({
      status: 200,
      description: 'Mensagens recuperadas com sucesso',
      type: ConversationMessageDto,
      isArray: true,
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 403,
      description: 'Usuário não participa desta conversa',
    }),
    ApiResponse({
      status: 404,
      description: 'Conversa não encontrada',
    }),
  );

export const ApiSendConversationMessage = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Enviar mensagem em conversa',
      description:
        'Registra uma nova mensagem na conversa informada, desde que o usuário seja participante.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'conversationId',
      description: 'ID da conversa que receberá a mensagem',
      example: 'conversation-123',
    }),
    ApiBody({
      type: SendMessageDto,
      description: 'Conteúdo da mensagem a ser enviada',
    }),
    ApiResponse({
      status: 201,
      description: 'Mensagem enviada com sucesso',
      type: ConversationMessageDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Conteúdo inválido para mensagem',
    }),
    ApiResponse({
      status: 401,
      description: 'Token de acesso inválido ou expirado',
    }),
    ApiResponse({
      status: 403,
      description: 'Usuário não participa desta conversa',
    }),
    ApiResponse({
      status: 404,
      description: 'Conversa não encontrada',
    }),
  );
