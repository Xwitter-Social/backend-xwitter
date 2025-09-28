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
import { SignInDto, AuthResponseDto } from '../../auth/dto';

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
      description: 'Busca usuários por termo de pesquisa - nome ou username',
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
