import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query, UseGuards,
} from '@nestjs/common';
import { BlogQueryRepository } from '../infrastucture/query/blog.query.repository';
import { BlogViewDto } from '../dto/view/blog.view.dto';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { GetBlogQueryParams } from '../dto/input/get.blog.query.params.input.dto';
import { BlogInputDto } from '../dto/input/blog.input.dto';
import { PostQueryRepository } from '../infrastucture/query/post.query.repository';
import { PostViewDto } from '../dto/view/post.view.dto';
import { PostInputDto } from '../dto/input/post.input.dto';
import { PostByBlogInputDto } from '../dto/input/post.by.blog.input.dto';
import { URL_PATH } from '@core/url.path.setting';
import { IdInputDto } from '@core/dto/input/id.Input.Dto';
import { AuthGuard } from '@nestjs/passport';
import { ReadUserIdGuard } from '@core/guards/read.userid';
import { PostParamsIdInputDto } from '@core/dto/input/post.params.id.input.dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '@modules/blogging.platform/application/commands/create.blog.usecase';
import { EditBlogCommand } from '@modules/blogging.platform/application/commands/edit.blog.usecase';
import { DeleteBlogCommand } from '@modules/blogging.platform/application/commands/delete.blog.usecase';
import { CreatePostCommand } from '@modules/blogging.platform/application/commands/create.post.usecase';
import { EditPostCommand } from '@modules/blogging.platform/application/commands/edit.post.usecase';
import { DeletePostCommand } from '@modules/blogging.platform/application/commands/delete.post.usecase';
import { GetPostQueryParams } from '@modules/blogging.platform/dto/input/get.post.query.params.input.dto';


@Controller(URL_PATH.blogsAdmin)
@UseGuards(AuthGuard('basic'))
export class BlogAdminController {
    constructor(
        private commandBus: CommandBus,
        private blogQueryRepository: BlogQueryRepository,
        private postQueryRepository: PostQueryRepository,
    ) {}

    @Get()
    async getAll(
        @Query() query: GetBlogQueryParams,
    ): Promise<PaginatedViewDto<BlogViewDto>> {
        const blogPaginator: PaginatedViewDto<BlogViewDto> =
            await this.blogQueryRepository.find(query);

        return blogPaginator;
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createBlog(
        @Body() blog: BlogInputDto): Promise<BlogViewDto> {
        //
        // Create new blog
        const createId: string = await this.commandBus.execute(new CreateBlogCommand(blog));
        const blogView: BlogViewDto =
            await this.blogQueryRepository.findById(createId);
        return blogView;
    }

    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async correctBlog(
        @Param() {id}: IdInputDto,
        @Body() blog: BlogInputDto,
    ): Promise<void> {
        //
        // Update existing Blog by id with InputModel

        return await this.commandBus.execute(new EditBlogCommand(id, blog));
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteBlog(
        @Param() {id}: IdInputDto, ): Promise<void> {
        //
        // Delete blog specified by id

        return await this.commandBus.execute(new DeleteBlogCommand(id));
    }

    @Post(':id/posts')
    @HttpCode(HttpStatus.CREATED)
    async createPostByBlog(
        @Param() {id}: IdInputDto,
        @Body() dto: PostByBlogInputDto,
    ): Promise<PostViewDto> {
        // Create new post for specific blog
        const createDto: PostInputDto = { ...dto, blogId: id };
        const createId: string = await this.commandBus.execute(new CreatePostCommand(createDto));
        const postView: PostViewDto =
            await this.postQueryRepository.findByIdForView(createId, null);
        return postView;
    }

    @Get(':id/posts')
    @UseGuards(ReadUserIdGuard)
    async getPostByBlog(
        @Param() {id}: IdInputDto,
        @Query() query: GetPostQueryParams,
    ): Promise<PaginatedViewDto<PostViewDto>> {
        //
        // Returns all posts for specified blog
        query.setBlogIdSearchParams(id);

        const postPaginator: PaginatedViewDto<PostViewDto> =
            await this.postQueryRepository.find(query, null);
        return postPaginator;
    }

    @Put(':blogId/posts/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async correctPost(
        @Param() dto: PostParamsIdInputDto,
        @Body() post: PostByBlogInputDto
    ): Promise<void>{
        //
        // Update existing Post by id with InputModel

        return await this.commandBus.execute(new EditPostCommand(dto, post));
    }

    @Delete(':blogId/posts/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deletePost(
        @Param() dto: PostParamsIdInputDto
    ): Promise<void>{
        // Delete post specified by id
        return await this.commandBus.execute(new DeletePostCommand(dto));
    }

}

