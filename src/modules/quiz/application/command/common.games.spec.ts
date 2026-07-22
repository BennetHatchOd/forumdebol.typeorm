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
    GetUserCurrentGameHandler,
} from '@modules/quiz/application/query/get.user.current.game.query';
import {
    RegistrationPlayerHandler,
} from '@modules/quiz/application/command/registration.player.usecase';
import {
    CommonGameTestingHelper,
} from '@modules/quiz/application/command/common.game.testing.helper';

describe('Command- and Query- Handlers integration (DB)', () => {
    let moduleRef: TestingModule;
    let dataSource: DataSource;
    let checkAnswerHandler: CheckAnswerHandler;
    let registrationPlayerHandler: RegistrationPlayerHandler;
    let getUserCurrentGameHandler: GetUserCurrentGameHandler;
    let getGameByIdHandler: GetGameByIdHandler;

    let gameRepo: Repository<Game>;
    let userRepo: Repository<User>;
    let questionRepo: Repository<Question>;
    let playingUserRepo: Repository<PlayingUser>;
    let answeredQuestionRepo: Repository<AnsweredQuestion>;
    let roundQuestionRepo: Repository<RoundQuestion>;

    let users: { id: number, login: string, email: string, passwordHash: string}[] = [];
    let questions:{ id: number,  body: string, correctAnswers: string[], published: boolean}[] = [];
    let game: Game;
    let game23_1, game42_2, game03_3, game16_4, game51_5;

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

        const order =   [0, 1,  1,  0,  0,  1,  0,  1,  0, 1];
        const correct = [1, 1,  0,  0,  1,  0,  0,  1,  0, 0];

        game23_1 = new CommonGameTestingHelper(2,3,
            checkAnswerHandler, registrationPlayerHandler,
            getUserCurrentGameHandler,getGameByIdHandler, userRepo, questionRepo);

        await game23_1.initialization();
        await game23_1.step(order,correct);
        const view = await game23_1.getView();
        expect(view.firstPlayerProgress.score).toBe(3)
        expect(view.secondPlayerProgress!.score).toBe(2)

    });

    it('should create second game ', async () => {

        game42_2 = new CommonGameTestingHelper(4,2,
            checkAnswerHandler, registrationPlayerHandler,
            getUserCurrentGameHandler,getGameByIdHandler, userRepo, questionRepo);

        await game42_2.initialization();
        const view = await game42_2.getView();

    });
    it('should create third game', async () => {

        const order =   [0];
        const correct = [1];

        game03_3 = new CommonGameTestingHelper(0,3,
            checkAnswerHandler, registrationPlayerHandler,
            getUserCurrentGameHandler,getGameByIdHandler, userRepo, questionRepo);

        await game03_3.initialization();
        await game03_3.step(order,correct);
        const view = await game03_3.getView();

    });
    it('should create fourth game and finish it', async () => {

        const order =   [0, 1,  1,  0,  0,  1,  0,  1,  1, 0];
        const correct = [1, 1,  1,  0,  1,  1,  0,  1,  1, 0];

        game16_4 = new CommonGameTestingHelper(1,6,
            checkAnswerHandler, registrationPlayerHandler,
            getUserCurrentGameHandler,getGameByIdHandler, userRepo, questionRepo);

        await game16_4.initialization();
        await game16_4.step(order,correct);
        const view = await game16_4.getView();
        expect(view.firstPlayerProgress.score).toBe(2)
        expect(view.secondPlayerProgress!.score).toBe(6)

    });
    it('should create fifth game', async () => {

        const order =   [1, 1,  1,  0];
        const correct = [1, 1,  0,  0];

        game51_5 = new CommonGameTestingHelper(5,1,
            checkAnswerHandler, registrationPlayerHandler,
            getUserCurrentGameHandler,getGameByIdHandler, userRepo, questionRepo);

        await game51_5.initialization();
        await game51_5.step(order,correct);
        const view = await game51_5.getView();
        expect(view.firstPlayerProgress.score).toBe(0)
        expect(view.secondPlayerProgress!.score).toBe(2)

    });

    it('should play second and third games', async () => {

        const order =   [1, 1,  1,  0];
        const correct = [1, 1,  0,  0];
        await game42_2.step(order,correct);
        await game03_3.step(order,correct);

        // const view = await game51_5.getView();
        // expect(view.firstPlayerProgress.score).toBe(0)
        // expect(view.secondPlayerProgress!.score).toBe(2)

    });

});