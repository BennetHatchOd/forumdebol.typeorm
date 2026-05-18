import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Session } from '@modules/users-system/domain/session.entity';
import { SessionRepository } from '@modules/users-system/infrastucture/session.repository';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { SessionQueryFilterDto } from '@modules/users-system/dto/session.query.filter.dto';

export class DeleteOneSessionCommand extends Command<void> {
    constructor(
        public userId: string,
        public deviceId: string
    ) {
        super()}
}

@CommandHandler(DeleteOneSessionCommand)
export class DeleteOneSessionHandler implements ICommandHandler<DeleteOneSessionCommand> {
    constructor(
        private readonly sessionRepository: SessionRepository,
        ) {}

    async execute({userId, deviceId}: DeleteOneSessionCommand):Promise<void> {

        const findQueryFilter: SessionQueryFilterDto = { deviceId: deviceId }

        const sessionToClose: Session | null
            = await this.sessionRepository.getByFilter(findQueryFilter);

        if(!sessionToClose)
            throw new DomainException({
                message: 'session not found',
                code: DomainExceptionCode.NotFound
            })

        if(sessionToClose.userId !== +userId )
            throw new DomainException({
                message: 'this is not your device',
                code: DomainExceptionCode.Forbidden
            })

        const deleteQueryFilter: SessionQueryFilterDto ={
            userId: userId,
            deviceId: deviceId
        }

        await this.sessionRepository.deleteByFilter(deleteQueryFilter);
    }
}


