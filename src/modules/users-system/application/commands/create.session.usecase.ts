import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionInputDto } from '@modules/users-system/dto/input/session.input.dto';
import { Session } from '@modules/users-system/domain/session.entity';
import { SessionRepository } from '@modules/users-system/infrastucture/session.repository';
import { Inject } from '@nestjs/common';
import { INJECT_TOKEN } from '@core/constans/jwt.tokens';
import { JwtService } from '@nestjs/jwt';
import { TokenPayloadDto } from '@modules/users-system/dto/token.payload.dto';

export class CreateSessionCommand extends Command<string> {
    constructor(
        public sessionInputDto: SessionInputDto,
    ) {
        super()}
}

@CommandHandler(CreateSessionCommand)
export class CreateSessionHandler implements ICommandHandler<CreateSessionCommand, string> {
    constructor(
        private readonly sessionRepository: SessionRepository,
        @Inject(INJECT_TOKEN.REFRESH_TOKEN)
        private readonly refreshJwtService: JwtService,
        ) {}

    async execute({sessionInputDto}: CreateSessionCommand):Promise<string> {

        const session: Session = Session.createInstance(sessionInputDto)
        await this.sessionRepository.save(session);

        const payload: TokenPayloadDto =  this.sessionRepository.mapTokenFromSession(session)
        const token = this.refreshJwtService.sign(payload);
        return token;
    }
}


