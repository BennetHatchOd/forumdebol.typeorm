import { INJECT_TOKEN } from '@core/constans/jwt.tokens';
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ReadUserIdGuard implements CanActivate {
    constructor(@Inject(INJECT_TOKEN.ACCESS_TOKEN)
                private readonly accessJwtService: JwtService,
                ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const authHeader = request?.headers?.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const payload = this.accessJwtService.verify(token);
                request.user = payload.user;
            } catch {
                request.user = null;
            }
        }else
            request.user = null;

        return true;
    }
}
