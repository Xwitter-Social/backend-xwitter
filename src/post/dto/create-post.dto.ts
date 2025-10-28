import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: 'Conteúdo do post',
    example: 'Hoje estou trabalhando em um novo recurso para o Xwitter!',
    maxLength: 280,
  })
  @IsString({ message: 'Conteúdo deve ser uma string' })
  @IsNotEmpty({ message: 'Conteúdo não pode ser vazio' })
  @MaxLength(280, {
    message: 'Conteúdo deve ter no máximo 280 caracteres',
  })
  content: string;
}
