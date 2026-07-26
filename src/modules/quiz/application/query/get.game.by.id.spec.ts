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
import { DomainException } from '@core/exceptions/domain.exception';
import { GetGameByIdHandler, GetGameByIdQuery } from '@modules/quiz/application/query/get.game.by.id.query';
import { GameQueryRepository } from '@modules/quiz/infrastucture/query/game.query.repository';
import { StatisticsUser } from '@modules/quiz/domain/statistics.user.entity';

describe('GetGameByIdHandler integration (DB)', () => {
    let moduleRef: TestingModule;
    let dataSource: DataSource;
    let checkAnswerHandler: CheckAnswerHandler;
    let getGameByIdHandler: GetGameByIdHandler;

    let gameRepo: Repository<Game>;
    let userRepo: Repository<User>;
    let questionRepo: Repository<Question>;
    let statisticsRepo: Repository<StatisticsUser>;
    let playingUserRepo: Repository<PlayingUser>;
    let answeredQuestionRepo: Repository<AnsweredQuestion>;
    let roundQuestionRepo: Repository<RoundQuestion>;

    let users: { id: number, login: string, email: string, passwordHash: string}[] = [];
    let questions:{  id: number, body: string, correctAnswers: string[], published: boolean}[] = [];
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
                    entities: [Game, PlayingUser, AnsweredQuestion, RoundQuestion, Question, User, StatisticsUser],
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
                ]),
            ],
            providers: [
                CheckAnswerHandler,
                GameRepository,
                GetGameByIdHandler,
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
        getGameByIdHandler = moduleRef.get(GetGameByIdHandler);

        gameRepo = moduleRef.get(getRepositoryToken(Game));
        statisticsRepo = moduleRef.get(getRepositoryToken(StatisticsUser));
        userRepo = moduleRef.get(getRepositoryToken(User));
        questionRepo = moduleRef.get(getRepositoryToken(Question));
        playingUserRepo = moduleRef.get(getRepositoryToken(PlayingUser));
        answeredQuestionRepo = moduleRef.get(getRepositoryToken(AnsweredQuestion));
        roundQuestionRepo = moduleRef.get(getRepositoryToken(RoundQuestion));
        testHelperFillingArrays(questions,users);
    });

    beforeEach(async () => {
        await answeredQuestionRepo.deleteAll();
        await roundQuestionRepo.deleteAll();
        await playingUserRepo.deleteAll();
        await gameRepo.deleteAll();
        await questionRepo.deleteAll();
        await userRepo.deleteAll();
        await statisticsRepo.deleteAll();
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

    it('should return panding game', async () => {
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
        }

        const view = await getGameByIdHandler.execute(
            new GetGameByIdQuery(game.id.toString(), users[0].id.toString())
        );

        expect(view.id).toBe(game.id.toString());
        expect(view.status).toBe(StatusGame.Active);
        expect(view.firstPlayerProgress.score).toBe(2);
        expect(view.secondPlayerProgress?.score).toBe(2);
    });

    it('should return error if user get not own game', async () => {

        await expect(
             getGameByIdHandler.execute(
            new GetGameByIdQuery(game.id.toString(), users[2].id.toString())))
            .rejects.toBeInstanceOf(DomainException);
    });

});