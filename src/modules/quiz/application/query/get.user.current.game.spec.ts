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
import { StatusGame } from '@modules/quiz/dto/type/status.game.enum';
import { CheckAnswerCommand, CheckAnswerHandler } from '@modules/quiz/application/command/check.answer.usecase';
import 'dotenv/config';
import { testDbConfig } from '../../../../../test/test.db.config';
import { testHelperFillingArrays } from '@modules/quiz/application/test.helper.filling.arrays';
import { testHelperFillingDb } from '@modules/quiz/application/test.helper.filling.db';
import { GameQueryRepository } from '@modules/quiz/infrastucture/query/game.query.repository';
import {
    GetUserCurrentGameHandler,
    GetUserCurrentGameQuery,
} from '@modules/quiz/application/query/get.user.current.game.query';
import { GamePairViewDto } from '@modules/quiz/dto/view/game.pair.view.dto';
import { StatisticsUser } from '@modules/quiz/domain/statistics.user.entity';

describe('GetUserCurrentGameHandler integration (DB)', () => {
    let moduleRef: TestingModule;
    let dataSource: DataSource;
    let checkAnswerHandler: CheckAnswerHandler;
    let getUserCurrentGameHandler: GetUserCurrentGameHandler;

    let gameRepo: Repository<Game>;
    let statisticRepo: Repository<StatisticsUser>;
    let userRepo: Repository<User>;
    let questionRepo: Repository<Question>;
    let playingUserRepo: Repository<PlayingUser>;
    let answeredQuestionRepo: Repository<AnsweredQuestion>;
    let roundQuestionRepo: Repository<RoundQuestion>;

    let users: { id: number, login: string, email: string, passwordHash: string}[] = [];
    let questions:{ id: number, body: string, correctAnswers: string[], published: boolean}[] = [];
    let game: Game;

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
                }),
                TypeOrmModule.forFeature([
                    Game,
                    PlayingUser,
                    AnsweredQuestion,
                    RoundQuestion,
                    Question,
                    User,
                    StatisticsUser,
                ],),
            ],
            providers: [
                CheckAnswerHandler,
                GameRepository,
                GetUserCurrentGameHandler,
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
        getUserCurrentGameHandler = moduleRef.get(GetUserCurrentGameHandler);

        gameRepo = moduleRef.get(getRepositoryToken(Game));
        statisticRepo = moduleRef.get(getRepositoryToken(StatisticsUser));
        userRepo = moduleRef.get(getRepositoryToken(User));
        questionRepo = moduleRef.get(getRepositoryToken(Question));
        playingUserRepo = moduleRef.get(getRepositoryToken(PlayingUser));
        answeredQuestionRepo = moduleRef.get(getRepositoryToken(AnsweredQuestion));
        roundQuestionRepo = moduleRef.get(getRepositoryToken(RoundQuestion));
        testHelperFillingArrays(questions,users);
    });

    beforeEach(async () => {
        await answeredQuestionRepo.deleteAll();
        await statisticRepo.deleteAll();
        await roundQuestionRepo.deleteAll();
        await playingUserRepo.deleteAll();
        await gameRepo.deleteAll();
        await questionRepo.deleteAll();
        await userRepo.deleteAll();
        await testHelperFillingDb(questions,users,userRepo,questionRepo);
        const questionsRound: Question[] =
            await questionRepo
                .createQueryBuilder('question')
                .orderBy('id')
                .where({published: true})
                .take(5)
                .getMany();

        game = new Game();
        game.status = StatusGame.Active;
        const playingUser = PlayingUser.create(+users[0], game);
        game.playingUsers = [
            PlayingUser.create(users[0].id, game),
            PlayingUser.create(users[1].id, game)];
        game.answeredQuestion = [];
        game.roundQuestion = [];
        for (const question of questionsRound) {
            game.roundQuestion.push(RoundQuestion.create(question, game));
        }

        await gameRepo.save(game);
    });

    afterAll(async () => {
        await dataSource.destroy();
        await moduleRef.close();
    });

    it('should return active game', async () => {
        let view1: GamePairViewDto = await getUserCurrentGameHandler.execute(
            new GetUserCurrentGameQuery(users[0].id.toString()));
        let view2 = await getUserCurrentGameHandler.execute(
            new GetUserCurrentGameQuery(users[1].id.toString()));

        expect(view1.id).toBe(game.id.toString());
        expect(view1.status).toBe(StatusGame.Active);
        expect(view2.id).toBe(game.id.toString());
        expect(view2.status).toBe(StatusGame.Active);

        const order =   [0, 1,  1,  0,  0,  1,  0,  1,  0];
        const correct = [1, 1,  0,  0,  1,  0,  0,  1,  0];
        let numberQuestionPlayer1 = 0;
        let numberQuestionPlayer2 = 0;
        let number: number;
        for (let i = 0; i < order.length; i++) {
            const player: number = order[i];
            if (player === order[0]) {
                number = numberQuestionPlayer1;
                numberQuestionPlayer1++;
            } else {
                number = numberQuestionPlayer2;
                numberQuestionPlayer2++;
            }
            const answer: string
                = correct[i] ? questions[number].correctAnswers[0] : 'hcf';
            await checkAnswerHandler.execute(
                new CheckAnswerCommand(users[player].id.toString(), {
                    answer: answer,
                }),
            );
            view1 = await getUserCurrentGameHandler.execute(
                new GetUserCurrentGameQuery(users[0].id.toString()));
            view2 = await getUserCurrentGameHandler.execute(
                new GetUserCurrentGameQuery(users[1].id.toString()));

            expect(view1.id).toBe(game.id.toString());
            expect(view1.status).toBe(StatusGame.Active);
            expect(view2.id).toBe(game.id.toString());
            expect(view2.status).toBe(StatusGame.Active);

        }
        //
        // view = await getUserCurrentGameHandler.execute(
        //     new GetUserCurrentGameQuery(users[0].id.toString())
        // );
        //
        // expect(view.id).toBe(game.id.toString());
        // expect(view.status).toBe(StatusGame.Active);
        // expect(view.firstPlayerProgress.score).toBe(2);
        // expect(view.secondPlayerProgress?.score).toBe(3);
    });

    // it('shouldn\'t calculated the final score at the end of the game.', async () => {
    //     const order =   [0, 1,  1,  0,  0,  1,  0,  1,  0,  1];
    //     const correct = [0, 1,  0,  0,  0,  0,  0,  1,  0,  0];
    //     let numberQuestionPlayer1 = 0;
    //     let numberQuestionPlayer2 = 0;
    //     let number: number;
    //     for (let i = 0; i < 10; i++) {
    //         const player: number = order[i];
    //         if (player === 0) {
    //             number = numberQuestionPlayer1;
    //             numberQuestionPlayer1++;
    //         } else {
    //             number = numberQuestionPlayer2;
    //             numberQuestionPlayer2++;
    //         }
    //         const answer: string
    //             = correct[i] ? questions[number].correctAnswers[0] : 'hcf';
    //         await checkAnswerHandler.execute(
    //             new CheckAnswerCommand(users[player].id.toString(), {
    //                 answer: answer,
    //             }),
    //         );
    //     }
    //     const savedGame = await gameRepo.findOne({
    //         where: { id: game.id },
    //         relations: {
    //             playingUsers: { user: true },
    //             answeredQuestion: true,
    //             roundQuestion: { question: true },
    //         },
    //     });
    //
    //     const updatedPlayer0
    //         = savedGame!.playingUsers.find(p => p.user.id === users[0].id);
    //     const updatedPlayer1
    //         = savedGame!.playingUsers.find(p => p.user.id === users[1].id);
    //     expect(savedGame?.status).toBe(StatusGame.Finished);
    //     expect(updatedPlayer0!.score).toBe(0);
    //     expect(updatedPlayer1!.score).toBe(2);
    // });
});