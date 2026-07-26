import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { AnswerViewDto } from '@modules/quiz/dto/view/answer.view.dto';
import { GameQueryRepository } from '@modules/quiz/infrastucture/query/game.query.repository';

export class GetAnswerQuery extends Query<AnswerViewDto> {
    constructor(
        public readonly id: string,
    ) {
        super();
    }
}
@QueryHandler(GetAnswerQuery)
export class GetAnswerHandler implements IQueryHandler<GetAnswerQuery> {
    constructor(
        private gameQueryRepository: GameQueryRepository,
    ) {}

    async execute({id}: GetAnswerQuery):Promise<AnswerViewDto> {

        return await this.gameQueryRepository.findAnswerById(id) as AnswerViewDto;

    }
}