import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { QuestionViewDto } from '@modules/quiz/dto/view/question.view.dto';
import { QuestionQueryRepository } from '@modules/quiz/infrastucture/query/question.query.repository';

export class GetQuestionQuery extends Query<QuestionViewDto> {
    constructor(
        public readonly id: string,
    ) {
        super();
    }
}
@QueryHandler(GetQuestionQuery)
export class GetQuestionHandler implements IQueryHandler<GetQuestionQuery> {
    constructor(
        private questionQueryRepository: QuestionQueryRepository,
    ) {}

    async execute({id}: GetQuestionQuery):Promise<QuestionViewDto> {

        return this.questionQueryRepository.findById(id)

    }
}