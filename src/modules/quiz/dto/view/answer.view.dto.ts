import { AnswerStatus } from '@modules/quiz/dto/type/answer.statuses.enum';
import { AnsweredQuestion } from '@modules/quiz/domain/answered.question.entity';
import console from 'node:console';

export class AnswerViewDto {
    questionId: string;
    answerStatus: AnswerStatus;
    addedAt: string;

    static MapToView(answer: AnsweredQuestion){
        const view = new AnswerViewDto();
        view.answerStatus =
            answer.isCorrect ? AnswerStatus.Correct : AnswerStatus.Incorrect;
        view.addedAt = answer.addedAt.toISOString();
        view.questionId = answer.question.id.toString();

        return view;
    }
}