import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'novoemail@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Formato de email inválido' })
  email?: string;

  @ApiProperty({
    description: 'Nome de usuário único',
    example: 'novousername',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Username deve ser uma string' })
  @MinLength(3, { message: 'Username deve ter pelo menos 3 caracteres' })
  @MaxLength(30, { message: 'Username deve ter no máximo 30 caracteres' })
  username?: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'NovaSenha@123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  password?: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Santos Silva',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome completo deve ser uma string' })
  name?: string;

  @ApiProperty({
    description: 'Biografia do usuário',
    example: 'Desenvolvedor Full Stack apaixonado por inovação',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Bio deve ser uma string' })
  bio?: string;
}
