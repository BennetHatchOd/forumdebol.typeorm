import { AnswerStatus } from '@modules/quiz/dto/type/answer.statuses.enum';
import { Game } from '@modules/quiz/domain/game.entity';
import { StatusGame } from '@modules/quiz/dto/type/status.game.enum';
import console from 'node:console';

export class GameViewDto {
    id: string;
    firstPlayerProgress: {
        answers:
        {
            questionId: string;
            answerStatus: AnswerStatus;
            addedAt: string;
        }[],
        player: {
            id: string;
            login: string;
        };
        score: number,
    };
    secondPlayerProgress: {
        answers:
        {
            questionId: string;
            answerStatus: AnswerStatus;
            addedAt: string;
        }[],
        player: {
            id: string;
            login: string;
        };
        score: number,
    }  | null = null;
    questions:
        {
            id: string;
            body: string;
        }[]  | null = null;
    status: StatusGame = StatusGame.PendingSecondPlayer;
    pairCreatedDate: string;
    startGameDate: string | null = null;
    finishGameDate: string | null = null;

    static MapGameToView(game: Game): GameViewDto {
        const view = new GameViewDto();
        view.id = game.id.toString();
        let index= 0;
        if(game.playingUsers[1] && game.playingUsers[0].id > game.playingUsers[1].id)
            index = 1;
        view.firstPlayerProgress ={
            answers: [] as
                {
                    questionId: string;
                    answerStatus: AnswerStatus;
                    addedAt: string;
                }[],
                player: {
                id: game.playingUsers[index].user.id.toString(),
                login: game.playingUsers[index].user.login
            },
            score: game.playingUsers[index].score,
        };
        view.status = game.status;
        view.pairCreatedDate = game.playingUsers[index].registrationAt.toISOString();
        if(game.status == StatusGame.PendingSecondPlayer) {
            return view;
        }

        view.secondPlayerProgress = {
            answers: [] as
                {
                    questionId: string;
                    answerStatus: AnswerStatus;
                    addedAt: string;
                }[],
            player: {
                id: game.playingUsers[1 - index].user.id.toString(),
                login: game.playingUsers[1 - index].user.login
            },
            score: game.playingUsers[1 - index].score,
        };
        view.questions = [];
        game.roundQuestion.sort((a,b) => a.id - b.id);
        for (let question of game.roundQuestion){
            view.questions.push({
                id: question.question.id.toString(),
                body: question.question.body,
            })
        }
        game.answeredQuestion.sort((a,b) => a.id - b.id);
        for (let answer of game.answeredQuestion){
            if (answer.user.id == game.playingUsers[index].user.id){
                view.firstPlayerProgress.answers.push({
                    questionId: answer.question.id.toString(),
                    answerStatus: answer.isCorrect ? AnswerStatus.Correct : AnswerStatus.Incorrect,
                    addedAt: answer.addedAt.toISOString(),
                })
            } else
                view.secondPlayerProgress.answers.push({
                    questionId: answer.question.id.toString(),
                    answerStatus: answer.isCorrect ? AnswerStatus.Correct : AnswerStatus.Incorrect,
                    addedAt: answer.addedAt.toISOString(),
                })
        }
        view.startGameDate = game.playingUsers[1 - index].registrationAt.toISOString();
        if (view.status == StatusGame.Finished)
            view.finishGameDate = game.finishAt.toISOString();

        console.log(view.questions)
        return view;

    }
}
