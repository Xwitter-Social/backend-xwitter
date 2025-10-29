import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Xwitter API')
    .setDescription('API para o Xwitter - Rede Social')
    .setVersion('1.0')
    .addTag('auth', 'Autenticação de usuários')
    .addTag('users', 'Gerenciamento de usuários')
    .addTag(
      'interaction',
      'Interações sociais: follow, like, repost e comentários',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // Este nome será usado nos decorators
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Mantém o token após refresh
    },
  });

  await app.listen(process.env.PORT ?? 3001);

  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT ?? 3001}`,
  );
  console.log(
    `📖 Swagger docs available at: http://localhost:${process.env.PORT ?? 3001}/docs`,
  );
}

bootstrap().catch((error) => {
  console.error('Error during startup:', error);
  process.exit(1);
});
