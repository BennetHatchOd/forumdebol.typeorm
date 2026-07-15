import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { configValidationUtility } from '@src/setup/config.validation.utility';

export enum Environments {
    DEVELOPMENT = 'development',
    STAGING = 'staging',
    PRODUCTION = 'production',
    TESTING = 'testing',
}

@Injectable()
export class CoreConfig {
    @IsNotEmpty()
    @IsNumber({},{
        message: 'Set Env variable PORT, example: 3000',
    })
    port: number;


    @IsNotEmpty()
    @IsString({
        message: 'Set Env variable DATABASE_USER',
    })
    dbUser: string;
    
    @IsNotEmpty()
    @IsString({
        message: 'Set Env variable DATABASE_PASS',
    })
    dbPass: string;
    
    @IsNotEmpty()
    @IsString({
        message: 'Set Env variable DATABASE_HOST',
    })
    dbHost: string;
    
    @IsNotEmpty()
    @IsString({
        message: 'Set Env variable DATABASE_PORT',
    })
    dbPort: number;
    
    @IsNotEmpty()
    @IsString({
        message: 'Set Env variable DATABASE_NAME',
    })
    dbName: string;
    
    database: string;
    
    @IsNotEmpty()
    @IsString({
        message: 'Set Env variable PASSWORD_MAIL',
    })
    passwordEmail: string;

    @IsBoolean({
        message: 'Set Env variable INCLUDE_TESTING_MODULE, to enable the module the value must be {true, 1 or enabled}'
    })
    includeTestingModule: boolean;

    @IsBoolean({
        message: 'Set Env variable INCLUDE_TESTING_MODULE, to enable the module the value must be {true, 1 or enabled}'
    })
    isSwaggerEnabled: boolean;

    @IsEnum(Environments, {
        message: 'Set correct NODE_ENV value, available values are {DEVELOPMENT, STAGING, PRODUCTION or TESTING}'
    })
    env: string;

    @IsString({
        message: 'Env variable GLOBAL_PREFIX, must be a string, example: appDB',
    })
    globalPrefix: string;

    versionApp: string;

    constructor(private configService: ConfigService<any, true>) {
        this.port = Number(this.configService.get('PORT'));
        this.env = this.configService.get('NODE_ENV');
        this.includeTestingModule = configValidationUtility.convertToBoolean(this.configService.get('INCLUDE_TESTING_MODULE')) as boolean;
        this.globalPrefix = this.configService.get('GLOBAL_PREFIX');
        this.versionApp = this.configService.get('VERSION_APP');
        this.isSwaggerEnabled = configValidationUtility.convertToBoolean(this.configService.get('IS_SWAGGER_ENABLE')) as boolean;
        this.passwordEmail = this.configService.get('PASSWORD_MAIL');
        this.dbUser = this.configService.get('DATABASE_USER');
        this.dbPass = this.configService.get('DATABASE_PASS');
        this.dbHost = this.configService.get('DATABASE_HOST');
        this.dbPort = this.configService.get('DATABASE_PORT');
        this.dbName = this.configService.get('DATABASE_NAME');

        configValidationUtility.validateConfig(this);
    }
}