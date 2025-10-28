import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostRepository } from './post.repository';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from 'src/auth/auth.module';
import { IPostRepository } from './interfaces/post-repository.interface';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [DatabaseModule, AuthModule, UserModule],
  controllers: [PostController],
  providers: [
    PostService,
    PostRepository,
    {
      provide: IPostRepository,
      useClass: PostRepository,
    },
  ],
  exports: [IPostRepository, PostService],
})
export class PostModule {}
