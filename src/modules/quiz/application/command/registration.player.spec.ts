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
import 'dotenv/config';
import { testDbConfig } from '../../../../../test/test.db.config';
import { testHelperFillingDb } from '@modules/quiz/application/command/test.helper.filling.db';
import {
    RegistrationPlayerCommand,
    RegistrationPlayerHandler,
} from '@modules/quiz/application/command/registration.player.usecase';
import { testHelperFillingArrays } from '@modules/quiz/application/command/test.helper.filling.arrays';
import { DomainException } from '@core/exceptions/domain.exception';

describe('RegistratonPlayerUseCase integration (DB)', () => {
    let moduleRef: TestingModule;
    let dataSource: DataSource;
    let handler: RegistrationPlayerHandler;

    let gameRepo: Repository<Game>;
    let userRepo: Repository<User>;
    let questionRepo: Repository<Question>;
    let playingUserRepo: Repository<PlayingUser>;
    let answeredQuestionRepo: Repository<AnsweredQuestion>;
    let roundQuestionRepo: Repository<RoundQuestion>;

    let users: { id: number, login: string, email: string, passwordHash: string}[] = [];
    let questions:{ body: string, correctAnswers: string[], published: boolean}[] = [];

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
                    ],
                    synchronize: true,
                    autoLoadEntities: true,
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
                RegistrationPlayerHandler,
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

        handler = moduleRef.get(RegistrationPlayerHandler);

        gameRepo = moduleRef.get(getRepositoryToken(Game));
        userRepo = moduleRef.get(getRepositoryToken(User));
        questionRepo = moduleRef.get(getRepositoryToken(Question));
        playingUserRepo = moduleRef.get(getRepositoryToken(PlayingUser));
        answeredQuestionRepo = moduleRef.get(
            getRepositoryToken(AnsweredQuestion),
        );
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
    });

    afterAll(async () => {
        await dataSource.destroy();
        await moduleRef.close();
    });

    it('should create a pending game', async () => {

        const gameId: string = await handler.execute(
            new RegistrationPlayerCommand(users[0].id.toString()));

        const games: Game[] = await gameRepo.find({
            where:{id: +gameId},
            relations:{
                playingUsers:{ user: true },
                roundQuestion:true}}
        );

        expect(games).toHaveLength(1);
        expect(games[0].playingUsers).toHaveLength(1);
        expect(games[0].roundQuestion).toHaveLength(5);
        expect(games[0].playingUsers[0].user.id).toBe(users[0].id);
        expect(games[0].status).toBe(StatusGame.PendingSecondPlayer);

    });

    it('should create an active game', async () => {

        const gameId1: string = await handler.execute(
            new RegistrationPlayerCommand(users[0].id.toString()));

        const gameId2: string = await handler.execute(
            new RegistrationPlayerCommand(users[1].id.toString()));

        expect(gameId1 == gameId2).toBeTruthy();

        const games: Game[] = await gameRepo.find({
            where:{id: +gameId1},
            relations:{
                playingUsers:{ user: true },
                roundQuestion:true}}
        );

        expect(games).toHaveLength(1);
        expect(games[0].playingUsers).toHaveLength(2);
        expect(games[0].roundQuestion).toHaveLength(5);
        expect(games[0].playingUsers[0].user.id).toBe(users[0].id);
        expect(games[0].playingUsers[1].user.id).toBe(users[1].id);
        expect(games[0].status).toBe(StatusGame.Active);

    });

    it('should create a pending game with an active game', async () => {

        await handler.execute(
            new RegistrationPlayerCommand(users[0].id.toString()));

        const gameId1: string = await handler.execute(
            new RegistrationPlayerCommand(users[1].id.toString()));

        await expect(
            handler.execute(
                new RegistrationPlayerCommand(users[0].id.toString()),
            ),
        ).rejects.toBeInstanceOf(DomainException);


        const gameId2: string = await handler.execute(
            new RegistrationPlayerCommand(users[2].id.toString()));

        expect(gameId1 !== gameId2).toBeTruthy();

        const games: Game[] = await gameRepo.find({
            where:{id: +gameId2},
            relations:{
                playingUsers:{ user: true },
                roundQuestion:true}}
        );
        expect(games).toHaveLength(1);
        expect(games[0].playingUsers).toHaveLength(1);
        expect(games[0].roundQuestion).toHaveLength(5);
        expect(games[0].playingUsers[0].user.id).toBe(users[2].id);
        expect(games[0].status).toBe(StatusGame.PendingSecondPlayer);

        await expect(
            handler.execute(
                new RegistrationPlayerCommand(users[2].id.toString()),
            ),
        ).rejects.toBeInstanceOf(DomainException);
    });

});