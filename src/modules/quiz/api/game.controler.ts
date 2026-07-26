import {
    Body, Controller, Get, HttpCode,
    Param, Post, UseGuards,
} from '@nestjs/common';
import { URL_PATH } from '@core/url.path.setting';
import { IdInputDto } from '@core/dto/input/id.Input.Dto';
import { CurrentUserId } from '@core/decorators/current.user';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard } from '@nestjs/passport';
import { GamePairViewDto } from '@modules/quiz/dto/view/game.pair.view.dto';
import { GetUserCurrentGameQuery } from '@modules/quiz/application/query/get.user.current.game.query';
import { GetGameByIdQuery } from '@modules/quiz/application/query/get.game.by.id.query';
import { RegistrationPlayerCommand } from '@modules/quiz/application/command/registration.player.usecase';
import { AnswerInputDto } from '@modules/quiz/dto/input/answer.input.dto';
import { CheckAnswerCommand } from '@modules/quiz/application/command/check.answer.usecase';
import { AnswerViewDto } from '@modules/quiz/dto/view/answer.view.dto';
import { GetAnswerQuery } from '@modules/quiz/application/query/get.answer.query';
import { MyStatisticViewDto } from '@modules/quiz/dto/view/my.statistic.view.dto';
import { GetMyStatisticQuery } from '@modules/quiz/application/query/get.my.statistic.query';

@Controller(URL_PATH.games)
export class GameController {
    constructor(
        private commandBus: CommandBus,
        private queryBus: QueryBus,
    ){}

    @Get('pairs/my-current')
    @UseGuards(AuthGuard('jwt'))
    async myCurrentGame(
        @CurrentUserId() user: string,
        ):Promise<GamePairViewDto> {

        return this.queryBus.execute(new GetUserCurrentGameQuery(user));

    }

    @Get('pairs/:id')
    @UseGuards(AuthGuard('jwt'))
    async getGameById(
        @CurrentUserId() user: string,
        @Param() {id}: IdInputDto,
    ): Promise<GamePairViewDto> {

        return this.queryBus.execute(new GetGameByIdQuery(id, user));
    }

    @Post('pairs/connection')
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    async createGame(
        @CurrentUserId() user: string,
    ): Promise<GamePairViewDto> {

        const gameId = await this.commandBus.execute(new RegistrationPlayerCommand(user));
        return this.queryBus.execute(new GetGameByIdQuery(gameId, user));

    }

    @Get('users/my-statistic')
    @UseGuards(AuthGuard('jwt'))
    async getStatistic(
        @CurrentUserId() user: string,
   ): Promise<MyStatisticViewDto> {

        return this.queryBus.execute(new GetMyStatisticQuery(user));
    }

    @Post('pairs/my-current/answers')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(200)
    async sendAnswer(
        @CurrentUserId() user: string,
        @Body() answer: AnswerInputDto
    ): Promise<AnswerViewDto> {

        const answerId = await this.commandBus.execute(new CheckAnswerCommand(user, answer));
        const view = await this.queryBus.execute(new GetAnswerQuery(answerId));
        return view;
    }
}
