import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MyStatisticViewDto } from '@modules/quiz/dto/view/my.statistic.view.dto';
import { StatisticsUser } from '@modules/quiz/domain/statistics.user.entity';

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
}
