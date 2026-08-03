import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MyStatisticViewDto } from '@modules/quiz/dto/view/my.statistic.view.dto';
import { StatisticsUser } from '@modules/quiz/domain/statistics.user.entity';
import {
    GetAllStatisticsQueryParams,
} from '@modules/quiz/dto/input/get.all.statistics.query.params';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { EmptyPaginator } from '@core/dto/empty.paginator';
import { TopGamePlayerViewDto } from '@modules/quiz/dto/view/top.game.player.view.dto';
import console from 'node:console';
import { sortDirectionToDb } from '@core/dto/base.query.params.input.dto';

@Injectable()
export class StatisticsQueryRepository {
    constructor(
        @InjectRepository(StatisticsUser) private statisticsORMRepo: Repository<StatisticsUser>,
    ) {}

    async getMyStatistics(userId: string): Promise<MyStatisticViewDto>{
        const stat = await this.statisticsORMRepo.findOneBy(
            {
                user:{
                    id:+userId
                }
            });
        if (!stat)
            return MyStatisticViewDto.mapEmptyStatisticsToView();
        return MyStatisticViewDto.mapMyStatisticsToView(stat);
    }

    async getAllStatistics(query: GetAllStatisticsQueryParams):Promise<PaginatedViewDto<MyStatisticViewDto>> {

        const totalCount= await this.statisticsORMRepo.count();

        if (totalCount == 0)
            return new EmptyPaginator<MyStatisticViewDto>;

        query.calculateSkip(totalCount);


        const statisticsBuilder
            = this.statisticsORMRepo
            .createQueryBuilder('s')
            .leftJoin('s.user','u')
            .select(
                ['s."sumScore" as "sumScore"',
                's."gamesCount" as "gamesCount"',
                's."winsCount" as "winsCount"',
                's."lossesCount" as "lossesCount"',
                's."gamesCount" - s."winsCount" - s."lossesCount" as "drawsCount"',
                's."sumScore"::numeric / s."gamesCount" as "avgScores"',
                's."userId" as "userId"',
                'u."login" as "login"',
            ])
            .limit(query.pageSize)
            .offset(query.skip);
        this.addOrdersFromSort(query, statisticsBuilder);

        const items = await statisticsBuilder.getRawMany();


        return PaginatedViewDto.mapToView({
            items: items.map(TopGamePlayerViewDto.mapTopGamePlayerToView),
            page: query.pageNumber,
            size: query.pageSize,
            totalCount: totalCount
        })
    }

    private addOrdersFromSort(query: GetAllStatisticsQueryParams, statisticsBuilder: SelectQueryBuilder<StatisticsUser>) {

        if(!query.sort){
            statisticsBuilder
                .orderBy('"avgScores"', 'DESC')
                .addOrderBy('"sumScore"', 'DESC');
            return;
        }
        const [sortBy, direction] = query.sort[0].split(' ');
        const usedSort: string[] = [sortBy];

        statisticsBuilder.orderBy(`"${sortBy}"`, `${sortDirectionToDb[direction]}` as 'ASC' | 'DESC')

        for (let order of query.sort) {
            const [sortBy, direction] = order.split(' ');
            if(!usedSort.includes(sortBy)){
                usedSort.push(sortBy);
                statisticsBuilder.addOrderBy(`"${sortBy}"`, `${sortDirectionToDb[direction]}` as 'ASC' | 'DESC')
            }
        }


    }
}
