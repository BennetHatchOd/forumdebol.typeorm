import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isBefore } from 'date-fns';
import { UserRepository } from '@modules/users-system/infrastucture/user.repository';
import { User } from '@modules/users-system/domain/user.entity';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { AuthCodeContext } from '@modules/users-system/dto/auth.code.context';
import { CodeTable } from '@modules/users-system/infrastucture/type/code.type';
import { CodeRepository } from '@modules/users-system/infrastucture/code.repository';

export class ConfirmationEmailCommand extends Command<void> {
    constructor(public code: string) {
        super();
    }
}

@CommandHandler(ConfirmationEmailCommand)
export class ConfirmationEmailHandler
    implements ICommandHandler<ConfirmationEmailCommand>
{
    constructor(
        private codeRepository: CodeRepository,
        private userRepository: UserRepository,
                ) {}

    async execute({ code }: ConfirmationEmailCommand): Promise<void> {
        const foundUserInfo: AuthCodeContext | null =
            await this.codeRepository.findAndDeleteAuthCode(
                code,
                CodeTable.CONFIRM_EMAIL,
            );

        if (
            !!foundUserInfo &&
            !foundUserInfo.user.isConfirmEmail &&
            !foundUserInfo.user.deletedAt &&
            isBefore(new Date(), foundUserInfo.expirationTime)
        ) {
            foundUserInfo.user.isConfirmEmail = true;
            await this.userRepository.save(foundUserInfo.user);
            return;
        }
        throw new DomainException({
            message:
                'the confirmation code is incorrect, expired or already been applied',
            code: DomainExceptionCode.EmailNotConfirmed,
            extension: [
                {
                    message:
                        'the confirmation code is incorrect, expired or already been applied',
                    field: 'code',
                },
            ],
        });
    }
}