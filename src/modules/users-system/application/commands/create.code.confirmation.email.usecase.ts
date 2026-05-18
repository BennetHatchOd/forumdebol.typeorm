import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { add } from 'date-fns';
import { UserRepository } from '@modules/users-system/infrastucture/user.repository';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { v4 as uuidv4 } from 'uuid';
import { CreateCodeDto } from '@modules/users-system/dto/create/create.code.dto';
import { UserConfig } from '@modules/users-system/config/user.config';
import { EmailService } from '@modules/notifications/application/email.service';
import { CodeTable } from '@modules/users-system/infrastucture/code.type';

export class CreateCodeConfirmationEmailCommand extends Command<void> {
    constructor(
        public email: string,
        public userId: number | null = null,
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

    async execute({email, userId }: CreateCodeConfirmationEmailCommand):Promise<void> {
        if(!userId){
            userId = await this.userRepository.findUserIdByEmail(email, false);
            if(!userId)
                throw new DomainException({
                    message: "user with unconfirmed email not found",
                    code: DomainExceptionCode.EmailNotExist,
                    extension: [{message: "user with unconfirmed email not found",
                        field: "email"}]
                })
        }
        const code = uuidv4();
        const expirationTime = add(new Date(), { hours: this.userConfig.timeLifeEmailCode });

        const confirmEmailDto = new CreateCodeDto(userId, code, expirationTime);
        await this.userRepository.saveCode(confirmEmailDto, CodeTable.CONFIRM_EMAIL);
        this.mailService.createConfirmEmail(email, code);
        return;
    }
}


