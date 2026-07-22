import { Question } from '@modules/quiz/domain/question.entity';

export class QuestionViewDto{
    id:	string;
    body:	string;
    correctAnswers: string[];
    published:	boolean;
    createdAt:	string;
    updatedAt:	string|null;

    static MapToView(question:Question):QuestionViewDto{
        const view:QuestionViewDto=new QuestionViewDto();
        view.id = question.id.toString();
        view.body = question.body;
        view.published = question.published;
        view.correctAnswers = question.correctAnswers;
        view.updatedAt = question.updatedAt?.toISOString() ?? null;
        view.createdAt = question.createdAt.toISOString();
        return view;
    }
}