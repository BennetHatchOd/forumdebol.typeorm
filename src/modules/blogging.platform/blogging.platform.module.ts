import { Module } from '@nestjs/common';
import { BlogAdminController } from './api/blog.admin.controller';
import { BlogQueryRepository } from './infrastucture/query/blog.query.repository';
import { BlogRepository } from './infrastucture/blog.repository';
import { PostRepository } from './infrastucture/post.repository';
import { PostQueryRepository } from './infrastucture/query/post.query.repository';
import { CommentController } from './api/comment.controller';
import { CommentQueryRepository } from './infrastucture/query/comment.query.repository';
import { CommentRepository } from './infrastucture/comment.repository';
import { PostController } from './api/post.controler';
import { CqrsModule } from '@nestjs/cqrs';
import { LikeRepository } from '@modules/blogging.platform/infrastucture/like.repository';
import { AuthModule } from '@core/auth.module';
import { ReadUserIdGuard } from '@core/guards/read.userid';
import { BlogController } from '@modules/blogging.platform/api/blog.controller';
import { QueryHandlers } from '@modules/blogging.platform/application/queries';
import { CommandHandlers } from '@modules/blogging.platform/application/commands';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from '@modules/blogging.platform/domain/blog.entity';
import { Post } from '@modules/blogging.platform/domain/post.entity';

@Module({
    imports: [
        CqrsModule,
        AuthModule,
        TypeOrmModule.forFeature([Blog, Post]),
    ],
    controllers: [
        BlogAdminController,
        BlogController,
        PostController,
        // CommentController
        ],
    providers: [
        ...CommandHandlers,
        ...QueryHandlers,
        ReadUserIdGuard,
        BlogQueryRepository,
        BlogRepository,
        PostQueryRepository,
        PostRepository,
        // CommentQueryRepository,
        // CommentRepository,
        // LikeRepository,
    ],
})
export class BloggingPlatformModule {}
