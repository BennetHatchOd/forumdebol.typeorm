import { Injectable } from '@nestjs/common';
import { Session } from '@modules/users-system/domain/session.entity';
import { getTime } from 'date-fns';
import { TokenPayloadDto } from '@modules/users-system/dto/token.payload.dto';
import { FindOneOptions, Not, Repository } from 'typeorm';
import { SessionQueryFilterDto } from '@modules/users-system/dto/session.query.filter.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SessionRepository {

    constructor(
        @InjectRepository(Session) private sessionORMRepo: Repository<Session>,
    ){}

    async isActive(session: TokenPayloadDto): Promise<boolean> {
        //  check if the session is valid

            const result = await this.sessionORMRepo.exists({
                where: {
                    user: { id: +session.userId },
                    version: session.version,
                    "deviceId": session.deviceId,
                },
            });
            return result;

    }

    async getByFilter(queryFilter: SessionQueryFilterDto): Promise<Session | null> {

        const result
            = await this.sessionORMRepo.findOne(this.buildFindOptions(queryFilter));

        return result;
    }

    async deleteByFilter(queryFilter: SessionQueryFilterDto): Promise<void> {

        const result
            = await this.sessionORMRepo.find(this.buildFindOptions(queryFilter));

        if (!result)
            return;
        await this.sessionORMRepo.remove(result);
    }

    async save(changedItem: Session): Promise<void> {

        await this.sessionORMRepo.save(changedItem);
        return ;
    }

    private buildFindOptions(dto: SessionQueryFilterDto): FindOneOptions<Session> {
    const options: FindOneOptions<Session> = {};

    const where: any = {};

    if (dto.deviceId !== undefined && dto.notDeviceId)
        where.deviceId = Not(dto.deviceId);

    if (dto.deviceId !== undefined && !dto.notDeviceId)
        where.deviceId = dto.deviceId;

    if (dto.userId !== undefined )
        where.user = {id: +dto.userId};

    if (dto.version !== undefined)
        where.version = dto.version;

    if (Object.keys(where).length > 0)
        options.where = where;

    options.relations = {
        user: true,
    };

    return options;
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
