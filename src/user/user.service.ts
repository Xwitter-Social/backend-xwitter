import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { IdentifierUtil } from '../common/utils/identifier.util';
import * as bcrypt from 'bcrypt';
import { Prisma, User as UserModel } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  private validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Email inválido.');
    }
  }

  private validatePassword(password: string) {
    if (password.length < 8) {
      throw new BadRequestException('Senha deve ter pelo menos 8 caracteres.');
    }
  }

  private validateUsername(username: string) {
    if (!username || username.length < 3) {
      throw new BadRequestException(
        'Nome de usuário deve ter pelo menos 3 caracteres.',
      );
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserModel> {
    // Validações síncronas primeiro
    this.validateEmail(createUserDto.email);
    this.validatePassword(createUserDto.password);
    this.validateUsername(createUserDto.username);

    // Verificações de duplicatas em paralelo
    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepo.findUnique({ email: createUserDto.email }),
      this.userRepo.findUnique({ username: createUserDto.username }),
    ]);

    if (existingEmail) throw new ConflictException('Email já cadastrado.');
    if (existingUsername)
      throw new ConflictException('Nome de usuário já cadastrado.');

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Preparar dados para criação
    const userData: Prisma.UserCreateInput = {
      email: createUserDto.email,
      username: createUserDto.username,
      name: createUserDto.name,
      password: hashedPassword,
      bio: createUserDto.bio,
    };

    return this.userRepo.create(userData);
  }

  async searchUsers(query: string): Promise<UserModel[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    return await this.userRepo.searchUsers(query.trim());
  }

  async getUserByIdentifier(identifier: string): Promise<UserModel> {
    const whereClause = IdentifierUtil.classifyIdentifier(identifier);

    const user = await this.userRepo.findUnique(whereClause);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
  ): Promise<UserModel> {
    // Verifica se o usuário existe
    const user = await this.userRepo.findUnique({ id });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // Verifica se o usuário atual tem permissão para editar este perfil
    if (user.id !== currentUserId) {
      throw new ForbiddenException('Você só pode editar seu próprio perfil.');
    }

    const validationPromises: Promise<void>[] = [];

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      this.validateEmail(updateUserDto.email);
      const emailValidation = async (): Promise<void> => {
        const existingEmail = await this.userRepo.findUnique({
          email: updateUserDto.email!,
        });
        if (existingEmail && existingEmail.id !== id) {
          throw new ConflictException('Email já cadastrado.');
        }
      };
      validationPromises.push(emailValidation());
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      this.validateUsername(updateUserDto.username);
      const usernameValidation = async (): Promise<void> => {
        const existingUsername = await this.userRepo.findUnique({
          username: updateUserDto.username!,
        });
        if (existingUsername && existingUsername.id !== id) {
          throw new ConflictException('Nome de usuário já cadastrado.');
        }
      };
      validationPromises.push(usernameValidation());
    }

    await Promise.all(validationPromises);

    // Preparar dados para update
    const updateData: Prisma.UserUpdateInput = {
      email: updateUserDto.email,
      username: updateUserDto.username,
      name: updateUserDto.name,
      bio: updateUserDto.bio,
    };

    if (updateUserDto.password) {
      this.validatePassword(updateUserDto.password);
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.userRepo.update({ where: { id }, data: updateData });
  }

  async deleteUser(id: string, currentUserId: string): Promise<UserModel> {
    // Verifica se o usuário existe
    const user = await this.userRepo.findUnique({ id });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // Verifica se o usuário atual tem permissão para deletar este perfil
    if (user.id !== currentUserId) {
      throw new ForbiddenException('Você só pode deletar seu próprio perfil.');
    }

    try {
      return await this.userRepo.delete({ id });
    } catch {
      throw new NotFoundException('Usuário não encontrado.');
    }
  }
}
