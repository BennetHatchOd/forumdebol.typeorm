import { Inject, Injectable } from '@nestjs/common';
import { Session } from '@modules/users-system/domain/session.entity';
import { getTime } from 'date-fns';
import { TokenPayloadDto } from '@modules/users-system/dto/token.payload.dto';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource } from 'typeorm';
import { SessionQueryFilterDto } from '@modules/users-system/dto/session.query.filter.dto';

@Injectable()
export class SessionRepository {

    constructor(
        @Inject(DATA_SOURCE) private dataSource: DataSource)
    {}

    async isActive(session: TokenPayloadDto): Promise<boolean> {
        //  check if the session is valid

        const result = await this.dataSource.query(`
            SELECT EXISTS(
                SELECT 1 
                FROM public."Session" 
                WHERE "userId" = $1 AND version = $2 AND "deviceId" = $3)`,
            [+session.userId, session.version, session.deviceId],
        );

        return result[0].exists;
    }


    async getByFilter(queryFilter: SessionQueryFilterDto): Promise<Session | null> {

        let sqlQuery: string = '"deviceId" ';
        let sqlParams: string[] = [];
        sqlQuery += !queryFilter.notDeviceId
                    ? '= $1'
                    : '<> $1';
        sqlParams.push(queryFilter.deviceId!);

        if (queryFilter.version) {
            sqlQuery += ' AND version = $2 AND "userId" = $3';
            sqlParams.push(queryFilter.version);
            sqlParams.push(queryFilter.userId!);
        }
        const findAnswer: Session[]
            = await this.dataSource.query(`
                SELECT *
                FROM public."Session"
                WHERE ${sqlQuery}
                LIMIT 1`,
            sqlParams
        );

        if(findAnswer.length == 0)
            return null;
        return Session.copyInstance(findAnswer[0]);
    }

    async deleteByFilter(queryFilter: SessionQueryFilterDto): Promise<void> {

        let sqlQuery: string = '"deviceId" ';
        let sqlParams: string[] = [];
        sqlQuery += !queryFilter.notDeviceId
            ? '= $1'
            : '<> $1';
        sqlParams.push(queryFilter.deviceId!);

        if (queryFilter.userId) {
            sqlQuery += ' AND "userId" = $2';
            sqlParams.push(queryFilter.userId!);
        }
        const findAnswer: Session[]
            = await this.dataSource.query(`
                DELETE
                FROM public."Session"
                WHERE ${sqlQuery}`,
            sqlParams
        );

    }

     async save(changedItem: Session): Promise<void> {

        if(!changedItem.id){
             const result = await this.dataSource.query(`
                INSERT INTO public."Session"(
                    "userId", version, "deviceId", "deviceName", "ip", "updatedAt")
                VALUES($1, $2, $3, $4, $5, $6)
                RETURNING id;`,
                 [   changedItem.userId,
                     changedItem.version,
                     changedItem.deviceId,
                     changedItem.deviceName,
                     changedItem.ip,
                     changedItem.updatedAt,
                 ])
             changedItem.id = result[0].id;
             return
         }

        await this.dataSource.query(`UPDATE public."Session"
            SET 
            version = $1, 
            "updatedAt" = $2
            WHERE id = $3;`,
             [   changedItem.version,
                 changedItem.updatedAt,
                 changedItem.id
             ]);
        return ;
    }

    mapTokenFromSession(session: Session): TokenPayloadDto{
        return {
            userId:     session.userId.toString(),
            version:    session.version,
            iat:        Math.floor(getTime(session.updatedAt) / 1000),
            deviceId:   session.deviceId
        }
    }
}
