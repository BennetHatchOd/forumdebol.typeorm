import {
    RegistrationPlayerCommand,
    RegistrationPlayerHandler,
} from '@modules/quiz/application/command/registration.player.usecase';
import { StatusGame } from '@modules/quiz/dto/type/status.game.enum';
import { CheckAnswerCommand, CheckAnswerHandler } from '@modules/quiz/application/command/check.answer.usecase';
import {
    GetUserCurrentGameHandler,
    GetUserCurrentGameQuery,
} from '@modules/quiz/application/query/get.user.current.game.query';
import { Repository } from 'typeorm';
import { User } from '@modules/users-system/domain/user.entity';
import { Question } from '@modules/quiz/domain/question.entity';
import { GetGameByIdHandler, GetGameByIdQuery } from '@modules/quiz/application/query/get.game.by.id.query';

export class CommonGameTestingHelper {

    private static isDBcreated: boolean = false;
    private numberQuestionPlayer1 = 0;
    private numberQuestionPlayer2 = 0;
    private scorePlayer1: number = 0;
    private scorePlayer2: number = 0;
    private correctAnswerPlayer1: string[] = [];
    private correctAnswerPlayer2: string[] = [];
    private id: string = '';
    private static questions: {
        id: number,
        body: string,
        correctAnswers: string[],
        published: boolean
    }[] = [];
    public static users: {
        id: number,
        login: string,
        email: string,
        passwordHash: string
    }[] = [];
    private questionsRound: {
        answers: string[],
        id: string,
        body: string,
    }[] = [];
    private order: number[] = [];
    private correct: number[] = [];
    private finish1: boolean = false;
    private finish2: boolean = false;

    constructor(
        private player1: number,
        private player2: number,
        private checkAnswerHandler: CheckAnswerHandler,
        private registrationPlayerHandler: RegistrationPlayerHandler,
        private getUserCurrentGameHandler: GetUserCurrentGameHandler,
        private getGameByIdHandler: GetGameByIdHandler,
        private userRepo: Repository<User>,
        private questionRepo: Repository<Question>
    ) {

    };

    async initialization(){
    // create active game without answers
        this.player1--;
        this.player2--;
        // create game
        if (!CommonGameTestingHelper.isDBcreated){
            this.fillingArray();
            await this.fillingDb();
            CommonGameTestingHelper.isDBcreated = true;
        }
        this.id = await this.registrationPlayerHandler.execute(
            new RegistrationPlayerCommand(CommonGameTestingHelper.users[this.player1].id.toString()));
        await this.registrationPlayerHandler.execute(
            new RegistrationPlayerCommand(CommonGameTestingHelper.users[this.player2].id.toString()));

        // check creating game
        let view = await this.getUserCurrentGameHandler.execute(
            new GetUserCurrentGameQuery(CommonGameTestingHelper.users[this.player1].id.toString()));
        expect(view.id).toBe(this.id);
        expect(view.status).toBe(StatusGame.Active);
        view = await this.getUserCurrentGameHandler.execute(
            new GetUserCurrentGameQuery(CommonGameTestingHelper.users[this.player2].id.toString()));
        expect(view.id).toBe(this.id);
        expect(view.status).toBe(StatusGame.Active);

        // create question list of this game
        this.questionsRound = view.questions!.map((viewQuestion) => {
            const id = +viewQuestion.id;
            const answer = CommonGameTestingHelper.questions.find((qi) => {
                return id == qi.id
            })!.correctAnswers;
            return { ...viewQuestion, answers: answer };
        });
    };

    async step(orderStep: number[], correctStep: number[]){
        const newOrder: number[] = [];
        const newCorrect: number[] = [];
        let sumFirst = 0;
        let sumSecond = 0;

        for (let i = 0; i < orderStep.length; i++) {
            if(orderStep[i] == 0 && !this.finish1){
                sumFirst++;
                if(sumFirst + this.numberQuestionPlayer1 == 5){
                    this.finish1 = true;
                    if(this.finish2){
                        await this.stepUnfinished(newOrder,newCorrect);
                        await this.stepFinished(orderStep[i], correctStep[i]);
                        return;
                    }
                }
                newOrder.push(orderStep[i]);
                newCorrect.push(correctStep[i]);
            }
            if(orderStep[i] == 1 && !this.finish2){
                sumSecond++;
                if(sumSecond + this.numberQuestionPlayer2 == 5){
                    this.finish2 = true;
                    if(this.finish1){
                        await this.stepUnfinished(newOrder,newCorrect);
                        await this.stepFinished(orderStep[i],correctStep[i]);
                        return;
                    }
                }
                newOrder.push(orderStep[i]);
                newCorrect.push(correctStep[i]);
            }
        }
        await this.stepUnfinished(orderStep,correctStep);
    }

