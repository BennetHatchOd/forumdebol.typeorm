import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AUTH_PATH, URL_PATH } from '@core/url.path.setting';
import { initSettings } from '../helper/init.settings';
import { TestDataBuilderByDb } from '../helper/test.data.builder.by.db';
import { join } from 'path';
import { deleteAllData } from '../helper/delete.all.data';
import { INJECT_TOKEN } from '@core/constans/jwt.tokens';
import { UserConfig } from '@src/modules/users-system/config/user.config';
import { JwtService } from '@nestjs/jwt';

describe('RateLimitController (e2e)', () => {
    let app: INestApplication;
    let testData: TestDataBuilderByDb;
    let globalPrefix;

    beforeAll(async () => {
        const result
            = await initSettings((moduleBuilder) =>
            moduleBuilder
                .overrideProvider(INJECT_TOKEN.ACCESS_TOKEN)
                .useFactory({
                    factory: (userConfig: UserConfig) => {
                        return new JwtService({
                            secret: userConfig.accessTokenSecret,
                            signOptions: { expiresIn: '2s' },
                        });
                    },
                    inject: [UserConfig],
                })
                .overrideProvider(INJECT_TOKEN.REFRESH_TOKEN)
                .useFactory({
                    factory: (userConfig: UserConfig) => {
                        return new JwtService({
                            secret: userConfig.refreshTokenSecret,
                            signOptions: { expiresIn: '40s' },
                        });
                    },
                    inject: [UserConfig],
                }),
        );
        app = result.app;
        testData = result.testData;
        globalPrefix = result.globalPrefix;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Testing rate limit', () => {
        const ip = '127.40.157.214';
        const device = 'Honor'

        beforeAll(async () => {
            testData.clearData();
            testData.numberUsers = 1;
            await testData.createManyUsers();
        })

        afterAll(async () => {
            await deleteAllData(app, globalPrefix);
        })

        it('should return 429 after 5 successful requests to /login ', async () => {
            for (let i = 0; i < 5; i++)
                await request(app.getHttpServer())
                    .post(join(URL_PATH.auth, AUTH_PATH.login))
                    .set("user-agent", device)
                    .set("x-forwarded-for", ip)
                    .send({
                        loginOrEmail: testData.users[0].email,
                        password: testData.usersPassword[0]
                    })
                    .expect(HttpStatus.OK)

            await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .set("user-agent", device)
                .set("x-forwarded-for", ip)
                .send({
                    loginOrEmail: testData.users[0].email,
                    password: testData.usersPassword[0]
                })
                .expect(HttpStatus.TOO_MANY_REQUESTS)


        })

        it('should return 429 after 5 successful requests to /registration-confirmation ', async () => {
            for (let i = 0; i < 5; i++)
                await request(app.getHttpServer())
                    .post(join(URL_PATH.auth, AUTH_PATH.confirmation))
                    .send({code: "string"})
                    .expect(HttpStatus.BAD_REQUEST)

            await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.confirmation))
                .send({code: "string"})
                .expect(HttpStatus.TOO_MANY_REQUESTS)
        })

        it('should return 401 after 5 requests to /logout ', async () => {
            for (let i = 0; i < 7; i++)
                await request(app.getHttpServer())
                    .post(join(URL_PATH.auth, AUTH_PATH.logout))
                    .expect(HttpStatus.UNAUTHORIZED)
        })
    });
})

    // .overrideProvider(ThrottlerGuard)
    // .useValue({
    //     canActivate: () => true, // разрешает все запросы
    // })
    // .compile();