import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { QuizRepository } from '@modules/quiz/infrastucture/quiz.repository';
import { QuestionRepository } from '@modules/quiz/infrastucture/question.repository';

import { Game } from '@modules/quiz/domain/game.entity';
import { PlayingUser } from '@modules/quiz/domain/playing.user.entity';
import { AnsweredQuestion } from '@modules/quiz/domain/answered.question.entity';
import { RoundQuestion } from '@modules/quiz/domain/round.question.entity';
import { Question } from '@modules/quiz/domain/question.entity';
import { User } from '@modules/users-system/domain/user.entity';

import { UserConfig } from '@modules/users-system/config/user.config';
import { StatusGame } from '@modules/quiz/dto/type/status.game.type';
import { CheckAnswerCommand, CheckAnswerHandler } from '@modules/quiz/application/command/check.answer.usecase';
import 'dotenv/config';
import { testDbConfig } from '../../../../../test/test.db.config';
import { testHelperFillingArrays } from '@modules/quiz/application/command/test.helper.filling.arrays';
import { testHelperFillingDb } from '@modules/quiz/application/command/test.helper.filling.db';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { RegistrationPlayerCommand } from '@modules/quiz/application/command/registration.player.usecase';

describe('CheckAnswerHandler integration (DB)', () => {
    let moduleRef: TestingModule;
    let dataSource: DataSource;
    let handler: CheckAnswerHandler;

    let gameRepo: Repository<Game>;
    let userRepo: Repository<User>;
    let questionRepo: Repository<Question>;
    let playingUserRepo: Repository<PlayingUser>;
    let answeredQuestionRepo: Repository<AnsweredQuestion>;
    let roundQuestionRepo: Repository<RoundQuestion>;

    let users: { id: number, login: string, email: string, passwordHash: string}[] = [];
    let questions:{ body: string, correctAnswers: string[], published: boolean}[] = [];
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
                QuizRepository,
                QuestionRepository,
                {
                    provide: UserConfig,
                    useValue: {
                        quizQuestion: 5,
                    },
                },
            ],
        }).compile();

        dataSource = moduleRef.get(DataSource);
        handler = moduleRef.get(CheckAnswerHandler);

        gameRepo = moduleRef.get(getRepositoryToken(Game));
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

    it('should persist answered question and increment score for correct answer', async () => {

        await handler.execute(
            new CheckAnswerCommand(users[0].id.toString(), {
                answer: questions[0].correctAnswers[2],
            }),
        );

        const savedAnswers = await answeredQuestionRepo.find({
            relations: {
                game: true,
                user: true,
                question: true,
            },
        });

        const savedGame = await gameRepo.findOne({
            where: { id: game.id },
            relations: {
                playingUsers: { user: true },
                answeredQuestion: true,
                roundQuestion: { question: true },
            },
        });

        expect(savedAnswers).toHaveLength(1);
        expect(savedAnswers[0].isCorrect).toBe(true);
        expect(savedAnswers[0].answer).toBe(questions[0].correctAnswers[2]);
        expect(savedAnswers[0].user.id).toBe(users[0].id);

        const updatedPlayer
            = savedGame!.playingUsers.find(p => p.user.id === users[0].id);
        expect(updatedPlayer!.numberQuestion).toBe(1);
        expect(updatedPlayer!.score).toBe(1);
    });

    it('should persist answered question and not be changed for an incorrect answer', async () => {

        await handler.execute(
            new CheckAnswerCommand(users[1].id.toString(), {
                answer: 'jhg',
            }),
        );

        const savedAnswers = await answeredQuestionRepo.find({
            relations: {
                game: true,
                user: true,
                question: true,
            },
        });

        const savedGame = await gameRepo.findOne({
            where: { id: game.id },
            relations: {
                playingUsers: { user: true },
                answeredQuestion: true,
                roundQuestion: { question: true },
            },
        });

        expect(savedAnswers).toHaveLength(1);
        expect(savedAnswers[0].isCorrect).toBe(false);
        expect(savedAnswers[0].answer).toBe('jhg');
        expect(savedAnswers[0].user.id).toBe(users[1].id);

        const updatedPlayer
            = savedGame!.playingUsers.find(p => p.user.id === users[1].id);
        expect(updatedPlayer!.numberQuestion).toBe(1);
        expect(updatedPlayer!.score).toBe(0);
    });


    it('should calculated the final score at the end of the game.', async () => {
        const order =   [0, 1,  1,  0,  0,  1,  0,  1,  0,  1];
        const correct = [1, 1,  0,  0,  1,  0,  0,  1,  0,  0];
        let numberQuestionPlayer1 = 0;
        let numberQuestionPlayer2 = 0;
        let number: number;
        for (let i = 0; i < 10; i++) {
            const player: number = order[i];
            if (player === 0) {
                number: number = numberQuestionPlayer1;
                numberQuestionPlayer1++;
            } else {
                number: number = numberQuestionPlayer2;
                numberQuestionPlayer2++;
            }
            const answer: string
                 = correct[i] ? questions[number].correctAnswers[0] : 'hcf';
            await handler.execute(
                new CheckAnswerCommand(users[player].id.toString(), {
                    answer: answer,
                }),
            );
        }
        await expect(
            handler.execute(
                new CheckAnswerCommand(users[0].id.toString(), {
                    answer: 'gfff'})))
            .rejects.toBeInstanceOf(DomainException);

        const savedGame = await gameRepo.findOne({
            where: { id: game.id },
            relations: {
                playingUsers: { user: true },
                answeredQuestion: true,
                roundQuestion: { question: true },
            },
        });

        const updatedPlayer0
            = savedGame!.playingUsers.find(p => p.user.id === users[0].id);
        const updatedPlayer1
            = savedGame!.playingUsers.find(p => p.user.id === users[1].id);
        expect(savedGame?.status).toBe(StatusGame.Finished);
        expect(updatedPlayer0!.score).toBe(3);
        expect(updatedPlayer1!.score).toBe(2);
    });

    it('shouldn\'t calculated the final score at the end of the game.', async () => {
        const order =   [0, 1,  1,  0,  0,  1,  0,  1,  0,  1];
        const correct = [0, 1,  0,  0,  0,  0,  0,  1,  0,  0];
        let numberQuestionPlayer1 = 0;
        let numberQuestionPlayer2 = 0;
        let number: number;
        for (let i = 0; i < 10; i++) {
            const player: number = order[i];
            if (player === 0) {
                number: number = numberQuestionPlayer1;
                numberQuestionPlayer1++;
            } else {
                number: number = numberQuestionPlayer2;
                numberQuestionPlayer2++;
            }
            const answer: string
                = correct[i] ? questions[number].correctAnswers[0] : 'hcf';
            await handler.execute(
                new CheckAnswerCommand(users[player].id.toString(), {
                    answer: answer,
                }),
            );
        }
        const savedGame = await gameRepo.findOne({
            where: { id: game.id },
            relations: {
                playingUsers: { user: true },
                answeredQuestion: true,
                roundQuestion: { question: true },
            },
        });

        const updatedPlayer0
            = savedGame!.playingUsers.find(p => p.user.id === users[0].id);
        const updatedPlayer1
            = savedGame!.playingUsers.find(p => p.user.id === users[1].id);
        expect(savedGame?.status).toBe(StatusGame.Finished);
        expect(updatedPlayer0!.score).toBe(0);
        expect(updatedPlayer1!.score).toBe(2);
    });
});