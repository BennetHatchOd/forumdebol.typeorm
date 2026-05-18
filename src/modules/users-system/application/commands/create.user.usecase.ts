import { Command, CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { UserInputDto } from '@modules/users-system/dto/input/user.input.dto';
import { UserConfig } from '@modules/users-system/config/user.config';
import { PasswordHashService } from '../password.hash.service';
import { UserRepository } from '@modules/users-system/infrastucture/user.repository';
import { User } from '@modules/users-system/domain/user.entity';
import {
    CreateCodeConfirmationEmailCommand
} from '@modules/users-system/application/commands/create.code.confirmation.email.usecase';

export class CreateUserCommand extends Command<string> {
    constructor(
        public userDto: UserInputDto,
        public isConfirmedEmail: boolean = true,
        public toSentEmail: boolean = false,
    ) {
        super()}
}

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, string> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHashService: PasswordHashService,
        private readonly userConfig: UserConfig,
        private readonly commandBus: CommandBus,
    ) {}

    async execute({userDto, isConfirmedEmail, toSentEmail}: CreateUserCommand):Promise<string> {

        // check the uniqueness of the login and email
        const checkUniq: string[] | null = await this.userRepository.checkUniq(
            userDto.login,
            userDto.email,
        );

        if (checkUniq) {
            const errors = checkUniq.map((fieldError:string) => {
                return {
                    message: `user's ${fieldError} must be uniq`,
                    field: fieldError,
                };
            });
            throw new DomainException({
                message: "user's email or login must be uniq",
                code: DomainExceptionCode.ValidationError,
                extension: errors,
            });
        }

        // create a password hash
        const passwordHash: string = await this.passwordHashService.createHash(
            userDto.password,
            this.userConfig.saltRound,
        );
        const createdUser: User = User.createInstance({
                ...userDto,
                password: passwordHash,
            },
            isConfirmedEmail);

        await this.userRepository.saveUser(createdUser);

        if(toSentEmail && !isConfirmedEmail)
            await this.commandBus.execute(new CreateCodeConfirmationEmailCommand(createdUser.email, createdUser.id))
        return createdUser.id.toString();
    }
}

