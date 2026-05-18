import { Session } from '@modules/users-system/domain/session.entity';

export class SessionViewDto{
    ip: string;
    title: string;
    lastActiveDate: string;
    deviceId: string;

    public static mapToView(dto: Session): SessionViewDto{
        const session = new SessionViewDto();

        session.deviceId = dto.deviceId;
        session.title = dto.deviceName;
        session.lastActiveDate = dto.updatedAt.toISOString();
        session.ip = dto.ip;

        return session;
    }
}