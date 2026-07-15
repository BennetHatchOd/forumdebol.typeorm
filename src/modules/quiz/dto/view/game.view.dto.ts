import { AnswerStatus } from '@modules/quiz/dto/type/answer.statuses.type';
import { StatusGame } from '@modules/quiz/dto/type/status.game.type';

export class GameViewDto {
    id: string;
    firstPlayerProgress: {
        answers: [
        {
            questionId: string;
            answerStatus: AnswerStatus;
            addedAt: string;
        }],
        player: {
            id: string;
            login: string;
        };
        score: number,
    };
    secondPlayerProgress: {
        answers: [
        {
            questionId: string;
            answerStatus: AnswerStatus;
            addedAt: string;
        }],
        player: {
            id: string;
            login: string;
        };
        score: number,
    }  | null = null;
    questions: [
        {
            id: string;
            body: string;
        }]  | null = null;
    status: StatusGame = StatusGame.PendingSecondPlayer;
    pairCreatedDate: string;
    startGameDate: string | null = null;
    finishGameDate: string | null = null;
}
