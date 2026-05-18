import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isBefore } from 'date-fns';
import { UserRepository } from '@modules/users-system/infrastucture/user.repository';
import { User } from '@modules/users-system/domain/user.entity';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { UserWithTime } from '@modules/users-system/dto/user.with.time';
import { CodeTable } from '@modules/users-system/infrastucture/code.type';

export class ConfirmationEmailCommand extends Command<void> {
    constructor(
        public code: string,
    ) {
        super()}
}

@CommandHandler(ConfirmationEmailCommand)
export class ConfirmationEmailHandler implements ICommandHandler<ConfirmationEmailCommand> {
    constructor(
        private userRepository: UserRepository,
    ) {}

    async execute({code}: ConfirmationEmailCommand):Promise<void> {

        const foundUserInfo: UserWithTime | null
            = await this.userRepository.findAndDeleteAuthCode(code, CodeTable.CONFIRM_EMAIL);


        if ( !!foundUserInfo
            && !foundUserInfo.isConfirmEmail
            && !foundUserInfo.deletedAt
            && isBefore(new Date(), foundUserInfo.expirationTime)
        ) {
            foundUserInfo.isConfirmEmail = true;
            const changedUser: User = UserWithTime.mapToUser(foundUserInfo);
            await this.userRepository.saveUser(changedUser)
            return;
        }
        throw new DomainException({
            message: "the confirmation code is incorrect, expired or already been applied",
            code: DomainExceptionCode.EmailNotConfirmed,
            extension: [{message: "the confirmation code is incorrect, expired or already been applied",
                field: "code"}]
        });
    }
}