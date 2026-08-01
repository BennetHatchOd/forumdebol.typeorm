import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GamePairViewDto } from '@modules/quiz/dto/view/game.pair.view.dto';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { GameQueryRepository } from '@modules/quiz/infrastucture/query/game.query.repository';
import { EmptyPaginator } from '@core/dto/empty.paginator';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { BlogViewDto } from '@modules/blogging.platform/dto/view/blog.view.dto';
import { sortDirectionToDb } from '@core/dto/base.query.params.input.dto';
import { GetGamesQueryParams } from '@modules/quiz/dto/input/get.games.query.params.input.dto';

export class GetAllGameUserQuery extends Query<PaginatedViewDto<GamePairViewDto>> {
    constructor(
        public readonly userId: string,
        public readonly query: GetGamesQueryParams,
    ) {
        super();
    }
}
@QueryHandler(GetAllGameUserQuery)
export class GetAllGameUserHandler implements IQueryHandler<GetAllGameUserQuery> {
    constructor(
        private gameQueryRepository: GameQueryRepository,
    ) {}

    async execute({userId, query}: GetAllGameUserQuery):Promise<PaginatedViewDto<GamePairViewDto>> {

        return  this.gameQueryRepository.findAllMyGames(userId, query);

    }
}