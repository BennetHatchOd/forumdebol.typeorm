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
import { URL_PATH } from '@core/url.path.setting';
import { IdInputDto } from '@core/dto/input/id.Input.Dto';
import { AuthGuard } from '@nestjs/passport';

import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { QuestionInputDto } from '@modules/quiz/dto/input/question.input.dto';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { QuestionViewDto } from '@modules/quiz/dto/view/question.view.dto';
import { PublishQuestionInputDto } from '@modules/quiz/dto/input/publish.question.input.dto';
import { GetQuestionQueryParams } from '@modules/quiz/dto/input/get.question.query.params.input.dto';
import { CreateQuestionCommand } from '@modules/quiz/application/command/create.question.usecase';
import { EditQuestionCommand } from '@modules/quiz/application/command/edit.question.usecase';
import { DeleteQuestionCommand } from '@modules/quiz/application/command/delete.question.usecase';
import { PublishedCommand } from '@modules/quiz/application/command/published.usecase';
import { GetQuestionQuery } from '@modules/quiz/application/query/get.question.query';
import { GetAllQuestionsQuery } from '@modules/quiz/application/query/get.all.questions.query';


@Controller(URL_PATH.questions)
@UseGuards(AuthGuard('basic'))
export class QuestionController {
    constructor(
        private commandBus: CommandBus,
        private queryBus: QueryBus,

    ) {}

    @Get()
    async getAll(
        @Query() query: GetQuestionQueryParams,
    ): Promise<PaginatedViewDto<QuestionViewDto>> {

        return this.queryBus.execute(new GetAllQuestionsQuery(query));
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createQuestion(
        @Body() question: QuestionInputDto): Promise<QuestionViewDto> {
        const id = await this.commandBus.execute(new CreateQuestionCommand(question));
        return this.queryBus.execute(new GetQuestionQuery(id));
    }

    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async editQuestion(
        @Param() {id}: IdInputDto,
        @Body() question: QuestionInputDto,
    ): Promise<void> {
        return this.commandBus.execute(new EditQuestionCommand(id, question));
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteQuestion(
        @Param() {id}: IdInputDto, ): Promise<void> {
        return this.commandBus.execute(new DeleteQuestionCommand(id));
    }

    @Put(':id/publish')
    @HttpCode(HttpStatus.NO_CONTENT)
    async publishQuestion(
        @Param() {id}: IdInputDto,
        @Body() dto: PublishQuestionInputDto,
    ): Promise<void> {

        await this.commandBus.execute(new PublishedCommand(id, dto));
    }

}

