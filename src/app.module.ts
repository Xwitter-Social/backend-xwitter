import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { PostModule } from './post/post.module';
import { InteractionModule } from './interaction/interaction.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PostModule,
    InteractionModule,
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
