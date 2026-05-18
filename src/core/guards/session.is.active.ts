import { INJECT_TOKEN } from '@core/constans/jwt.tokens';
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionRepository } from '@modules/users-system/infrastucture/session.repository';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { TokenPayloadDto } from '@modules/users-system/dto/token.payload.dto';

@Injectable()
export class SessionIsActiveGuard implements CanActivate {
    constructor(@Inject(INJECT_TOKEN.REFRESH_TOKEN)
                private readonly refreshJwtService: JwtService,
                private readonly sessionRepository: SessionRepository,
    ) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token: string = request.cookies.refreshToken
        try {
            const payload: TokenPayloadDto = this.refreshJwtService.verify(token);
            if (!await this.sessionRepository.isActive(payload))
                throw new Error()

            request.user = payload;
            return true;
        } catch {
            throw new DomainException({
                message: 'refrashToken is not valid',
                code: DomainExceptionCode.Unauthorized
            });
        }
    }
}
