import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from 'src/user/user.repository';
import { IdentifierUtil } from '../common/utils/identifier.util';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(params: {
    identifier: string;
    password: string;
  }): Promise<{ accessToken: string }> {
    const { identifier, password } = params;
    const whereClause = IdentifierUtil.classifyIdentifier(identifier);

    const user = await this.userRepo.findUnique(whereClause);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const payload = { sub: user.id };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