    private async stepUnfinished(orderStep: number[], correctStep: number[]){
        let currentNumberQuestion;
        let player;

        // check new answers
        for(let i = 0; i < orderStep.length; i++) {
            // for first player
            if(orderStep[i] === 0) {
                currentNumberQuestion = this.numberQuestionPlayer1;
                this.numberQuestionPlayer1++;
                player = this.player1;
                if(correctStep[i]) {
                    this.scorePlayer1++;
                    this.correctAnswerPlayer1.push('Correct');
                } else
                    this.correctAnswerPlayer1.push('Incorrect');
            } else {
                // for second player
                currentNumberQuestion = this.numberQuestionPlayer2;
                this.numberQuestionPlayer2++;
                player = this.player2;
                if (correctStep[i]) {
                    this.scorePlayer2++;
                    this.correctAnswerPlayer2.push('Correct');
                } else
                    this.correctAnswerPlayer2.push('Incorrect');
            }
            const answer: string
                = correctStep[i] ? this.questionsRound[currentNumberQuestion].answers[0] : 'hcf';
            await this.checkAnswerHandler.execute(
                new CheckAnswerCommand(CommonGameTestingHelper.users[player].id.toString(), {answer: answer}),
            );
        }
        this.order = this.order.concat(orderStep);
        this.correct = this.correct.concat(correctStep);

        // check result of answers for unFinished game
        for (let j = 0; j < 2; j++) {
            const viewPlayer = j ? this.player1 : this.player2;
            const view = await this.getUserCurrentGameHandler.execute(
                new GetUserCurrentGameQuery(CommonGameTestingHelper.users[viewPlayer].id.toString()));

            expect(view.id).toBe(this.id);
            expect(view.status).toBe(StatusGame.Active);
            expect(view.firstPlayerProgress.player.id).toBe(CommonGameTestingHelper.users[this.player1].id.toString());
            expect(view.secondPlayerProgress!.player.id).toBe(CommonGameTestingHelper.users[this.player2].id.toString());
            expect(view.firstPlayerProgress.score).toBe(this.scorePlayer1);
            expect(view.secondPlayerProgress!.score).toBe(this.scorePlayer2);
            expect(view.finishGameDate).toBeNull();
            for (let i = 0; i < this.numberQuestionPlayer1; i++) {
                expect(view.firstPlayerProgress.answers[i]).toEqual({
                    questionId: this.questionsRound[i].id,
                    answerStatus: this.correctAnswerPlayer1[i],
                    addedAt: expect.any(String)
                });
            }
            for (let i = 0; i < this.numberQuestionPlayer2; i++) {
                expect(view.secondPlayerProgress!.answers[i]).toEqual({
                    questionId: this.questionsRound[i].id,
                    answerStatus: this.correctAnswerPlayer2[i],
                    addedAt: expect.any(String)
                });
            }
        }
    }


