import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StatisticsUser } from '@modules/quiz/domain/statistics.user.entity';

@Injectable()
export class StatisticsRepository {
    constructor(
        @InjectRepository(StatisticsUser) private statisticsORMRepo: Repository<StatisticsUser>,
    ) {}

    async save(statisticsUser: StatisticsUser) {

        await this.statisticsORMRepo.save(statisticsUser);
    }

    async find(ids: number[]):Promise<StatisticsUser[]> {

        return  this.statisticsORMRepo.find({
            where: {
                user: {
                    id: In(ids),
                },
            },
            relations: {
                user: true,
            },
        });
    }
}
