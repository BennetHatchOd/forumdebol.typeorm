import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { INJECT_TOKEN } from '@core/constans/jwt.tokens';
import { UserConfig } from '@modules/users-system/config/user.config';

@Module({
    providers: [
        UserConfig,
        {
            provide: INJECT_TOKEN.ACCESS_TOKEN,
            useFactory: (userConfig: UserConfig): JwtService => {
                return new JwtService({
                    secret: userConfig.accessTokenSecret,
                    signOptions: { expiresIn: userConfig.timeLifeAccessToken },
                });
            },
            inject: [UserConfig],
        },
        {
            provide: INJECT_TOKEN.REFRESH_TOKEN,
            useFactory: (userConfig:UserConfig): JwtService => {
                return new JwtService({
                    secret: userConfig.refreshTokenSecret,
                    signOptions: { expiresIn: userConfig.timeLifeRefreshToken },
                });
            },
            inject: [UserConfig],
        },
    ],
    exports:[
        INJECT_TOKEN.ACCESS_TOKEN,
        INJECT_TOKEN.REFRESH_TOKEN,
    ]
})
export class AuthModule {}
