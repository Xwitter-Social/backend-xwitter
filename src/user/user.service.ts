import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IUserRepository } from './interfaces/user-repository.interface';
import { IdentifierUtil } from '../common/utils/identifier.util';
import * as bcrypt from 'bcrypt';
import { Prisma, User as UserModel } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from './dto';

export type SanitizedUser = Omit<UserModel, 'password'>;

@Injectable()
export class UserService {
  constructor(private readonly userRepo: IUserRepository) {}

  private sanitizeUser(user: UserModel): SanitizedUser {
    const { password: _password, ...safeUser } = user;
    void _password;
    return safeUser;
  }

  private sanitizeUsers(users: UserModel[]): SanitizedUser[] {
    return users.map((user) => this.sanitizeUser(user));
  }

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

  async createUser(createUserDto: CreateUserDto): Promise<SanitizedUser> {
    this.validateEmail(createUserDto.email);
    this.validatePassword(createUserDto.password);
    this.validateUsername(createUserDto.username);

    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepo.findUnique({ email: createUserDto.email }),
      this.userRepo.findUnique({ username: createUserDto.username }),
    ]);

    if (existingEmail) throw new ConflictException('Email já cadastrado.');
    if (existingUsername)
      throw new ConflictException('Nome de usuário já cadastrado.');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const userData: Prisma.UserCreateInput = {
      email: createUserDto.email,
      username: createUserDto.username,
      name: createUserDto.name,
      password: hashedPassword,
      bio: createUserDto.bio,
    };

    const createdUser = await this.userRepo.create(userData);
    return this.sanitizeUser(createdUser);
  }

  async searchUsers(query: string): Promise<SanitizedUser[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const users = await this.userRepo.searchUsers(query.trim());
    return this.sanitizeUsers(users);
  }

  async getUserByIdentifier(identifier: string): Promise<SanitizedUser> {
    const whereClause = IdentifierUtil.classifyIdentifier(identifier);

    const user = await this.userRepo.findUnique(whereClause);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return this.sanitizeUser(user);
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
  ): Promise<SanitizedUser> {
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

    const updatedUser = await this.userRepo.update({
      where: { id },
      data: updateData,
    });
    return this.sanitizeUser(updatedUser);
  }

  async deleteUser(id: string, currentUserId: string): Promise<SanitizedUser> {
    // Verifica se o usuário existe
    const user = await this.userRepo.findUnique({ id });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // Verifica se o usuário atual tem permissão para deletar este perfil
    if (user.id !== currentUserId) {
      throw new ForbiddenException('Você só pode deletar seu próprio perfil.');
    }

    try {
      const deletedUser = await this.userRepo.delete({ id });
      return this.sanitizeUser(deletedUser);
    } catch {
      throw new NotFoundException('Usuário não encontrado.');
    }
  }
}
