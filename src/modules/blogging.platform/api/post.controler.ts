import {
    Body,
    Controller,
    Get, HttpCode, HttpStatus,
    Param, Post, Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { PostViewDto } from '../dto/view/post.view.dto';
import { CommentQueryRepository } from '../infrastucture/query/comment.query.repository';
import { PostQueryRepository } from '../infrastucture/query/post.query.repository';
import { URL_PATH } from '@core/url.path.setting';
import { IdInputDto } from '@core/dto/input/id.Input.Dto';
import { CurrentUserId } from '@core/decorators/current.user';
import { ReadUserIdGuard } from '@core/guards/read.userid';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard } from '@nestjs/passport';
import { CommentViewDto } from '@modules/blogging.platform/dto/view/comment.view.dto';
import { CommentInputDto } from '@modules/blogging.platform/dto/input/comment.input.dto';
import { CreateCommentCommand } from '@modules/blogging.platform/application/commands/create.comment.usecase';
import { LikeInputDto } from '@modules/blogging.platform/dto/input/like.input.dto';
import { LikeCreateDto } from '@modules/blogging.platform/dto/create/like.create.dto';
import { LikeTarget } from '@modules/blogging.platform/dto/enum/like.target.enum';
import { MakeLikeCommand } from '@modules/blogging.platform/application/commands/make.like.usecase';
import { GetCommentsByPostQuery } from '@modules/blogging.platform/application/queries/get.comments.by.post';
import { GetCommentQueryParams } from '../dto/input/get.comment.query.params.input.dto';
import { GetPostQueryParams } from '@modules/blogging.platform/dto/input/get.post.query.params.input.dto';
import { CreateCommentDto } from '@modules/blogging.platform/dto/create/create.comment.dto';

@Controller(URL_PATH.posts)
export class PostController {
    constructor(
        private postQueryRepository: PostQueryRepository,
        private commandBus: CommandBus,
        private queryBus: QueryBus,
        private commentQueryRepository: CommentQueryRepository,
    ){}

    @Put(':id/like-status')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard('jwt'))
    async setLikeStatus(
        @CurrentUserId() user: string,
        @Param() {id}: IdInputDto,
        @Body() likeStatus: LikeInputDto,
    ) {

        const createLike: LikeCreateDto = {
            targetId: id,
            userId: user,
            status: likeStatus.likeStatus,
            targetType: LikeTarget.Post,
        };

        await this.commandBus.execute(new MakeLikeCommand(createLike));
    }

    @Get(':id/comments')
    @UseGuards(ReadUserIdGuard)
    async getCommentsByPost(
        @CurrentUserId() user: string,
        @Param() {id}: IdInputDto,
        @Query() query: GetCommentQueryParams
    ): Promise<PaginatedViewDto<CommentViewDto>> {
        // Returns all comments for specified post, if the post isn't found,
        // return "not found"

        return await this.queryBus.execute( new GetCommentsByPostQuery(user, id, query));
    }

    @Post(':id/comments')
    @UseGuards(AuthGuard('jwt'))
    async createCommentByPost(
        @CurrentUserId() user: string,
        @Param() {id}: IdInputDto,
        @Body() comment: CommentInputDto
    ): Promise<CommentViewDto> {
        // Create comment for specified post, if the post isn't found,
        // throw the exception "not found"

        const create: CreateCommentDto ={
            postId: id,
            content: comment.content,
            userId: user,
        }
        const createdComment: string = await this.commandBus.execute(new CreateCommentCommand(create));
        return this.commentQueryRepository.findByIdWithCheck(createdComment, user);

    }

    @Get()
    @UseGuards(ReadUserIdGuard)
    async getAll(
        @Query() query: GetPostQueryParams,
        @CurrentUserId() user: string,
    ): Promise<PaginatedViewDto<PostViewDto>> {

        const postPaginator: PaginatedViewDto<PostViewDto>
            = await this.postQueryRepository.find(query, user);
        return postPaginator;
    }

    @Get(':id')
    @UseGuards(ReadUserIdGuard)
    async getById(
        @Param() {id}: IdInputDto,
        @CurrentUserId() user: string,
    ):Promise<PostViewDto>{
        //
        // Returns post by id


        const foundPost: PostViewDto = await this.postQueryRepository.findByIdWithCheck(id, user);
        return foundPost;
    }
}