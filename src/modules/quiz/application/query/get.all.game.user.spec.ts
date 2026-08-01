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
import { GetMyStatisticHandler, GetMyStatisticQuery } from '@modules/quiz/application/query/get.my.statistic.query';
import { StatisticsUser } from '@modules/quiz/domain/statistics.user.entity';
import { GetAllGameUserHandler, GetAllGameUserQuery } from '@modules/quiz/application/query/get.all.game.user.query';
import { GamesSortBy, GetGamesQueryParams } from '@modules/quiz/dto/input/get.games.query.params';
import { StatisticsRepository } from '@modules/quiz/infrastucture/statistics.repository';
import { SortDirection } from '@core/dto/base.query.params.input.dto';

describe('GetAllGameUserHandler integration (DB)', () => {
    let moduleRef: TestingModule;
    let dataSource: DataSource;

    let checkAnswerHandler: CheckAnswerHandler;
    let registrationPlayerHandler: RegistrationPlayerHandler;
    let getUserCurrentGameHandler: GetUserCurrentGameHandler;
    let getGameByIdHandler: GetGameByIdHandler;
    let getAllGameUserHandler: GetAllGameUserHandler;

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
                StatisticsRepository,
                GetAllGameUserHandler,
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
        getAllGameUserHandler = moduleRef.get(GetAllGameUserHandler);

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

    it('should create many finished games and receive them', async () => {

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

        let user = CommonGameTestingHelper.users[0].id.toString();
        let queryString = new GetGamesQueryParams();
        queryString.sortBy = GamesSortBy.FinishGameDate;
        queryString.sortDirection = SortDirection.Desc;
        let view = await getAllGameUserHandler.execute(
            new GetAllGameUserQuery(user,queryString));

        expect(view).toEqual({
         pagesCount: 1,
         page: 1,
         pageSize: 10,
         totalCount: 7,
         items: expect.any(Array),
         });
        expect(view.items.length).toEqual(7);
        expect(view.items[0].firstPlayerProgress.player.id).toBe("4");
        expect(view.items[0].secondPlayerProgress!.player.id).toBe("1");
        expect(view.items[0].firstPlayerProgress.score).toBe(4);
        expect(view.items[0].secondPlayerProgress!.score).toBe(3);

        user = CommonGameTestingHelper.users[3].id.toString();
        queryString = new GetGamesQueryParams();
        queryString.sortBy = GamesSortBy.StartGameDate;
        queryString.sortDirection = SortDirection.Asc;
        queryString.pageNumber = 2;
        queryString.pageSize = 2;
        view = await getAllGameUserHandler.execute(
            new GetAllGameUserQuery(user,queryString));

        expect(view).toEqual({
            pagesCount: 6,
            page: 2,
            pageSize: 2,
            totalCount: 12,
            items: expect.any(Array),
        });
        expect(view.items.length).toEqual(2);

        expect(view.items[0].firstPlayerProgress.player.id).toBe("3")
        expect(view.items[0].secondPlayerProgress!.player.id).toBe("4")
        expect(view.items[0].firstPlayerProgress.score).toBe(0)
        expect(view.items[0].secondPlayerProgress!.score).toBe(4)

        expect(view.items[1].firstPlayerProgress.player.id).toBe("4")
        expect(view.items[1].secondPlayerProgress!.player.id).toBe("5")
        expect(view.items[1].firstPlayerProgress.score).toBe(4)
        expect(view.items[1].secondPlayerProgress!.score).toBe(1)
    //
    //     expect(view).toEqual({
    //         sumScore: 37,
    //         avgScores: 3.08,
    //         gamesCount:	12,
    //         winsCount:	6,
    //         lossesCount: 3,
    //         drawsCount:	3});
    //
    //     view = await getAllGameUserHandler.execute(
    //         new GetAllGameUserQuery("6"));
    //
    //     expect(view).toEqual({
    //         sumScore: 21,
    //         avgScores: 3,
    //         gamesCount:	7,
    //         winsCount:	2,
    //         lossesCount: 3,
    //         drawsCount:	2});
    });

 });