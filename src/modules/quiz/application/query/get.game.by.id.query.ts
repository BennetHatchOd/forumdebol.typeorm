import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GamePairViewDto } from '@modules/quiz/dto/view/game.pair.view.dto';
import { GameQueryRepository } from '@modules/quiz/infrastucture/query/game.query.repository';
import { isDbId } from '@core/is.db.id';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { StatusGame } from '@modules/quiz/dto/type/status.game.enum';

export class GetGameByIdQuery extends Query<GamePairViewDto> {
    constructor(
        public readonly id: string,
        public readonly userId: string,
    ) {
        super();
    }
}
@QueryHandler(GetGameByIdQuery)
export class GetGameByIdHandler implements IQueryHandler<GetGameByIdQuery> {
    constructor(
        private gameQueryRepository: GameQueryRepository,
    ) {}

    async execute({id, userId}: GetGameByIdQuery):Promise<GamePairViewDto> {

        const idDB = isDbId(id);
        if (!idDB)
            throw  new DomainException({
                message: ' id has invalid format',
                code: DomainExceptionCode.BadRequest,
            });

        const game: GamePairViewDto = await this.gameQueryRepository.findById(idDB);

        if(game.firstPlayerProgress.player.id !== userId &&
          (game.status == StatusGame.PendingSecondPlayer || game.secondPlayerProgress!.player.id !== userId))
            throw  new DomainException({
                message: ' user tries to get pair in which user is not participant',
                code: DomainExceptionCode.Forbidden,
            });
        return game;
    }
}