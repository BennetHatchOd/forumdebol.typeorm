import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { GetCommentQueryParams } from '@modules/blogging.platform/dto/input/get.comment.query.params.input.dto';
import { CommentViewDto } from '@modules/blogging.platform/dto/view/comment.view.dto';
import { PostRepository } from '@modules/blogging.platform/infrastucture/post.repository';
import { CommentQueryRepository } from '@modules/blogging.platform/infrastucture/query/comment.query.repository';
import { Question } from '@modules/quiz/domain/question.entity';
import { QuestionViewDto } from '@modules/quiz/dto/view/question.view.dto';
import { GetQuestionQueryParams } from '@modules/quiz/dto/input/get.question.query.params.input.dto';
import { QuestionQueryRepository } from '@modules/quiz/infrastucture/query/question.query.repository';

export class GetAllQuestionsQuery extends Query<PaginatedViewDto<QuestionViewDto>> {
    constructor(
           public readonly query: GetQuestionQueryParams,
    ) {
        super();
    }
}
@QueryHandler(GetAllQuestionsQuery)
export class GetAllQuestionHandler implements IQueryHandler<GetAllQuestionsQuery> {
    constructor(
        private questionQueryRepository: QuestionQueryRepository,
    ) {}

    async execute({query}: GetAllQuestionsQuery):Promise<PaginatedViewDto<QuestionViewDto>> {

        return this.questionQueryRepository.find(query);
    }
}