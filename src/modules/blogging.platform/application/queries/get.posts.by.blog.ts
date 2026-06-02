import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { PostViewDto } from '@modules/blogging.platform/dto/view/post.view.dto';
import { BlogRepository } from '@modules/blogging.platform/infrastucture/blog.repository';
import { PostQueryRepository } from '@modules/blogging.platform/infrastucture/query/post.query.repository';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { GetPostQueryParams } from '@modules/blogging.platform/dto/input/get.post.query.params.input.dto';
import { isDbId } from '@core/is.db.id';

export class GetPostsByBlogQuery extends Query<PaginatedViewDto<PostViewDto>> {
    constructor(
        public readonly user: string,
        public readonly blogId: string,
        public readonly query: GetPostQueryParams,
        ) {
        super();
    }
}
@QueryHandler(GetPostsByBlogQuery)
export class GetPostsByBlogHandler implements IQueryHandler<GetPostsByBlogQuery> {
    constructor(
        private blogRepository: BlogRepository,
        private postQueryRepository: PostQueryRepository
    ) {}

    async execute({user, blogId, query}: GetPostsByBlogQuery) {
        const idDB = isDbId(blogId);
        if(!idDB)
            throw new DomainException({
                message: 'blog not found',
                code: DomainExceptionCode.NotFound,
            });
        const blog: boolean = await this.blogRepository.existsById(blogId);
        if (!blog)
            throw new DomainException({
                message: 'blog not found',
                code: DomainExceptionCode.NotFound,
            });

        query.setBlogIdSearchParams(blogId);
        const postPaginator: PaginatedViewDto<PostViewDto> =
            await this.postQueryRepository.find(query, user);
        return postPaginator;
    }
}