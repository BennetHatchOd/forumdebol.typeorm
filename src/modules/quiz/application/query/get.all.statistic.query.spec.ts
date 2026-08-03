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
import { CheckAnswerHandler } from '@modules/quiz/application/command/check.answer.usecase';
import 'dotenv/config';
import { testDbConfig } from '../../../../../test/test.db.config';
import { GetGameByIdHandler } from '@modules/quiz/application/query/get.game.by.id.query';
import { GameQueryRepository } from '@modules/quiz/infrastucture/query/game.query.repository';
import {
    GetUserCurrentGameHandler
} from '@modules/quiz/application/query/get.user.current.game.query';
import {
    RegistrationPlayerHandler,
} from '@modules/quiz/application/command/registration.player.usecase';
import {
    CommonGameTestingHelper,
} from '@modules/quiz/application/command/common.game.testing.helper';
import { StatisticsUser } from '@modules/quiz/domain/statistics.user.entity';
import { StatisticsRepository } from '@modules/quiz/infrastucture/statistics.repository';
import { StatisticsQueryRepository } from '@modules/quiz/infrastucture/query/statistics.query.repository';
import { GetAllStatisticHandler, GetAllStatisticQuery } from '@modules/quiz/application/query/get.all.statistic.query';
import { GetAllStatisticsQueryParams } from '@modules/quiz/dto/input/get.all.statistics.query.params';

describe('GetAllStatisticHandler integration (DB)', () => {
    let moduleRef: TestingModule;
    let dataSource: DataSource;
    let checkAnswerHandler: CheckAnswerHandler;
    let registrationPlayerHandler: RegistrationPlayerHandler;
    let getUserCurrentGameHandler: GetUserCurrentGameHandler;
    let getGameByIdHandler: GetGameByIdHandler;
    let getAllStatisticHandler: GetAllStatisticHandler;

    let gameRepo: Repository<Game>;
    let statisticRepo: Repository<StatisticsUser>;
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
                    entities: [
                        Game,
                        PlayingUser,
                        AnsweredQuestion,
                        RoundQuestion,
                        Question,
                        User,
                        StatisticsUser,
                    ],
                    synchronize: true,
                    dropSchema: true,
                    logging: false,
                }),
                TypeOrmModule.forFeature([
                    Game,
                    PlayingUser,
                    AnsweredQuestion,
                    RoundQuestion,
                    Question,
                    User,
                    StatisticsUser,
                ]),
            ],
            providers: [
                CheckAnswerHandler,
                GetAllStatisticHandler,
                GameRepository,
                GetUserCurrentGameHandler,
                GetGameByIdHandler,
                RegistrationPlayerHandler,
                QuestionRepository,
                StatisticsRepository,
                StatisticsQueryRepository,
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
        getAllStatisticHandler = moduleRef.get(GetAllStatisticHandler);

        gameRepo = moduleRef.get(getRepositoryToken(Game));
        statisticRepo = moduleRef.get(getRepositoryToken(StatisticsUser));
        userRepo = moduleRef.get(getRepositoryToken(User));
        questionRepo = moduleRef.get(getRepositoryToken(Question));
        playingUserRepo = moduleRef.get(getRepositoryToken(PlayingUser));
        answeredQuestionRepo = moduleRef.get(getRepositoryToken(AnsweredQuestion));
        roundQuestionRepo = moduleRef.get(getRepositoryToken(RoundQuestion));

        await answeredQuestionRepo.deleteAll();
        await statisticRepo.deleteAll();
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

    it('should create many finished games and receive top statistics', async () => {
        //      wins    draw    loss    score   game    avr
        // u0   3       2       2       23      7       3.28
        // u1   3       5       0       28      8       3.5
        // u2   0       2       5       11      7       1.57
        // u3   6       3       3       37      12      3.08
        // u4   3       2       4       25      9       2.77
        // u5   2       2       3       21      7       3
        const scores = [
            {
                sumScore: 23,
                avgScores: 3.29,
                gamesCount:	7,
                winsCount:	3,
                lossesCount: 2,
                drawsCount:	2,
                player:{
                    id: expect.any(String),
                    login: 'u0'
                }
            },
            {
                sumScore: 28,
                avgScores: 3.5,
                gamesCount:	8,
                winsCount:	3,
                lossesCount: 0,
                drawsCount:	5,
                player:{
                    id: expect.any(String),
                    login: 'u1'
                }
            },
            {
                sumScore: 11,
                avgScores: 1.57,
                gamesCount:	7,
                winsCount:	0,
                lossesCount: 5,
                drawsCount:	2,
                player:{
                    id: expect.any(String),
                    login: 'u2'
                }
            },
            {
                sumScore: 37,
                avgScores: 3.08,
                gamesCount:	12,
                winsCount:	6,
                lossesCount: 3,
                drawsCount:	3,
                player:{
                    id: expect.any(String),
                    login: 'u3'
                }
            },
            {
                sumScore: 25,
                avgScores: 2.78,
                gamesCount:	9,
                winsCount:	3,
                lossesCount: 4,
                drawsCount:	2,
                player:{
                    id: expect.any(String),
                    login: 'u4'
                }
            },
            {
                sumScore: 21,
                avgScores: 3,
                gamesCount:	7,
                winsCount:	2,
                lossesCount: 3,
                drawsCount:	2,
                player:{
                    id: expect.any(String),
                    login: 'u5'
                }
            }
        ];

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

        // Default value : ?sort=avgScores desc&sort=sumScore desc
        let query = new GetAllStatisticsQueryParams();
        query.sort = undefined;
        query.pageSize = 3;
        query.pageNumber = 1;
        let view = await getAllStatisticHandler.execute(
            new GetAllStatisticQuery(query));
        expect(view).toEqual({
            pagesCount: 2,
            page: 1,
            pageSize: 3,
            totalCount: 6,
            items: expect.any(Array),
        });
        expect(view.items[0]).toEqual(scores[1])

        query.sort = [
            'winsCount asc',
            'gamesCount desc',
            'winsCount desc',
            'avgScores asc',
            'avgScores asc'
        ];
        query.pageSize = 2;
        query.pageNumber = 2;
        view = await getAllStatisticHandler.execute(
            new GetAllStatisticQuery(query));
        expect(view).toEqual({
            pagesCount: 3,
            page: 2,
            pageSize: 2,
            totalCount: 6,
            items: expect.any(Array),
        });
        expect(view.items[0]).toEqual(scores[4]);
    //
    //     view = await getAllStatisticHandler.execute(
    //         new GetAllStatisticQuery("4"));
    //     expect(view).toEqual({
    //         sumScore: 37,
    //         avgScores: 3.08,
    //         gamesCount:	12,
    //         winsCount:	6,
    //         lossesCount: 3,
    //         drawsCount:	3});
    //
    //     view = await getAllStatisticHandler.execute(
    //         new GetAllStatisticQuery("6"));
    //     expect(view).toEqual({
    //         sumScore: 21,
    //         avgScores: 3,
    //         gamesCount:	7,
    //         winsCount:	2,
    //         lossesCount: 3,
    //         drawsCount:	2});
    // });
    });
})