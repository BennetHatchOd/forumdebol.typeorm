import { Injectable } from '@nestjs/common';
import { Session } from '@modules/users-system/domain/session.entity';
import { SessionViewDto } from '@modules/users-system/dto/view/session.view.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';


@Injectable()
export class SessionQueryRepository {

    constructor(
        @InjectRepository(Session) private sessionORMRepo: Repository<Session>
    ){}

    async  findByUserId(userId: string): Promise<SessionViewDto[]> {

        const devices: Session[] = await this.sessionORMRepo.find({where: {user: {id: +userId}} });

        const items = devices.map(SessionViewDto.mapToView);
        return items;
    }
}