import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GameViewDto } from '@modules/quiz/dto/view/game.view.dto';

export class GetGameQuery extends Query<GameViewDto> {
    constructor(
        public readonly id: string,
    ) {
        super();
    }
}
@QueryHandler(GetGameQuery)
export class GetQuestionHandler implements IQueryHandler<GetGameQuery> {
    constructor(
        private gameQueryRepository: GameQueryRepository,
    ) {}

    async execute({id}: GetGameQuery):Promise<GameViewDto> {

        return this.gameQueryRepository.findById(id)

    }
}