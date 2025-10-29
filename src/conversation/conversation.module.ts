import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { ConversationRepository } from './conversation.repository';
import { IConversationRepository } from './interfaces/conversation-repository.interface';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [DatabaseModule, AuthModule, UserModule],
  controllers: [ConversationController],
  providers: [
    ConversationService,
    ConversationRepository,
    {
      provide: IConversationRepository,
      useClass: ConversationRepository,
    },
  ],
  exports: [ConversationService, IConversationRepository],
})
export class ConversationModule {}
