import { Module } from '@nestjs/common';
import { UserControllers } from './api/user.controller';
import { UserService } from './application/user.service';
import { UserQueryRepository } from './infrastucture/query/user.query.repository';
import { UserRepository } from './infrastucture/user.repository';
import { AuthController } from './api/auth.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from '@src/core/strategy/local.strategy';
import { PasswordHashService } from './application/password.hash.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from '@src/core/strategy/jwt.strategy';
import { myBasicStrategy } from '@src/core/strategy/basic.strategy';
import { UserConfig } from './config/user.config';
import { EmailService } from '../notifications/application/email.service';
import { ConfigService } from '@nestjs/config';
import { INJECT_TOKEN } from '@core/constans/jwt.tokens';
import { CqrsModule } from '@nestjs/cqrs';
import { CommandHandlers } from '@modules/users-system/application/commands';
import { AuthModule } from '@core/auth.module';
import { SessionRepository } from '@modules/users-system/infrastucture/session.repository';
import { SessionQueryRepository } from '@modules/users-system/infrastucture/query/session.query.repository';
import { DeviceController } from '@modules/users-system/api/device.controller';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerOptions } from '@nestjs/throttler/dist/throttler-module-options.interface';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@modules/users-system/domain/user.entity';
import { NewPassword } from '@modules/users-system/domain/new.password.entity';
import { Session } from '@modules/users-system/domain/session.entity';
import { ConfirmEmail } from '@modules/users-system/domain/confirm.email.entity';
import { CodeRepository } from '@modules/users-system/infrastucture/code.repository';

@Module({
    imports: [
        CqrsModule,
        AuthModule,
        TypeOrmModule.forFeature([User, NewPassword, Session, ConfirmEmail]),
        ThrottlerModule.forRootAsync({
            imports:[UserSystemModule],
            inject: [UserConfig],
            useFactory: (userConfig:UserConfig):ThrottlerOptions[] => {
                return[ {
                    ttl:userConfig.timeRateLimiting,
                    limit:userConfig.countRateLimiting
                } ] as ThrottlerOptions[]},
        }),
        JwtModule,
        PassportModule,
    ],
    controllers: [
        UserControllers,
        AuthController,
        DeviceController,
    ],
    providers: [
        ...CommandHandlers,
        UserService,
        UserConfig,
        UserQueryRepository,
        UserRepository,
        PasswordHashService,
        EmailService,
        LocalStrategy,
        JwtStrategy,
        myBasicStrategy,
        ConfigService,
        CodeRepository,
        SessionRepository,
        SessionQueryRepository,
        // {
        //     provide: INJECT_TOKEN.ACCESS_TOKEN,
        //     useFactory: (userConfig: UserConfig): JwtService => {
        //         return new JwtService({
        //             secret: userConfig.accessTokenSecret,
        //             signOptions: { expiresIn: userConfig.timeLifeAccessToken },
        //         });
        //     },
        //     inject: [UserConfig],
        // },
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
        UserConfig,
    ]
})
export class UserSystemModule {}
