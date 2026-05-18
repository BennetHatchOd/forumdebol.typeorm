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
import * as cookie from 'cookie';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('DeviceController (e2e)', () => {
    let app: INestApplication;
    let testData: TestDataBuilderByDb;
    let globalPrefix;

    const devices: string[] = ['Poco', 'Sumsung', 'Opera', 'Chrome', 'Firefox', "Honor 15"];
    const ips: string[] = ['254:154:78:6', '127:154:178:6', '24:214:78:216', '254:154:78:116', '254:154:78:96', '254:154:178:118'];
    let accessJwtService: JwtService;
    let refreshJwtService: JwtService;

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
                    })
                    .overrideProvider(ThrottlerGuard)
                    .useValue({
                        canActivate: () => true,
                    }),
        );
        app = result.app;
        testData = result.testData;
        globalPrefix = result.globalPrefix;
        accessJwtService = app.get<JwtService>(INJECT_TOKEN.ACCESS_TOKEN);
        refreshJwtService = app.get<JwtService>(INJECT_TOKEN.REFRESH_TOKEN);

    });

    afterAll(async () => {
        await app.close();
    });

    describe('Create sessions for two user. Testing login and operations for one user', () => {
        let refresh0: string;
        let refresh1: string;
        let deviceId0: string;
        let deviceId1: string;

        beforeAll(async () => {
            testData.clearData();
            testData.numberUsers = 2;
            await testData.createManyUsers();
        })

        afterAll(async () => {
            await deleteAllData(app, globalPrefix);
        })

        it('should return 200 and correct access- and refresh- Tokens for two users', async () => {

            let response = await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .set("user-agent", devices[0])
                .set("x-forwarded-for", ips[0])
                .send({
                    loginOrEmail: testData.users[0].login,
                    password: testData.usersPassword[0]
                })
                .expect(HttpStatus.OK)

            let setCookieHeader = response.headers['set-cookie'][0];
            let parsedCookie = cookie.parse(setCookieHeader);
            refresh0 = parsedCookie['refreshToken']!;

            let payload = accessJwtService.verify(response.body.accessToken);
            expect(payload.user).toBe(testData.users[0].id.toString());
            payload = refreshJwtService.verify(refresh0);
            expect(payload.userId).toBe(testData.users[0].id.toString());

            response = await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .set("user-agent", devices[1])
                .set("x-forwarded-for", ips[1])
                .send({
                    loginOrEmail: testData.users[1].login,
                    password: testData.usersPassword[1]
                })
                .expect(HttpStatus.OK)
            payload = accessJwtService.verify(response.body.accessToken);
            expect(payload.user).toBe(testData.users[1].id.toString());

            setCookieHeader = response.headers['set-cookie'][0];
            parsedCookie = cookie.parse(setCookieHeader);
            refresh1 = parsedCookie['refreshToken']!;
            payload = refreshJwtService.verify(refresh1);
            expect(payload.userId).toBe(testData.users[1].id.toString());
        });

        it('should return 200 and objects with users\' session info', async () => {

            let sessions = await request(app.getHttpServer())
                .get(URL_PATH.devices)
                .set("Cookie", 'refreshToken=' + refresh0)
                .expect(HttpStatus.OK);

            expect(sessions.body.length).toBe(1)
            expect(sessions.body[0]).toEqual({
                ip: ips[0],
                title: devices[0],
                lastActiveDate: expect.any(String),
                deviceId: expect.any(String)
            })
            deviceId0 = sessions.body[0].deviceId;

            sessions = await request(app.getHttpServer())
                .get(URL_PATH.devices)
                .set("Cookie", 'refreshToken=' + refresh1)
                .expect(HttpStatus.OK);
            deviceId1 = sessions.body[0].deviceId;
        })

        it("should return 403 if the second user to try terminate device session of the first user", async () => {

            await request(app.getHttpServer())
                .delete(join(URL_PATH.devices, deviceId1))
                .set("Cookie", 'refreshToken=' + refresh0)
                .expect(HttpStatus.FORBIDDEN);
        })

        it("should return 404 if user tries to kill a non-existent session", async () => {

            await request(app.getHttpServer())
                .delete(join(URL_PATH.devices, "deviceId0"))
                .set("Cookie", 'refreshToken=' + refresh0)
                .expect(HttpStatus.NOT_FOUND);
        })

        it("should return 204 if the user kills session of its device ", async () => {

            await request(app.getHttpServer())
                .delete(join(URL_PATH.devices, deviceId0))
                .set("Cookie", 'refreshToken=' + refresh0)
                .expect(HttpStatus.NO_CONTENT);

            await request(app.getHttpServer())
                .get(URL_PATH.devices)
                .set("Cookie", 'refreshToken=' + refresh0)
                .expect(HttpStatus.UNAUTHORIZED);
        })

        it('should return 204 and logOut', async () => {

            await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.logout))
                .set("Cookie", 'refreshToken=' + refresh1)
                .expect(HttpStatus.NO_CONTENT)

            await request(app.getHttpServer())
                .get(URL_PATH.devices)
                .set("Cookie", 'refreshToken=' + refresh1)
                .expect(HttpStatus.UNAUTHORIZED);
        })
    })

    describe('Create sessions a user with many devices. Testing login and operations get, delete', () => {
        let refreshTokens: string[] = [];
        let deviceIds: string[];

        beforeAll(async () => {
            testData.clearData();
            testData.numberUsers = 2;
            await testData.createManyUsers();
        })

        afterAll(async () => {
            await deleteAllData(app, globalPrefix);
        })


        it('should return 200 and many correct access- and refresh- Tokens for the first user. Use POST', async () => {
            for (let i = 0; i < devices.length; i++) {
                const response = await request(app.getHttpServer())
                    .post(join(URL_PATH.auth, AUTH_PATH.login))
                    .set("user-agent", devices[i])
                    .set("x-forwarded-for", ips[i])
                    .send({
                        loginOrEmail: testData.users[0].login,
                        password: testData.usersPassword[0]
                    })
                    .expect(HttpStatus.OK)
                const accessToken = response.body.accessToken;
                const setCookieHeader = response.headers['set-cookie'][0];
                const parsedCookie = cookie.parse(setCookieHeader);
                const refreshToken = parsedCookie['refreshToken']!;

                refreshTokens.push(refreshToken);

                const payload = accessJwtService.verify(accessToken);
                expect(payload.user).toBe(testData.users[0].id.toString());
                const payloadRT = refreshJwtService.verify(refreshToken);
                expect(payloadRT.userId).toBe(testData.users[0].id.toString());
            }
        });

        it('should return 200 and array of user sessions. Use GET', async () => {

            const sessions = await request(app.getHttpServer())
                .get(URL_PATH.devices)
                .set("Cookie", 'refreshToken=' + refreshTokens[0])
                .expect(HttpStatus.OK);
            expect(sessions.body.length).toBe(devices.length)

            deviceIds = sessions.body.map(session => session.deviceId);
        })

        it("should return 204 if the user kills session of its device ", async () => {

            await request(app.getHttpServer())
                .delete(join(URL_PATH.devices, deviceIds[4]))
                .set("Cookie", 'refreshToken=' + refreshTokens[0])
                .expect(HttpStatus.NO_CONTENT);


            await request(app.getHttpServer())
                .get(URL_PATH.devices)
                .set("Cookie", 'refreshToken=' + refreshTokens[4])
                .expect(HttpStatus.UNAUTHORIZED);

            devices.splice(4, 1);
            deviceIds.splice(4, 1);
            refreshTokens.splice(4, 1);
            ips.splice(4, 1);
        })

        it('should return 204 and logOut', async () => {

            await request(app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.logout))
                .set("Cookie", 'refreshToken=' + refreshTokens[2])
                .expect(HttpStatus.NO_CONTENT)

            await request(app.getHttpServer())
                .get(URL_PATH.devices)
                .set("Cookie", 'refreshToken=' + refreshTokens[2])
                .expect(HttpStatus.UNAUTHORIZED);

            devices.splice(2, 1);
            deviceIds.splice(2, 1);
            refreshTokens.splice(2, 1);
            ips.splice(2, 1);
        })


        it('should return 200 and array of user sessions. Use GET', async () => {

            const sessions = await request(app.getHttpServer())
                .get(URL_PATH.devices)
                .set("Cookie", 'refreshToken=' + refreshTokens[2])
                .expect(HttpStatus.OK);
            expect(sessions.body.length).toBe(devices.length)
            sessions.body.forEach((session, index) => {
                expect(session).toEqual({
                    ip: ips[index],
                    title: devices[index],
                    lastActiveDate: expect.any(String),
                    deviceId: deviceIds[index],
                })
            })
        })

        it("should return 204 if the user kills all sessions. Use DELETE, GET  ", async () => {

            await request(app.getHttpServer())
                .delete(URL_PATH.devices)
                .set("Cookie", 'refreshToken=' + refreshTokens[1])
                .expect(HttpStatus.NO_CONTENT);
            const session = await request(app.getHttpServer())
                .get(URL_PATH.devices)
                .set("Cookie", 'refreshToken=' + refreshTokens[1])
                .expect(HttpStatus.OK);
            expect(session.body.length).toBe(1)
            expect(session.body[0]).toEqual({
                ip: ips[1],
                title: devices[1],
                lastActiveDate: expect.any(String),
                deviceId: deviceIds[1],
            })

        })
    })
})