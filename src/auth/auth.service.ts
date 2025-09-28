import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from 'src/user/interfaces/user-repository.interface';
import { IdentifierUtil } from '../common/utils/identifier.util';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<{ accessToken: string }> {
    const { identifier, password } = signInDto;
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
