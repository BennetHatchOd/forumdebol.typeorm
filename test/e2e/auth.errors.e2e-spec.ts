import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Connection } from 'mongoose';
import { AUTH_PATH, URL_PATH } from '@core/url.path.setting';
import { initSettings } from '../helper/init.settings';
import { TestDataBuilderByDb } from '../helper/test.data.builder.by.db';
import { join } from 'path';
import { deleteAllData } from '../helper/delete.all.data';
import { INJECT_TOKEN } from '@core/constans/jwt.tokens';
import { UserConfig } from '@src/modules/users-system/config/user.config';
import { JwtService } from '@nestjs/jwt';
import { EmailServiceMock } from '../mock/email.service.mock';

describe('AuthAppController with Errors (e2e)', () => {
    let app: INestApplication;
    let testData: TestDataBuilderByDb;
    let globalPrefix;
    let emailServiceMock: EmailServiceMock;

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
                }),
        );
        app = result.app;
        testData = result.testData;
        globalPrefix = result.globalPrefix;
        emailServiceMock = result.emailServiceMock;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Testing login user', () => {
        beforeAll(async () => {
            testData.clearData();
            testData.numberUsers = 2;
            await testData.createManyUsers();
        })

        afterAll(async () => {
            await deleteAllData(app, globalPrefix);
        })

        it('should return 401 with a wrong field name', async () => {
            const response = await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .send({
                    login: testData.users[0].login,
                    password: testData.usersPassword[0]
                })
                .expect(HttpStatus.UNAUTHORIZED)
        });

        it('should return 401 by wrong login, email, password', async () => {
            await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .send({
                    loginOrEmail: testData.users[0].login + 'h',
                    password: testData.usersPassword[0]
                })
                .expect(HttpStatus.UNAUTHORIZED)
            await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .send({
                    loginOrEmail: testData.users[0].email + 'h',
                    password: testData.usersPassword[0]
                })
                .expect(HttpStatus.UNAUTHORIZED)
            await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .send({
                    loginOrEmail: testData.users[0].login,
                    password: testData.usersPassword[0] + ' '
                })
                .expect(HttpStatus.UNAUTHORIZED)
        });
    });

    describe('Resenting email and confirmation with errors', () => {
        let code: string;
        const user = {
            login: "gytd",
            email: "gytd@gmail.com",
            password: "fvbnbnbnghG8"};

        beforeAll(async () => {
            testData.clearData();
            jest.clearAllMocks();
        })
        afterAll(async () => {
            await deleteAllData(app, globalPrefix);
        })

        it('should return 400 if email not exist', async () => {
            const response = await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.resentEmail))
                .send({
                    "email": "fakeEmail@example.com"
                })
                .expect(HttpStatus.BAD_REQUEST)
            expect(response.body).toEqual({"errorsMessages": [{
                        message: expect.any(String),
                        field: "email"},
                                        ]
            })
        });

        it('should return 400 if code for email is already confirmed', async () => {

                await request(app.getHttpServer())
                    .post(join(URL_PATH.auth, AUTH_PATH.registration))
                    .send(user)
                    .expect(HttpStatus.NO_CONTENT)
                code = emailServiceMock.createConfirmEmail.mock.calls[0][1];

                await request(app.getHttpServer())
                    .post(join(URL_PATH.auth, AUTH_PATH.confirmation))
                    .send({
                        code: code
                    })
                    .expect(HttpStatus.NO_CONTENT)

                const response = await request(app.getHttpServer())
                        .post(join(URL_PATH.auth, AUTH_PATH.confirmation))
                        .send({
                            code: code
                        })
                        .expect(HttpStatus.BAD_REQUEST)

                expect(response.body).toEqual({"errorsMessages": [{
                    message: expect.any(String),
                    field: "code"},
                ]})
            });

        it('should return 400 if email is already confirmed', async () => {

            const response = await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.resentEmail))
                .send({
                    email: user.email,
                })
                .expect(HttpStatus.BAD_REQUEST)

            expect(response.body).toEqual({"errorsMessages": [{
                    message: expect.any(String),
                    field: "email"},
                ]})
        });

    });
});
