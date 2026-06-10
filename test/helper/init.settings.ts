import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { Connection } from 'mongoose';
import { initAppModule } from '@src/init.app.module';
import { appSetup } from '@src/setup/app.setup';
import { deleteAllData } from './delete.all.data';
import { CoreConfig } from '@core/configs/core.config';
import { UserConfig } from '@src/modules/users-system/config/user.config';
import { Blog } from '@src/modules/blogging.platform/domain/blog.entity';
import { Post } from '@src/modules/blogging.platform/domain/post.entity';
import { Comment } from '@src/modules/blogging.platform/domain/comment.entity';
import { TestDataBuilderByDb } from './test.data.builder.by.db';
import { EmailService } from '@src/modules/notifications/application/email.service';
import { EmailServiceMock } from '../mock/email.service.mock';
import { PasswordHashService } from '@src/modules/users-system/application/password.hash.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { DATA_SOURCE } from '@core/constans/data.source';

export const initSettings = async (
    //передаем callback, который получает ModuleBuilder, если хотим изменить настройку тестового модуля
    addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
) => {
    const DynamicAppModule = await initAppModule();
    const emailServiceMock = new EmailServiceMock();
    const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
        imports: [DynamicAppModule],
        })
        .overrideProvider(EmailService)
        .useValue(emailServiceMock);

    if (addSettingsToModuleBuilder) {
        addSettingsToModuleBuilder(testingModuleBuilder);
    }

    const testingAppModule = await testingModuleBuilder
        .compile();

    const app = testingAppModule.createNestApplication<NestExpressApplication>();
    const coreConfig = app.get<CoreConfig>(CoreConfig);
    const userConfig = app.get<UserConfig>(UserConfig);
    const globalPrefix = coreConfig.globalPrefix
    appSetup(app, coreConfig.isSwaggerEnabled, globalPrefix);//, DynamicAppModule.module);

    await app.init();

    const httpServer = app.getHttpServer();
    await deleteAllData(app, coreConfig.globalPrefix);

    const passwordHashService = app.get<PasswordHashService>(PasswordHashService);
    const dataSource = app.get<DataSource>(DataSource);
    const testData = await TestDataBuilderByDb.createTestData(app,
                                                                        userConfig,
                                                                        dataSource,
                                                                        passwordHashService,
                                                                        );

    return {
        app,
        httpServer,
        testData,
        globalPrefix,
        emailServiceMock
    };
};