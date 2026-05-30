import { configModule } from './setup/config.module';
import { DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BloggingPlatformModule } from '@modules/blogging.platform/blogging.platform.module';
import { UserSystemModule } from '@modules/users-system/user.system.module';
import { TestingModule } from '@modules/testing/testing.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { CoreModule } from '@core/core.module';
import { CoreConfig } from '@core/core.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '@core/db.config';

@Module({
    imports: [
        configModule,
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService<DatabaseConfig>) =>
                configService.get('database', { infer: true })!,
        }),
       // BloggingPlatformModule,
        UserSystemModule,
        CoreModule,
        NotificationsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})

export class AppModule {
    static async forRoot(coreConfig: CoreConfig): Promise<DynamicModule> {
        // такой мудрёный способ мы используем, чтобы добавить к основным модулям необязательный модуль.
        // чтобы не обращаться в декораторе к переменной окружения через process.env в декораторе, потому что
        // запуск декораторов происходит на этапе склейки всех модулей до старта жизненного цикла самого NestJS

        return {
            module: AppModule,
            imports: [...(coreConfig.includeTestingModule ? [TestingModule] : [])], // Add dynamic modules here
        };
    }
}
