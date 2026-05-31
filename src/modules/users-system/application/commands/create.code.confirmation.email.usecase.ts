import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@modules/users-system/infrastucture/user.repository';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { UserConfig } from '@modules/users-system/config/user.config';
import { EmailService } from '@modules/notifications/application/email.service';
import { CodeTable } from '@modules/users-system/infrastucture/code.type';
import { ConfirmEmail } from '@modules/users-system/domain/confirm.email.entity';

export class CreateCodeConfirmationEmailCommand extends Command<void> {
    constructor(
        public email: string,
    ) {
        super()}
}

@CommandHandler(CreateCodeConfirmationEmailCommand)
export class CreateCodeConfirmationEmailHandler implements ICommandHandler<CreateCodeConfirmationEmailCommand> {
    constructor(
        private userRepository: UserRepository,
        private readonly userConfig: UserConfig,
        private readonly mailService: EmailService,

    ) {}

    async execute({email }: CreateCodeConfirmationEmailCommand):Promise<void> {

        const userId = await this.userRepository.findUserIdByEmail(email, false);
        if(!userId)
            throw new DomainException({
                message: "user with unconfirmed email not found",
                code: DomainExceptionCode.EmailNotExist,
                extension: [{message: "user with unconfirmed email not found",
                    field: "email"}] })


        const confirmEmail = ConfirmEmail.create(userId, this.userConfig.timeLifeEmailCode);
        await this.userRepository.deleteAuthCodeByUser(userId, CodeTable.CONFIRM_EMAIL);
        await this.userRepository.save(confirmEmail, CodeTable.CONFIRM_EMAIL);
        this.mailService.createConfirmEmail(email, confirmEmail.code);
        return;
    }
}


