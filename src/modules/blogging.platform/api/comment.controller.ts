import {
    Body,
    Controller, Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Put,
    UseGuards,
} from '@nestjs/common';
import { CommentViewDto } from '../dto/view/comment.view.dto';
import { CommentQueryRepository } from '../infrastucture/query/comment.query.repository';
import { URL_PATH } from '@core/url.path.setting';
import { IdInputDto } from '@core/dto/input/id.Input.Dto';
import { CurrentUserId } from '@core/decorators/current.user';
import { AuthGuard } from '@nestjs/passport';
import { LikeCreateDto } from '@modules/blogging.platform/dto/create/like.create.dto';
import { CommandBus } from '@nestjs/cqrs';
import { MakeLikeCommand } from '@modules/blogging.platform/application/commands/make.like.usecase';
import { LikeTarget } from '@modules/blogging.platform/dto/enum/like.target.enum';
import { LikeInputDto } from '@modules/blogging.platform/dto/input/like.input.dto';
import { ReadUserIdGuard } from '@core/guards/read.userid';
import { DeleteCommentCommand } from '@modules/blogging.platform/application/commands/delete.comment.usecase';
import { ModifyCommentDto } from '@modules/blogging.platform/dto/modify.comment.dto';
import { CommentInputDto } from '@modules/blogging.platform/dto/input/comment.input.dto';
import { EditCommentDto } from '@modules/blogging.platform/dto/edit.comment.dto';
import { EditCommentCommand } from '@modules/blogging.platform/application/commands/edit.comment.usecase';

@Controller(URL_PATH.comments)
export class CommentController {
    constructor(
        private commandBus: CommandBus,
        private commentQueryRepository: CommentQueryRepository,
    ) {}

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
            targetType: LikeTarget.Comment,
        };

        await this.commandBus.execute(new MakeLikeCommand(createLike));
        return;
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.NO_CONTENT)
    async editComment(
        @Body() commentInput:CommentInputDto,
        @CurrentUserId() user: string,
        @Param() { id }: IdInputDto,
    ) {
        const editDto: EditCommentDto = {
            userId: user,
            targetId: id,
            content: commentInput.content
        };
        await this.commandBus.execute(new EditCommentCommand(editDto));
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteComment(
        @CurrentUserId() user: string,
        @Param() { id }: IdInputDto,
    ): Promise<void> {
        const deleteDto: ModifyCommentDto = {
            userId: user,
            targetId: id,
        };
        await this.commandBus.execute(new DeleteCommentCommand(deleteDto));
        return ;
    }

    @Get(':id')
    @UseGuards(ReadUserIdGuard)
    async getById(
        @CurrentUserId() user: string,
        @Param() { id }: IdInputDto,
    ): Promise<CommentViewDto> {
        //
        // Returns comment by id

        const foundComment: CommentViewDto =
            await this.commentQueryRepository.findByIdWithCheck(id, user);
        return foundComment;
    }
}