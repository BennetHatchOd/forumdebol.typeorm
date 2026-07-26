import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GamePairViewDto } from '@modules/quiz/dto/view/game.pair.view.dto';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { GameQueryRepository } from '@modules/quiz/infrastucture/query/game.query.repository';

export class GetUserCurrentGameQuery extends Query<GamePairViewDto> {
    constructor(
        public readonly userId: string,
    ) {
        super();
    }
}
@QueryHandler(GetUserCurrentGameQuery)
export class GetUserCurrentGameHandler implements IQueryHandler<GetUserCurrentGameQuery> {
    constructor(
        private gameQueryRepository: GameQueryRepository,
    ) {}

    async execute({userId}: GetUserCurrentGameQuery):Promise<GamePairViewDto> {

        const activeGame: GamePairViewDto | null = await this.gameQueryRepository.findUnFinished(userId);
        if (!activeGame)
            throw  new DomainException({
                message: 'no active pair for current user',
                code: DomainExceptionCode.NotFound,
            });

        return activeGame;

    }
}