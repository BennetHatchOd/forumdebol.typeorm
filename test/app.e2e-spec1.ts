import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CoreConfig } from '@core/core.config';
import { AppModule } from '@src/app.module';
import { CoreModule } from '@core/core.module';

describe('AppController (e2e)', () => {
    let app: INestApplication<App>;
    let coreConfig: CoreConfig;

    beforeEach(async () => {
        const testingModuleBuilder = Test.createTestingModule({
            imports: [AppModule],
        });
        const moduleFixture: TestingModule = await testingModuleBuilder.compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        coreConfig = app.get<CoreConfig>(CoreConfig);
    });

    it('/ (GET)', () => {
        return request(app.getHttpServer())
            .get('/')
            .expect(200)
            .expect(coreConfig.versionApp);
    });
});