    private async stepFinished(orderLast: number, correctLast: number){
        let player: number;

        // check new answers
            // for first player
            if(orderLast == 0) {
                if(this.scorePlayer2 > 0)
                    this.scorePlayer2++;
                this.numberQuestionPlayer1++;
                player = this.player1;
                if(correctLast) {
                    this.scorePlayer1++;
                    this.correctAnswerPlayer1.push('Correct');
                } else
                    this.correctAnswerPlayer1.push('Incorrect');
            } else {
                // for second player
                if(this.scorePlayer1 > 0)
                    this.scorePlayer1++;
                player = this.player2;
                this.numberQuestionPlayer2++;
                if (correctLast) {
                    this.scorePlayer2++;
                    this.correctAnswerPlayer2.push('Correct');
                } else
                    this.correctAnswerPlayer2.push('Incorrect');
            }
            const answer: string
                = correctLast ? this.questionsRound[4].answers[0] : 'hcf';
            await this.checkAnswerHandler.execute(
                new CheckAnswerCommand(CommonGameTestingHelper.users[player].id.toString(), {answer: answer}),
            );

        this.order.push(orderLast);
        this.correct.push(correctLast);

        // check result of answers for Finished game
        for (let j = 0; j < 2; j++) {
            const viewPlayer = j ? this.player1 : this.player2;
            const view = await this.getGameByIdHandler.execute(
                new GetGameByIdQuery(this.id, CommonGameTestingHelper.users[player].id.toString()));

            expect(view.id).toBe(this.id);
            expect(view.status).toBe(StatusGame.Finished);
            expect(view.firstPlayerProgress.player.id).toBe(CommonGameTestingHelper.users[this.player1].id.toString());
            expect(view.secondPlayerProgress!.player.id).toBe(CommonGameTestingHelper.users[this.player2].id.toString());
            expect(view.firstPlayerProgress.score).toBe(this.scorePlayer1);
            expect(view.secondPlayerProgress!.score).toBe(this.scorePlayer2);
            expect(view.finishGameDate).toEqual(expect.any(String));
            for (let i = 0; i < 5; i++) {
                expect(view.firstPlayerProgress.answers[i]).toEqual({
                    questionId: this.questionsRound[i].id,
                    answerStatus: this.correctAnswerPlayer1[i],
                    addedAt: expect.any(String)
                });
            }
            for (let i = 0; i < 5; i++) {
                expect(view.secondPlayerProgress!.answers[i]).toEqual({
                    questionId: this.questionsRound[i].id,
                    answerStatus: this.correctAnswerPlayer2[i],
                    addedAt: expect.any(String)
                });
            }
        }
    }

    async getView(){
        const view = await this.getGameByIdHandler.execute(
            new GetGameByIdQuery(this.id, CommonGameTestingHelper.users[this.player1].id.toString()));
        return view;
    }
    private fillingArray(){
        CommonGameTestingHelper.questions.push({
            id: 0,
            body: 'say 7, 8, 9',
            correctAnswers: ['7', '8', '9'],

            published: true
        },{
            id: 0,
            body: 'say 5',
            correctAnswers: ['5'],
            published: true
        },{
            id: 0,
            body: 'say 6, 7',
            published: true,
            correctAnswers: ['6', '7'],
        },{
            id: 0,
            body: '2 + 2?',
            correctAnswers: ['four','4'],
            published: true
        },{
            id: 0,
            body: 'one',
            correctAnswers: ['two'],
            published: true
        },{
            id: 0,
            body: 'two',
            correctAnswers: ['three'],
            published: true
        },{
            id: 0,
            body: 'three',
            correctAnswers: ['four'],
            published: true
        },{
            id: 0,
            body: 'four?',
            correctAnswers: ['five'],
            published: true
        });

        CommonGameTestingHelper.users.push(
            {
                id: 0,
                login: 'u0',
                email: 'u0@test.local',
                passwordHash: 'hash',
            },{
                id: 0,
                login: 'u1',
                email: 'u1@test.local',
                passwordHash: 'hash',
            },
            {
                id: 0,
                login: 'u2',
                email: 'u2@test.local',
                passwordHash: 'hash',
            },{
                id: 0,
                login: 'u3',
                email: 'u3@test.local',
                passwordHash: 'hash',
            },
            {
                id: 0,
                login: 'u4',
                email: 'u4@test.local',
                passwordHash: 'hash',
            },{
                id: 0,
                login: 'u5',
                email: 'u5@test.local',
                passwordHash: 'hash',
            },{
                id: 0,
                login: 'u6',
                email: 'u6@test.local',
                passwordHash: 'hash',
            });
    };

    private async  fillingDb(){

        for (let user of CommonGameTestingHelper.users) {
            const result = await this.userRepo.save(
                this.userRepo.create(user));
            user.id = result.id;
        }
        for (let question of CommonGameTestingHelper.questions) {
            const result = await this.questionRepo.save(
                this.questionRepo.create(question));
            question.id = result.id;
        }
    }
}
