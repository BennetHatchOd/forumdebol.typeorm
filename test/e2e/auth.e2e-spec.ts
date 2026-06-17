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
import { EmailServiceMock } from '../mock/email.service.mock';
import * as cookie from 'cookie';
import { defaultUserConfig } from '../helper/default.user.config'
import { TestingModuleBuilder } from '@nestjs/testing';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let testData: TestDataBuilderByDb;
    let globalPrefix;
    let emailServiceMock: EmailServiceMock;

    beforeAll(async () => {
        const result
            = await initSettings((moduleBuilder : TestingModuleBuilder): TestingModuleBuilder =>
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
                })
                .overrideProvider(UserConfig).useValue({
                    ...defaultUserConfig,
                    timeRateLimiting: 10000,
                    countRateLimiting: 55,
                })

        );
        app = result.app;
        testData = result.testData;
        globalPrefix = result.globalPrefix;
        emailServiceMock = result.emailServiceMock;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Testing login. Login users by login and email', () => {
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 2;
            await testData.createManyUsers();
        })

        afterAll(async () => {
        })

        it('should return 200 and a correct accessToken by after login', async () => {
            const response = await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .set("user-agent", "Honor 15")
                .set("x-forwarded-for", "254:154:78:6")
                .send({
                    loginOrEmail: testData.users[0].login,
                    password: testData.usersPassword[0]
                })
                .expect(HttpStatus.OK)
            expect(response.body).toHaveProperty('accessToken');
            const accessToken = response.body.accessToken;
            const jwtServiceAT = app.get<JwtService>(INJECT_TOKEN.ACCESS_TOKEN);
            const jwtServiceRT = app.get<JwtService>(INJECT_TOKEN.REFRESH_TOKEN);
            const payload = jwtServiceAT.verify(accessToken);
            expect(payload.user).toBe(testData.users[0].id.toString());

            const setCookieHeader = response.headers['set-cookie'][0];
            const parsedCookie = cookie.parse(setCookieHeader);
            const refreshToken = parsedCookie['refreshToken']!;

            const payloadRT = jwtServiceRT.verify(refreshToken);
            expect(payloadRT).toEqual({
                userId: testData.users[0].id.toString(),
                version: expect.any(String),
                iat: expect.any(Number),
                deviceId: expect.any(String),
                exp: expect.any(Number),
            });

        });

        it('should return 200 and a correct accessToken after login by email', async () => {
            const response = await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .send({
                    loginOrEmail: testData.users[1].email,
                    password: testData.usersPassword[1]
                })
                .expect(HttpStatus.OK)
            expect(response.body).toHaveProperty('accessToken');
            const accessToken = response.body.accessToken;
            const jwtService = app.get<JwtService>(INJECT_TOKEN.ACCESS_TOKEN);
            const payload = jwtService.verify(accessToken); // <— проверит подпись и вернёт payload
            expect(payload.user).toBe(testData.users[1].id.toString());
        });

    });

    describe('Testing user registration and verification', () => {
            const user = {
                "login": "HE__2TeVSg",
                "password": "string",
                "email": "example@example.com"
            }
            let code: string;

            beforeAll(async () => {
                await deleteAllData(app, globalPrefix);
                jest.clearAllMocks();
            })
            afterAll(async () => {
            })

            it('should return 204 after registration and a correct code for email', async () => {
                await request(app.getHttpServer())
                    .post(join(URL_PATH.auth, AUTH_PATH.registration))
                    .send(user)
                    .expect(HttpStatus.NO_CONTENT)
                expect(emailServiceMock.createConfirmEmail).toHaveBeenCalled();
                expect(emailServiceMock.createConfirmEmail.mock.calls.length).toBe(1);
                expect(emailServiceMock.createConfirmEmail.mock.calls[0][0]).toBe(user.email);
                code = emailServiceMock.createConfirmEmail.mock.calls[0][1];

            });

            it('should return 204 after confirmation and 200 after login this user', async () => {
                await request(app.getHttpServer())
                    .post(join(URL_PATH.auth, AUTH_PATH.confirmation))
                    .send({
                        code: code
                    })
                    .expect(HttpStatus.NO_CONTENT)

                await request(app.getHttpServer())
                    .post(join(URL_PATH.auth, AUTH_PATH.login))
                    .send({
                        loginOrEmail: user.login,
                        password: user.password
                    })
                    .expect(HttpStatus.OK)
            });
        });

    describe('Testing resending email for confirmation', () => {
        const user = {
            "login": "H2Te_VSg",
            "password": "string2",
            "email": "example2@example.com"
        }
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            jest.clearAllMocks();
        })
        afterAll(async () => {
        })

        it('should return 204 after resending email. Registration, confirmation and login are used', async () => {
            let code: string;
            await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.registration))
                .send(user)
                .expect(HttpStatus.NO_CONTENT)

            await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.resentEmail))
                .send({
                    email: user.email
                })
                .expect(HttpStatus.NO_CONTENT)


            expect(emailServiceMock.createConfirmEmail).toHaveBeenCalled();
            expect(emailServiceMock.createConfirmEmail.mock.calls.length).toBe(2);
            expect(emailServiceMock.createConfirmEmail.mock.calls[1][0]).toBe(user.email);
            code = emailServiceMock.createConfirmEmail.mock.calls[1][1];

            await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.confirmation))
                .send({
                    code: code
                })
                .expect(HttpStatus.NO_CONTENT)

            await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .send({
                    loginOrEmail: user.login,
                    password: user.password
                })
                .expect(HttpStatus.OK)
        });
    });

    describe('Testing recovering password', () => {
        let code: string;
        const newPassword = 'Gt_re434g-ge';

        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 1;
            await testData.createManyAccessTokens();
            jest.clearAllMocks();
        })

        afterAll(async () => {
        })

        it('should return 204 and a code by email for recovery password', async () => {
            await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.askNewPassword))
                .send({
                    email: testData.users[0].email,
                })
                .expect(HttpStatus.NO_CONTENT)

            expect(emailServiceMock.createPasswordRecovery).toHaveBeenCalled();
            expect(emailServiceMock.createPasswordRecovery.mock.calls[0][0]).toBe(testData.users[0].email);
            code = emailServiceMock.createPasswordRecovery.mock.calls[0][1];

        });

        it('should return 204 after set new password', async () => {
                await request(app.getHttpServer())
                    .post(join(URL_PATH.auth, AUTH_PATH.confirmNewPassword))
                    .send({
                        newPassword: newPassword,
                        recoveryCode: code
                    })
                    .expect(HttpStatus.NO_CONTENT)
            });

        it('should return 200 after login with new password', async () => {
                const response = await request(app.getHttpServer())
                    .post(join(URL_PATH.auth, AUTH_PATH.login))
                    .send({
                        loginOrEmail: testData.users[0].login,
                        password: newPassword
                    })
                    .expect(HttpStatus.OK)
                expect(response.body).toHaveProperty('accessToken');
            });

        it('should return 401 after login with old password', async () => {
            await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .send({
                    loginOrEmail: testData.users[0].login,
                    password: testData.usersPassword[0]
                })
                .expect(HttpStatus.UNAUTHORIZED)
        });
    });

    describe('Testing about Me', () => {
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 1;
            await testData.createManyAccessTokens();
            jest.clearAllMocks();
        })

        afterAll(async () => {
        })

        it('should return 200 and the user will receive object information about themselves', async () => {
            const response = await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .send({
                    loginOrEmail: testData.users[0].email,
                    password: testData.usersPassword[0]
                })
                .expect(HttpStatus.OK)
            expect(response.body).toHaveProperty('accessToken');
            const accessToken = response.body.accessToken;

            const jwtService = app.get<JwtService>(INJECT_TOKEN.ACCESS_TOKEN);
            const payload = jwtService.verify(accessToken); // <— проверит подпись и вернёт payload

            const responseAbout = await request(app.getHttpServer())
                .get(join(URL_PATH.auth, AUTH_PATH.aboutMe))
                .set("Authorization", "Bearer " + accessToken)
                .expect(HttpStatus.OK)

            expect(responseAbout.body).toEqual({
                email: testData.users[0].email,
                login: testData.users[0].login,
                userId: testData.users[0].id.toString(),
            });

        });
    });

    describe('Testing update refreshToken', () => {
        let refresh1: string;
        let refresh2: string;
        const ip = '127.40.157.214';
        const device = 'Honor'

        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 1;
            await testData.createManyUsers();
        })

        afterAll(async () => {
        })

        it('should return 200 and the refreshToken for user', async () => {
            const response = await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .set("user-agent", device)
                .set("x-forwarded-for", ip)
                .send({
                    loginOrEmail: testData.users[0].email,
                    password: testData.usersPassword[0]
                })
                .expect(HttpStatus.OK)
            let setCookieHeader = response.headers['set-cookie'][0];
            let parsedCookie = cookie.parse(setCookieHeader);
            refresh1 = parsedCookie['refreshToken']!;

            await request(app.getHttpServer())
                .get(URL_PATH.devices)
                .set("Cookie", 'refreshToken=' + refresh1)
                .expect(HttpStatus.OK);
        });

        it('should return 200 and new refreshToken for user', async () => {
            const response = await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.refresh))
                .set("Cookie", 'refreshToken=' + refresh1)
                .expect(HttpStatus.OK)

            expect(response.body).toHaveProperty('accessToken');
            const accessToken = response.body.accessToken;

            let setCookieHeader = response.headers['set-cookie'][0];
            let parsedCookie = cookie.parse(setCookieHeader);
            refresh2 = parsedCookie['refreshToken']!;

            const jwtServiceAT = app.get<JwtService>(INJECT_TOKEN.ACCESS_TOKEN);
            const jwtServiceRT = app.get<JwtService>(INJECT_TOKEN.REFRESH_TOKEN);
            const payload = jwtServiceAT.verify(accessToken);
            const payloadRefresh = jwtServiceRT.verify(refresh2);

            expect(+payload.user).toBe(testData.users[0].id);
            expect(payloadRefresh.userId).toBe(testData.users[0].id.toString())
        });

        it('should return 200 after new refreshToken', async () => {
            const sessionResponse = await request(app.getHttpServer())
                .get(URL_PATH.devices)
                .set("Cookie", 'refreshToken=' + refresh2)
                .expect(HttpStatus.OK);
            expect(sessionResponse.body.length).toBe(1);
            expect(sessionResponse.body[0]).toEqual({
                ip: ip,
                title: device,
                lastActiveDate: expect.any(String),
                deviceId: expect.any(String),
            });
        });

        it('should return 401 after old refreshToken', async () => {
            await request(app.getHttpServer())
                .get(URL_PATH.devices)
                .set("Cookie", 'refreshToken=' + refresh1)
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });
})