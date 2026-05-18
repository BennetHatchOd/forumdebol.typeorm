import ShortUniqueId from 'short-unique-id';
import { SessionInputDto } from '@modules/users-system/dto/input/session.input.dto';

export class Session {
    id: number;
    userId:     number;
    version:    string;
    deviceId:   string;
    deviceName: string;
    ip:         string;
    updatedAt:  Date;

    update(){
        const uid = new ShortUniqueId({ length: 7 });

        this.version = uid.rnd();
        this.updatedAt = new Date();
    }

    static createInstance(dto: SessionInputDto,
    ): Session {
        const uid = new ShortUniqueId({ length: 7 });
        const session = new this();

        session.userId = +dto.userId;
        session.deviceName = dto.deviceName;
        session.ip = dto.ip;

        session.deviceId = uid.rnd();
        session.version = uid.rnd();
        session.updatedAt = new Date();
        return session;
    }
    static copyInstance(dto: Session): Session {
        const session = new this();

        session.id = dto.id;
        session.userId = dto.userId;
        session.version = dto.version;
        session.deviceId = dto.deviceId;
        session.deviceName = dto.deviceName;
        session.ip = dto.ip;
        session.updatedAt = dto.updatedAt;

        return session;
    }
}
