import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@modules/users-system/infrastucture/user.repository';
import { UserConfig } from '@modules/users-system/config/user.config';
import { CodeTable } from '@modules/users-system/infrastucture/type/code.type';
import { NewPasswordInputDto } from '@modules/users-system/dto/input/new.password.input.dto';
import { AuthCodeContext } from '@modules/users-system/dto/auth.code.context';
import { isBefore } from 'date-fns';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { PasswordHashService } from '@modules/users-system/application/password.hash.service';
import { CodeRepository } from '@modules/users-system/infrastucture/code.repository';

export class SetNewPasswordCommand extends Command<void> {
    constructor(
        public recoveryPassword: NewPasswordInputDto,
    ) {
        super()}
}

@CommandHandler(SetNewPasswordCommand)
export class SetNewPasswordHandler implements ICommandHandler<SetNewPasswordCommand> {
    constructor(
        private userRepository: UserRepository,
        private codeRepository: CodeRepository,
        private readonly userConfig: UserConfig,
        private readonly passwordHashService: PasswordHashService,

    ) {}

    async execute({recoveryPassword }: SetNewPasswordCommand):Promise<void> {

        // Sets a new password if a valid recovery code was received

        const userNewPassword: AuthCodeContext|null =
            await this.codeRepository.findAndDeleteAuthCode(recoveryPassword.recoveryCode,
                CodeTable.RESET_PASSWORD);

        if (!userNewPassword || isBefore(userNewPassword.expirationTime, new Date()))
            throw new DomainException({
                message: "a valid recovery code wasn't received or expired",
                code: DomainExceptionCode.PasswordRecoveryCodeNotFound,
                extension: [{message: "a valid recovery code wasn't received or expired",
                    field: "recoveryCode"}]
            });

        const hash: string = await this.passwordHashService.createHash(
            recoveryPassword.newPassword,
            this.userConfig.saltRound,
        );
        const user = userNewPassword.user;
        user.passwordHash = hash;
        await this.userRepository.save(user);

        return;
    }
}


