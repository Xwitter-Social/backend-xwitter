import { Module } from '@nestjs/common';
import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';
import { InteractionRepository } from './interaction.repository';
import { IInteractionRepository } from './interfaces/interaction-repository.interface';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { PostModule } from 'src/post/post.module';

@Module({
  imports: [DatabaseModule, AuthModule, UserModule, PostModule],
  controllers: [InteractionController],
  providers: [
    InteractionService,
    InteractionRepository,
    {
      provide: IInteractionRepository,
      useClass: InteractionRepository,
    },
  ],
  exports: [InteractionService, IInteractionRepository],
})
export class InteractionModule {}
