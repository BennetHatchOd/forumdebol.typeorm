import { MakeLikeHandler} from '@modules/blogging.platform/application/commands/make.like.usecase';
import { DeleteCommentHandler } from '@modules/blogging.platform/application/commands/delete.comment.usecase';
import { EditCommentHandler } from '@modules/blogging.platform/application/commands/edit.comment.usecase';
import { CreateBlogHandler } from '@modules/blogging.platform/application/commands/create.blog.usecase';
import { EditBlogHandler } from '@modules/blogging.platform/application/commands/edit.blog.usecase';
import { DeleteBlogHandler } from '@modules/blogging.platform/application/commands/delete.blog.usecase';
import { CreatePostHandler } from '@modules/blogging.platform/application/commands/create.post.usecase';
import { EditPostHandler } from '@modules/blogging.platform/application/commands/edit.post.usecase';
import { DeletePostHandler } from '@modules/blogging.platform/application/commands/delete.post.usecase';
import { CreateCommentHandler } from '@modules/blogging.platform/application/commands/create.comment.usecase';

export const CommandHandlers = [
    // MakeLikeHandler,
    // CreateCommentHandler,
    // DeleteCommentHandler,
    // EditCommentHandler,
    CreateBlogHandler,
    EditBlogHandler,
    DeleteBlogHandler,
    CreatePostHandler,
    EditPostHandler,
    DeletePostHandler,
];