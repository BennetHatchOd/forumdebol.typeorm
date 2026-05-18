import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { UserService } from '@modules/users-system/application/user.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(private userService: UserService) {
        super({ usernameField: "loginOrEmail" });
    }

    async validate(loginOrEmail: string, password: string): Promise<string> {
        const userId: string | null = await this.userService.validateUserForLocalAuth(loginOrEmail, password);
        if (!userId) {
            throw new DomainException({
                message: '',
                code: DomainExceptionCode.Unauthorized});
        }
        return userId;
    }
}
