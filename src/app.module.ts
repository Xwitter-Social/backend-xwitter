import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { PostModule } from './post/post.module';
import { InteractionModule } from './interaction/interaction.module';
import { ConversationModule } from './conversation/conversation.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PostModule,
    InteractionModule,
    ConversationModule,
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
