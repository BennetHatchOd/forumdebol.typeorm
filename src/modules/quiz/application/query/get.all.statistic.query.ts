import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { MyStatisticViewDto } from '@modules/quiz/dto/view/my.statistic.view.dto';
import { StatisticsQueryRepository } from '@modules/quiz/infrastucture/query/statistics.query.repository';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { GetAllStatisticsQueryParams } from '@modules/quiz/dto/input/get.all.statistics.query.params';

export class GetAllStatisticQuery extends Query<PaginatedViewDto<MyStatisticViewDto>> {
    constructor(
        public readonly query: GetAllStatisticsQueryParams,
    ) {
        super();
    }
}
@QueryHandler(GetAllStatisticQuery)
export class GetAllStatisticHandler implements IQueryHandler<GetAllStatisticQuery> {
    constructor(
        private statQueryRepository: StatisticsQueryRepository,
    ) {}

    async execute({query}: GetAllStatisticQuery):Promise<PaginatedViewDto<MyStatisticViewDto>> {

        return this.statQueryRepository.getAllStatistics(query);

    }
}