import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
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

  async getUsers(page?: number, limit?: number): Promise<UserModel[]> {
    // Se não for fornecido paginação, retorna todos
    if (!page || !limit) {
      return this.userRepo.findAll();
    }

    // Com paginação (para implementar no repository depois)
    return this.userRepo.findAll();
  }

  async getUser(where: Prisma.UserWhereUniqueInput): Promise<UserModel> {
    const user = await this.userRepo.findUnique(where);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }

  async updateUser(
    id: number,
    data: Prisma.UserUpdateInput,
  ): Promise<UserModel> {
    // Busca o usuário uma única vez
    const user = await this.userRepo.findUnique({ id });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // Validações e verificações de duplicatas em paralelo
    const validationPromises: Promise<void>[] = [];

    if (data.email && data.email !== user.email) {
      const emailToValidate = this.extractStringValue(data.email);
      if (emailToValidate) {
        this.validateEmail(emailToValidate);
        validationPromises.push(
          this.userRepo
            .findUnique({
              email: emailToValidate,
            })
            .then((existingEmail) => {
              if (existingEmail && existingEmail.id !== id) {
                throw new ConflictException('Email já cadastrado.');
              }
            }),
        );
      }
    }

    if (data.username && data.username !== user.username) {
      const usernameToValidate = this.extractStringValue(data.username);
      if (usernameToValidate) {
        this.validateUsername(usernameToValidate);
        validationPromises.push(
          this.userRepo
            .findUnique({
              username: usernameToValidate,
            })
            .then((existingUsername) => {
              if (existingUsername && existingUsername.id !== id) {
                throw new ConflictException('Nome de usuário já cadastrado.');
              }
            }),
        );
      }
    }

    if (data.password) {
      const passwordToValidate = this.extractStringValue(data.password);
      if (passwordToValidate) {
        this.validatePassword(passwordToValidate);
        data.password = await bcrypt.hash(passwordToValidate, 10);
      }
    }
    await Promise.all(validationPromises);

    return this.userRepo.update({ where: { id }, data });
  }

  async deleteUser(id: number): Promise<UserModel> {
    try {
      return await this.userRepo.delete({ id });
    } catch {
      throw new NotFoundException('Usuário não encontrado.');
    }
  }
}
