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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'Senha deve ter pelo menos 8 caracteres, incluindo letra maiúscula, minúscula, número e símbolo.',
      );
    }
  }

  private validateUsername(username: string) {
    if (!username || username.length < 3) {
      throw new BadRequestException(
        'Nome de usuário deve ter pelo menos 3 caracteres.',
      );
    }
  }

  private extractStringValue(
    value: string | { set?: string } | undefined,
  ): string | null {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'set' in value && value.set)
      return value.set;
    return null;
  }

  async createUser(data: Prisma.UserCreateInput): Promise<UserModel> {
    // Validações síncronas primeiro
    this.validateEmail(data.email);
    this.validatePassword(data.password);
    this.validateUsername(data.username);

    // Verificações de duplicatas em paralelo
    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepo.findUnique({ email: data.email }),
      this.userRepo.findUnique({ username: data.username }),
    ]);

    if (existingEmail) throw new ConflictException('Email já cadastrado.');
    if (existingUsername)
      throw new ConflictException('Nome de usuário já cadastrado.');

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;

    return this.userRepo.create(data);
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
    data: Prisma.UserUpdateInput,
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

    if (data.email && data.email !== user.email) {
      const emailToValidate = this.extractStringValue(data.email);
      if (emailToValidate) {
        this.validateEmail(emailToValidate);

        const emailValidation = async (): Promise<void> => {
          const existingEmail = await this.userRepo.findUnique({
            email: emailToValidate,
          });
          if (existingEmail && existingEmail.id !== id) {
            throw new ConflictException('Email já cadastrado.');
          }
        };

        validationPromises.push(emailValidation());
      }
    }

    if (data.username && data.username !== user.username) {
      const usernameToValidate = this.extractStringValue(data.username);
      if (usernameToValidate) {
        this.validateUsername(usernameToValidate);

        const usernameValidation = async (): Promise<void> => {
          const existingUsername = await this.userRepo.findUnique({
            username: usernameToValidate,
          });
          if (existingUsername && existingUsername.id !== id) {
            throw new ConflictException('Nome de usuário já cadastrado.');
          }
        };

        validationPromises.push(usernameValidation());
      }
    }

    await Promise.all(validationPromises);

    if (data.password) {
      const passwordToValidate = this.extractStringValue(data.password);
      if (passwordToValidate) {
        this.validatePassword(passwordToValidate);
        data.password = await bcrypt.hash(passwordToValidate, 10);
      }
    }

    return this.userRepo.update({ where: { id }, data });
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
