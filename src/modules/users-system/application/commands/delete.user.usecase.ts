import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { UserRepository } from '@modules/users-system/infrastucture/user.repository';
import { User } from '@modules/users-system/domain/user.entity';

export class DeleteUserCommand extends Command<void> {
    constructor(
        public userId: string,
    ) {
        super()}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
    constructor(
        private readonly userRepository: UserRepository,
        ) {}

    async execute({userId}: DeleteUserCommand):Promise<void> {

        const user: User | null = await this.userRepository.findById(userId);

        if (!user)
            throw new DomainException({
                message: 'user with id-${userId} not found',
                code: DomainExceptionCode.NotFound});
        user.delete();
        this.userRepository.saveUser(user);
        return;
    }
}


