import { AnswerStatus } from '@modules/quiz/dto/type/answer.statuses.type';

export class AnswerViewDto {
    questionId: string;
    answerStatus: AnswerStatus;
    addedAt: string;
}