import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GameViewDto } from '@modules/quiz/dto/view/game.view.dto';
import { Game } from '@modules/quiz/domain/game.entity';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { GameQueryRepository } from '@modules/quiz/infrastucture/query/game.query.repository';

export class GetUserCurrentGameQuery extends Query<GameViewDto> {
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

    async execute({userId}: GetUserCurrentGameQuery):Promise<GameViewDto> {

        const activeGame: GameViewDto | null = await this.gameQueryRepository.findUnFinished(userId);
        if (!activeGame)
            throw  new DomainException({
                message: 'no active pair for current user',
                code: DomainExceptionCode.NotFound,
            });

        return activeGame;

    }
}