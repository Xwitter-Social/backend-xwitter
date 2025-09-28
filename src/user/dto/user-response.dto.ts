import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome de usuário único',
    example: 'joaosilva',
  })
  username: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Biografia do usuário',
    example: 'Desenvolvedor apaixonado por tecnologia',
    required: false,
  })
  bio?: string;

  @ApiProperty({
    description: 'Data de criação da conta',
    example: '2023-08-30T18:31:32.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2023-08-30T19:45:12.000Z',
  })
  updatedAt: Date;
}
