import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Session } from '@modules/users-system/domain/session.entity';
import { SessionRepository } from '@modules/users-system/infrastucture/session.repository';
import { SessionQueryFilterDto } from '@modules/users-system/dto/session.query.filter.dto';

export class DeleteOthersSessionCommand extends Command<void> {
    constructor(
        public userId: string,
        public deviceId: string,
    ) {
        super()}
}

@CommandHandler(DeleteOthersSessionCommand)
export class DeleteOthersSessionHandler implements ICommandHandler<DeleteOthersSessionCommand, string> {
    constructor(
        private readonly sessionRepository: SessionRepository,
    ) {}

    async execute({userId, deviceId}: DeleteOthersSessionCommand):Promise<void> {

        const deleteQueryFilter: SessionQueryFilterDto ={
            userId: userId,
            deviceId: deviceId,
            notDeviceId: true
        }
        await this.sessionRepository.deleteByFilter(deleteQueryFilter);
    }
}


