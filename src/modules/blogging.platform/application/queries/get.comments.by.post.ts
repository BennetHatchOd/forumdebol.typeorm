import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { GetCommentQueryParams } from '@modules/blogging.platform/dto/input/get.comment.query.params.input.dto';
import { CommentViewDto } from '@modules/blogging.platform/dto/view/comment.view.dto';
import { PostRepository } from '@modules/blogging.platform/infrastucture/post.repository';
import { CommentQueryRepository } from '@modules/blogging.platform/infrastucture/query/comment.query.repository';

export class GetCommentsByPostQuery extends Query<PaginatedViewDto<CommentViewDto>> {
    constructor(
        public readonly user: string,
        public readonly postId: string,
        public readonly query: GetCommentQueryParams,
    ) {
        super();
    }
}
@QueryHandler(GetCommentsByPostQuery)
export class GetCommentsByPostHandler implements IQueryHandler<GetCommentsByPostQuery> {
    constructor(
        private commentQueryRepository: CommentQueryRepository,
        private postRepository: PostRepository
    ) {}

    async execute({user, postId, query}: GetCommentsByPostQuery):Promise<PaginatedViewDto<CommentViewDto>> {


        const post: boolean = await this.postRepository.existsById(postId)
        if(!post)
            throw  new DomainException({
                message: 'post not found',
                code: DomainExceptionCode.NotFound,
            });

        query.setParentPostIdSearchParams(postId);
        const commentPaginator: PaginatedViewDto<CommentViewDto>
            = await this.commentQueryRepository.find(query, user);
        return commentPaginator;
    }
}