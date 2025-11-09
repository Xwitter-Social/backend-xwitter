import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@example.com',
    format: 'email',
  })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Formato de email inválido' })
  email: string;

  @ApiProperty({
    description: 'Nome de usuário único',
    example: 'usuario123',
    minLength: 3,
    maxLength: 30,
  })
  @IsNotEmpty({ message: 'Username é obrigatório' })
  @IsString({ message: 'Username deve ser uma string' })
  @MinLength(3, { message: 'Username deve ter pelo menos 3 caracteres' })
  @MaxLength(30, { message: 'Username deve ter no máximo 30 caracteres' })
  username: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'MinhaSenh@123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @Matches(/[A-Z]/, {
    message: 'Senha deve conter pelo menos uma letra maiúscula',
  })
  @Matches(/[a-z]/, {
    message: 'Senha deve conter pelo menos uma letra minúscula',
  })
  @Matches(/[0-9]/, {
    message: 'Senha deve conter pelo menos um número',
  })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Senha deve conter pelo menos um símbolo',
  })
  password: string;

  @ApiProperty({
    description: 'Nome do usuário',
    example: 'João Silva',
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  name: string;

  @ApiProperty({
    description: 'Biografia do usuário',
    example: 'Desenvolvedor apaixonado por tecnologia',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Bio deve ser uma string' })
  @MaxLength(160, { message: 'Bio deve ter no máximo 160 caracteres' })
  bio?: string;
}
