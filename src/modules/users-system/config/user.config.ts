import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { configValidationUtility } from '@src/setup/config.validation.utility';


@Injectable()
export class UserConfig {

    @IsNotEmpty({
            message: 'Env variable ACCESS_TOKEN_SECRET must be a string',
    })
    accessTokenSecret: string;

    @IsNotEmpty({
            message: 'Env variable REFRESH_TOKEN_SECRET must be a string',
    })
    refreshTokenSecret: string;

    @IsNotEmpty()
    @IsNumber({},{
            message: 'Env variable TIME_LIFE_ACCESS_TOKEN must be a number',
    })
    timeLifeAccessToken: number;
    @IsNotEmpty()
    @IsNumber({},{
        message: 'Env variable TIME_LIFE_REFRESH_TOKEN must be a number',
    })
    timeLifeRefreshToken: number;



    @IsNotEmpty()
    @IsNumber({},{
        message: 'Env variable TIME_LIFE_EMAIL_CODE must be a number',
    })
    timeLifeEmailCode: number;

    @IsNotEmpty()
    @IsNumber({},{
        message: 'Set Env variable TIME_LIFE_PASSWORD_CODE must be a number',
    })
    timeLifePasswordCode: number;

    @IsNotEmpty()
    @IsNumber({},{
        message: 'Env variable SALT_ROUND must be a number ',
    })
    saltRound: number;

    @IsNotEmpty()
    @IsString({
        message: 'Set Env variable ADMIN_NAME_BASIC_AUTH'
    })
    adminNameBasicAuth: string;

    @IsNotEmpty()
    @IsString({
        message: 'Set Env variable ADMIN_PASSWORD_BASIC_AUTH'
    })
    adminPasswordBasicAuth: string;

    @IsNumber({},{
        message: 'Env variable COUNT_RATE_LIMITED, must be a number',
    })
    countRateLimiting: number;

    @IsNumber({},{
        message: 'Env variable TIME_RATE_LIMITED, must be a number',
    })
    timeRateLimiting: number;

    constructor(private configService: ConfigService<any, true>) {
        this.accessTokenSecret =this.configService.get('ACCESS_TOKEN_SECRET');
        this.refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
        this.timeLifeAccessToken = Number(this.configService.get('TIME_LIFE_ACCESS_TOKEN'));
        this.timeLifeRefreshToken = Number(this.configService.get('TIME_LIFE_REFRESH_TOKEN'));
        this.adminNameBasicAuth = this.configService.get('ADMIN_NAME_BASIC_AUTH');
        this.adminPasswordBasicAuth = this.configService.get('ADMIN_PASSWORD_BASIC_AUTH');
        this.timeLifeEmailCode = Number(this.configService.get('TIME_LIFE_EMAIL_CODE'));
        this.timeLifePasswordCode = Number(this.configService.get('TIME_LIFE_PASSWORD_CODE'));
        this.saltRound = Number(this.configService.get('SALT_ROUND'));
        this.timeRateLimiting = Number(this.configService.get('TIME_RATE_LIMITED'));
        this.countRateLimiting = Number(this.configService.get('COUNT_RATE_LIMITED'));

        configValidationUtility.validateConfig(this);
    }
}