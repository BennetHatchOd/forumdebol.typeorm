import { GetPostsByBlogHandler } from '@modules/blogging.platform/application/queries/get.posts.by.blog';
import {
    GetCommentsByPostHandler,
} from '@modules/blogging.platform/application/queries/get.comments.by.post';

export const QueryHandlers = [
    GetPostsByBlogHandler,
    GetCommentsByPostHandler,
];