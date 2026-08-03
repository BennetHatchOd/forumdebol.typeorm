import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { MyStatisticViewDto } from '@modules/quiz/dto/view/my.statistic.view.dto';
import { StatisticsQueryRepository } from '@modules/quiz/infrastucture/query/statistics.query.repository';

export class GetMyStatisticQuery extends Query<MyStatisticViewDto> {
    constructor(
        public readonly userId: string,
    ) {
        super();
    }
}
@QueryHandler(GetMyStatisticQuery)
export class GetMyStatisticHandler implements IQueryHandler<GetMyStatisticQuery> {
    constructor(
        private statQueryRepository: StatisticsQueryRepository,
    ) {}

    async execute({userId}: GetMyStatisticQuery):Promise<MyStatisticViewDto> {

        return this.statQueryRepository.getMyStatistics(userId);

    }
}