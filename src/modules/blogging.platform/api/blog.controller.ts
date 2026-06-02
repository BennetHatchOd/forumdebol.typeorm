import {
    Controller,
    Get,
    Param,
    Query, UseGuards,
} from '@nestjs/common';
import { BlogQueryRepository } from '../infrastucture/query/blog.query.repository';
import { BlogViewDto } from '../dto/view/blog.view.dto';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { GetBlogQueryParams } from '../dto/input/get.blog.query.params.input.dto';
import { PostViewDto } from '../dto/view/post.view.dto';
import { URL_PATH } from '@core/url.path.setting';
import { IdInputDto } from '@core/dto/input/id.Input.Dto';
import { CurrentUserId } from '@core/decorators/current.user';
import { ReadUserIdGuard } from '@core/guards/read.userid';
import { QueryBus } from '@nestjs/cqrs';
import { GetPostsByBlogQuery } from '@modules/blogging.platform/application/queries/get.posts.by.blog';
import { GetPostQueryParams } from '@modules/blogging.platform/dto/input/get.post.query.params.input.dto';


@Controller(URL_PATH.blogs)
export class BlogController {
    constructor(
        private blogQueryRepository: BlogQueryRepository,
        private queryBus: QueryBus,
    ) {}

    @Get()
    async getAll(
        @Query() query: GetBlogQueryParams,
    ): Promise<PaginatedViewDto<BlogViewDto>> {
        const blogPaginator: PaginatedViewDto<BlogViewDto> =
            await this.blogQueryRepository.find(query);

        return blogPaginator;
    }

    @Get(':id/posts')
    @UseGuards(ReadUserIdGuard)
    async getPostByBlog(
        @CurrentUserId() user: string,
        @Param() {id}: IdInputDto,
        @Query() query: GetPostQueryParams,
    ): Promise<PaginatedViewDto<PostViewDto>> {

        return await this.queryBus.execute(new GetPostsByBlogQuery(user, id, query));
    }

    @Get(':id')
    async getById(@Param() {id}: IdInputDto): Promise<BlogViewDto> {
        //
        // Returns blog by id

        const foundBlog: BlogViewDto =
            await this.blogQueryRepository.findById(id);
        return foundBlog;
    }

}

