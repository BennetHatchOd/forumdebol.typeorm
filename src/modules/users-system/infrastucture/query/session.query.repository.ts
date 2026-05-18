import { Inject, Injectable } from '@nestjs/common';
import { Session } from '@modules/users-system/domain/session.entity';
import { SessionViewDto } from '@modules/users-system/dto/view/session.view.dto';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource } from 'typeorm';


@Injectable()
export class SessionQueryRepository {

    constructor(
        @Inject(DATA_SOURCE) private dataSource: DataSource
    ){}

    async  findByUserId(userId: string): Promise<SessionViewDto[]> {

        const devices: Session[] = await this.dataSource.query(`
                SELECT *
                FROM public."Session"
                WHERE "userId" = $1`,
            [userId]
        )
        const items = devices.map(SessionViewDto.mapToView);
        return items;
    }
}