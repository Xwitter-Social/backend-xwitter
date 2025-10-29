import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Identificador do post que receberá o comentário',
    example: '0d5c9b90-5e8a-4bb7-9f56-4a8da152a87d',
  })
  @IsUUID('4', { message: 'postId deve ser um UUID válido' })
  postId: string;

  @ApiProperty({
    description: 'Conteúdo do comentário',
    example: 'Concordo com você!',
  })
  @IsString({ message: 'Conteúdo deve ser uma string' })
  @IsNotEmpty({ message: 'Conteúdo não pode ser vazio' })
  content: string;

  @ApiPropertyOptional({
    description: 'Comentário pai caso seja uma resposta',
    example: '5a7c9a12-3b45-4f62-9d1b-12ef567890ab',
  })
  @IsUUID('4', { message: 'parentCommentId deve ser um UUID válido' })
  @IsOptional()
  parentCommentId?: string;
}
