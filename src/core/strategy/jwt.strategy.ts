import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserConfig } from '@src/modules/users-system/config/user.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private userConfig: UserConfig) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: userConfig.accessTokenSecret
        });
    }

    async validate(payload: any) {
        return payload.user;
    }
}
