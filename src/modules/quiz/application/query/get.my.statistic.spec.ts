import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { GameRepository } from '@modules/quiz/infrastucture/game.repository';
import { QuestionRepository } from '@modules/quiz/infrastucture/question.repository';

import { Game } from '@modules/quiz/domain/game.entity';
import { PlayingUser } from '@modules/quiz/domain/playing.user.entity';
import { AnsweredQuestion } from '@modules/quiz/domain/answered.question.entity';
import { RoundQuestion } from '@modules/quiz/domain/round.question.entity';
import { Question } from '@modules/quiz/domain/question.entity';
import { User } from '@modules/users-system/domain/user.entity';

import { UserConfig } from '@modules/users-system/config/user.config';
import { CheckAnswerCommand, CheckAnswerHandler } from '@modules/quiz/application/command/check.answer.usecase';
import 'dotenv/config';
import { testDbConfig } from '../../../../../test/test.db.config';
import { testHelperFillingArrays } from '@modules/quiz/application/test.helper.filling.arrays';
import { testHelperFillingDb } from '@modules/quiz/application/test.helper.filling.db';
import { GetGameByIdHandler } from '@modules/quiz/application/query/get.game.by.id.query';
import { GameQueryRepository } from '@modules/quiz/infrastucture/query/game.query.repository';
import {
    GetUserCurrentGameHandler, GetUserCurrentGameQuery,
} from '@modules/quiz/application/query/get.user.current.game.query';
import {
    RegistrationPlayerHandler,
} from '@modules/quiz/application/command/registration.player.usecase';
import {
    CommonGameTestingHelper,
} from '@modules/quiz/application/command/common.game.testing.helper';
import { GetMyStatisticHandler, GetMyStatisticQuery } from '@modules/quiz/application/query/get.my.statistic.query';

describe('GetMyStatisticHandler integration (DB)', () => {
    let moduleRef: TestingModule;
    let dataSource: DataSource;
    let checkAnswerHandler: CheckAnswerHandler;
    let registrationPlayerHandler: RegistrationPlayerHandler;
    let getUserCurrentGameHandler: GetUserCurrentGameHandler;
    let getGameByIdHandler: GetGameByIdHandler;
    let getMyStatisticHandler: GetMyStatisticHandler;

    let gameRepo: Repository<Game>;
    let userRepo: Repository<User>;
    let questionRepo: Repository<Question>;
    let playingUserRepo: Repository<PlayingUser>;
    let answeredQuestionRepo: Repository<AnsweredQuestion>;
    let roundQuestionRepo: Repository<RoundQuestion>;

    let game;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: testDbConfig.host,
                    port: testDbConfig.port,
                    username: testDbConfig.username,
                    password: testDbConfig.password,
                    database: testDbConfig.database,
                    entities: [Game, PlayingUser, AnsweredQuestion, RoundQuestion, Question, User],
                    synchronize: true,
                    dropSchema: true,
                    logging: true,
                }),
                TypeOrmModule.forFeature([
                    Game,
                    PlayingUser,
                    AnsweredQuestion,
                    RoundQuestion,
                    Question,
                    User,
                ]),
            ],
            providers: [
                CheckAnswerHandler,
                GetMyStatisticHandler,
                GameRepository,
                GetUserCurrentGameHandler,
                GetGameByIdHandler,
                RegistrationPlayerHandler,
                QuestionRepository,
                GameQueryRepository,
                {
                    provide: UserConfig,
                    useValue: {
                        quizQuestion: 5,
                    },
                },
            ],
        }).compile();

        dataSource = moduleRef.get(DataSource);

        checkAnswerHandler = moduleRef.get(CheckAnswerHandler);
        registrationPlayerHandler = moduleRef.get(RegistrationPlayerHandler);
        getUserCurrentGameHandler = moduleRef.get(GetUserCurrentGameHandler);
        getGameByIdHandler = moduleRef.get(GetGameByIdHandler);
        getMyStatisticHandler = moduleRef.get(GetMyStatisticHandler);

        gameRepo = moduleRef.get(getRepositoryToken(Game));
        userRepo = moduleRef.get(getRepositoryToken(User));
        questionRepo = moduleRef.get(getRepositoryToken(Question));
        playingUserRepo = moduleRef.get(getRepositoryToken(PlayingUser));
        answeredQuestionRepo = moduleRef.get(getRepositoryToken(AnsweredQuestion));
        roundQuestionRepo = moduleRef.get(getRepositoryToken(RoundQuestion));

        await answeredQuestionRepo.deleteAll();
        await roundQuestionRepo.deleteAll();
        await playingUserRepo.deleteAll();
        await gameRepo.deleteAll();
        await questionRepo.deleteAll();
        await userRepo.deleteAll();
    });

    beforeEach(async () => {

       });

    afterAll(async () => {
        await dataSource.destroy();
        await moduleRef.close();
    });

    it('should create first game and finished it', async () => {

        const order =
            [0, 1,  0,  0,  0,  1,  1,  1,  0, 1];
        const correct = [
            [1, 1,  0,  1,  0,  0,  0,  0,  1, 0], //  111+1  1 4-1
            [0, 0,  1,  0,  1,  0,  1,  1,  0, 1], //  11+1    111 3-3
            [1, 1,  0,  1,  1,  1,  0,  1,  0, 1], //  111+1   1111 4-4
            [1, 1,  1,  1,  0,  1,  1,  0,  0, 0], //  111+1    111  4-3
            [0, 1,  0,  0,  0,  0,  1,  1,  0, 1], //           1111 0-4
            [1, 0,  1,  0,  0,  0,  0,  1,  1, 0]]; //  111+1    1 4-1
        const players =[
            [1,3], [4,2], [3,4], [5,6], [3,4], [4,5],
            [1,3], [2,1], [5,3], [1,6], [5,4], [4,6],
            [2,5], [2,6], [2,1], [6,5], [3,4], [6,1],
            [2,3], [2,6], [5,4], [4,1], [4,5], [5,4],
            [2,4]]

        for(let i = 0; i < players.length;i++) {
            game = new CommonGameTestingHelper(players[i][0], players[i][1],
                checkAnswerHandler, registrationPlayerHandler,
                getUserCurrentGameHandler, getGameByIdHandler, userRepo, questionRepo);
            await game.initialization();
            await game.step(order, correct[i % correct.length]);
        }
        let view = await getMyStatisticHandler.execute(
            new GetMyStatisticQuery("1"));

        expect(view).toEqual({
            sumScore: 23,
            avgScores: 3.29,
            gamesCount:	7,
            winsCount:	3,
            lossesCount: 2,
            drawsCount:	2});
        view = await getMyStatisticHandler.execute(
            new GetMyStatisticQuery("4"));

        expect(view).toEqual({
            sumScore: 37,
            avgScores: 3.08,
            gamesCount:	12,
            winsCount:	6,
            lossesCount: 3,
            drawsCount:	3});

        view = await getMyStatisticHandler.execute(
            new GetMyStatisticQuery("6"));

        expect(view).toEqual({
            sumScore: 21,
            avgScores: 3,
            gamesCount:	7,
            winsCount:	2,
            lossesCount: 3,
            drawsCount:	2});
    });

 });