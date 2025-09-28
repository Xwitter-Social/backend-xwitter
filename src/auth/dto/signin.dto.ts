/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    description: 'Email, username ou ID do usuário',
    example: 'usuario@example.com',
  })
  @IsNotEmpty({ message: 'Identificador é obrigatório' })
  @IsString({ message: 'Identificador deve ser uma string' })
  identifier: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'MinhaSenh@123',
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser uma string' })
  password: string;
}
