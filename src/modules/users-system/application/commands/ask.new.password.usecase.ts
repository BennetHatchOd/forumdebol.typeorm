import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@modules/users-system/infrastucture/user.repository';
import { UserConfig } from '@modules/users-system/config/user.config';
import { EmailService } from '@modules/notifications/application/email.service';
import { CodeTable } from '@modules/users-system/infrastucture/code.type';
import { NewPassword } from '@modules/users-system/domain/new.password.entity';

export class AskNewPasswordCommand extends Command<void> {
    constructor(
        public email: string,
    ) {
        super()}
}

@CommandHandler(AskNewPasswordCommand)
export class AskNewPasswordHandler implements ICommandHandler<AskNewPasswordCommand> {
    constructor(
        private userRepository: UserRepository,
        private readonly userConfig: UserConfig,
        private readonly mailService: EmailService,

    ) {}

    async execute({email }: AskNewPasswordCommand):Promise<void> {

        // Only for verified users!
        // Generates a new recovery code and sends it via email without deleting the previous ones.
        // Delete the old codes ONLY after any of the codes are triggered.

        let foundedUser: number | null =
        await this.userRepository.findUserIdByEmail(email, true);
        if (!foundedUser)
            return;
        // Even if the current email address is not registered,
        // do not throw an error (to prevent detection of the user's email address)

        const newPassword = NewPassword.create(foundedUser, this.userConfig.timeLifePasswordCode);
        await this.userRepository.save(newPassword, CodeTable.RESET_PASSWORD);
        this.mailService.createPasswordRecovery(email, newPassword.code);

        return;
    }
}


