import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { add } from 'date-fns';
import { UserRepository } from '@modules/users-system/infrastucture/user.repository';
import { v4 as uuidv4 } from 'uuid';
import { CreateCodeDto } from '@modules/users-system/dto/create/create.code.dto';
import { UserConfig } from '@modules/users-system/config/user.config';
import { EmailService } from '@modules/notifications/application/email.service';
import { CodeTable } from '@modules/users-system/infrastucture/code.type';

export class ResetPasswordCommand extends Command<void> {
    constructor(
        public email: string,
    ) {
        super()}
}

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand> {
    constructor(
        private userRepository: UserRepository,
        private readonly userConfig: UserConfig,
        private readonly mailService: EmailService,

    ) {}

    async execute({email }: ResetPasswordCommand):Promise<void> {

        // Only for verified users!
        // Generates a new recovery code and sends it via email without deleting the previous ones.
        // Delete the old codes ONLY after any of the codes are triggered.

        let foundedUser: number | null =
        await this.userRepository.findUserIdByEmail(email, true);
        if (!foundedUser)
            return;
        // Even if the current email address is not registered,
        // do not throw an error (to prevent detection of the user's email address)

        const code = uuidv4();
        const expirationTime = add(new Date(), {hours: this.userConfig.timeLifePasswordCode});
        const resetPasswordDto = new CreateCodeDto(foundedUser, code, expirationTime);
        await this.userRepository.saveCode(resetPasswordDto, CodeTable.RESET_PASSWORD);
        this.mailService.createPasswordRecovery(email, code);

        return;
    }
}


