import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Connection } from 'mongoose';
import { AUTH_PATH, URL_PATH } from '@core/url.path.setting';
import { initSettings } from '../helper/init.settings';
import { TestDataBuilderByDb } from '../helper/test.data.builder.by.db';
import { join } from 'path';
import { deleteAllData } from '../helper/delete.all.data';
import { ThrottlerGuard } from '@nestjs/throttler';
import console from 'node:console';

describe('UserAppController (e2e)', () => {
    let app: INestApplication;
    let testData: TestDataBuilderByDb;
    let globalPrefix;

    beforeAll(async () => {
        const result
            = await initSettings((moduleBuilder) =>
                moduleBuilder
                    .overrideProvider(ThrottlerGuard)
                    .useValue({
                        canActivate: () => true,
                    }),
        );
        app = result.app;
        testData = result.testData;
        globalPrefix = result.globalPrefix;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Testing api/users \n' +
        'scenario: get -> create -> search -> delete -> get  ', () => {
        const newUser = {
            login: 'iouiu',
            email: 'hjuhPTK@fhjuh.com',
            password: 'gtghhTgg'};
        const newUser2 = {
            login: 'tydjh',
            email: 'hjuhpPTK@hjuh.com',
            password: 'gtghhTgg'};
        let id1: string;
        let id2: string;

        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 8;
            await testData.createManyAccessTokens();
        })

        afterAll(async () => {
        })
        it('should return 200 status and a paginator initially', async () => {
            const response = await request(app.getHttpServer())
                .get(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.OK)

            expect(response.body).toEqual({
                pagesCount: 1,
                page: 1,
                pageSize: 10,
                totalCount: testData.numberUsers,
                items: expect.any(Array)
            });
        });

        it('should return 201 status and create new users', async () => {
            let response = await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send(newUser)
                .expect(HttpStatus.CREATED)

            expect(response.body).toEqual({
                login: newUser.login,
                email: newUser.email,
                id:     expect.any(String),
                createdAt: expect.any(String),
            });
            id1 = response.body.id;

            response = await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send(newUser2)
                .expect(HttpStatus.CREATED)
            id2 = response.body.id;
        });

        it("should return users filtered by login/email search", async () => {
            let response = await request(app.getHttpServer())
                .get(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .query({searchLoginTerm: 'io'})
                .expect(HttpStatus.OK)

            expect(response.body).toEqual({
                pagesCount: 1,
                page: 1,
                pageSize: 10,
                totalCount: 1,
                items: [{
                    login: newUser.login,
                    email: newUser.email,
                    id:     expect.any(String),
                    createdAt: expect.any(String),
                }]
            });

            response = await request(app.getHttpServer())
                .get(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .query({searchEmailTerm: 'pTk', sortDirection: 'asc'})
                .expect(HttpStatus.OK)

            expect(response.body).toEqual({
                pagesCount: 1,
                page: 1,
                pageSize: 10,
                totalCount: 2,
                items: [{
                    login: newUser.login,
                    email: newUser.email,
                    id:     expect.any(String),
                    createdAt: expect.any(String)},
                    {login: newUser2.login,
                    email: newUser2.email,
                    id:     expect.any(String),
                    createdAt: expect.any(String)}
                ]
            });
        });

        it('should delete created users and return 204', async () => {
            await request(app.getHttpServer())
                .delete(join(URL_PATH.usersAdmin, id1))
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.NO_CONTENT)

            await request(app.getHttpServer())
                .delete(join(URL_PATH.usersAdmin, id2))
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.NO_CONTENT)
        })

        it('should return 200 status and a paginator initially too', async () => {
            const response = await request(app.getHttpServer())
                .get(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.OK)

            expect(response.body).toEqual({
                pagesCount: 1,
                page: 1,
                pageSize: 10,
                totalCount: testData.numberUsers,
                items: expect.any(Array)
            });
        });
    })

    describe('Testing api/users with mistakes.', () => {
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 2;
            await testData.createManyUsers();
        })

        afterAll(async () => {
        })
        it("should return 400 and an array of mistakes by attempt to create new " +
            "user with validation error", async () => {

            const response = await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send({ login: 'hj',
                    email: 'hjuh@hjuh.com',
                    password: 'gtghhTgg6ytghujikutghikkk'})
                .expect(HttpStatus.BAD_REQUEST)

            expect(response.body).toEqual({"errorsMessages": [
                    {message: expect.any(String),
                        field: "login"},
                    {message: expect.any(String),
                        field: "password"}
                ]
            });
        });

        it("should return 400 and an array of mistakes by attempt to create new " +
            "user with exist login or email", async () => {
            const  user = {
                login: 'hjft',
                email: 'hjyJ@hjuh.jhgp.com',
                password: 'gt45hTgg6ytDFTkkk'}

            await request(app.getHttpServer())
                .post(join(URL_PATH.auth,AUTH_PATH.registration))
                .send(user)
                .expect(HttpStatus.NO_CONTENT)

            let response = await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send({
                    login: testData.users[0].login,
                    email: 'hjuh1@hjuh.com',
                    password: 'gttghujikutghikkk'})
                .expect(HttpStatus.BAD_REQUEST)

            expect(response.body).toEqual({"errorsMessages": [{
                message: expect.any(String),
                field: "login"}]
            });

            response = await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send({
                    login: 'hjws5',
                    email: testData.users[0].email,
                    password: 'gtghhTgg6ytghujikk'})
                .expect(HttpStatus.BAD_REQUEST)

            expect(response.body).toEqual({"errorsMessages": [{
                message: expect.any(String),
                field: "email"}]
            });

            response = await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send({
                    login: user.login,
                    email: 'hjuh4@hjuh.com',
                    password: 'gtjikutghikkk'})
                .expect(HttpStatus.BAD_REQUEST)

            expect(response.body).toEqual({"errorsMessages": [{
                message: expect.any(String),
                field: "login"},]
            });

            response = await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send({
                    login: 'hjsd52',
                    email: user.email,
                    password: 'gtghhTkutghikkk'})
                .expect(HttpStatus.BAD_REQUEST)

            expect(response.body).toEqual({"errorsMessages": [{
                message: expect.any(String),
                field: "email"},]
            });
        });

        it("should return 404 by attempt to access user's endpoint with authorization error.", async () => {

            await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", "Bearer FGRFdfsfdf")
                .send({ login: 'hj',
                    email: 'hjuh@hjuh.com',
                    password: 'gtghhTgg6ytghujikutghikkk'})
                .expect(HttpStatus.UNAUTHORIZED)
            await request(app.getHttpServer())
                .get(URL_PATH.usersAdmin)
                .expect(HttpStatus.UNAUTHORIZED)
            await request(app.getHttpServer())
                .delete(join(URL_PATH.usersAdmin, '6814e896da2168245826d049'))
                .set("Authorization", "Bearer FGRFdfsfdf")
                .expect(HttpStatus.UNAUTHORIZED)
        });

        it("should return 404 by attempt to delete fake user", async () => {

            await request(app.getHttpServer())
                .delete(join(URL_PATH.usersAdmin, '452'))
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.NOT_FOUND)
        });

        it("should return 404 by attempt to delete user by not valide id.", async () => {

            const dd = await request(app.getHttpServer())
                .delete(join(URL_PATH.usersAdmin, '681896da2168245826d049'))
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.NOT_FOUND)
        });

    })

    describe('Testing paginator for api/users.', () => {
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 2;
            await testData.createManyUsers();
        })

        afterAll(async () => {
        })
        it("should return 400 and an array of mistakes by attempt to create new " +
            "user with validation error", async () => {

            const response = await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send({ login: 'hj',
                    email: 'hjuh@hjuh.com',
                    password: 'gtghhTgg6ytghujikutghikkk'})
                .expect(HttpStatus.BAD_REQUEST)

            expect(response.body).toEqual({"errorsMessages": [
                    {message: expect.any(String),
                        field: "login"},
                    {message: expect.any(String),
                        field: "password"}
                ]
            });
        });

        it("should return 400 and an array of mistakes by attempt to create new " +
            "user with exist login or email", async () => {
            const  user = {
                login: 'hjft',
                email: 'hjyJ@hjuh.jhgp.com',
                password: 'gt45hTgg6ytDFTkkk'}

            await request(app.getHttpServer())
                .post(join(URL_PATH.auth,AUTH_PATH.registration))
                .send(user)
                .expect(HttpStatus.NO_CONTENT)

            let response = await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send({
                    login: testData.users[0].login,
                    email: 'hjuh1@hjuh.com',
                    password: 'gttghujikutghikkk'})
                .expect(HttpStatus.BAD_REQUEST)

            expect(response.body).toEqual({"errorsMessages": [{
                    message: expect.any(String),
                    field: "login"}]
            });

            response = await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send({
                    login: 'hjws5',
                    email: testData.users[0].email,
                    password: 'gtghhTgg6ytghujikk'})
                .expect(HttpStatus.BAD_REQUEST)

            expect(response.body).toEqual({"errorsMessages": [{
                    message: expect.any(String),
                    field: "email"}]
            });

            response = await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send({
                    login: user.login,
                    email: 'hjuh4@hjuh.com',
                    password: 'gtjikutghikkk'})
                .expect(HttpStatus.BAD_REQUEST)

            expect(response.body).toEqual({"errorsMessages": [{
                    message: expect.any(String),
                    field: "login"},]
            });

            response = await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send({
                    login: 'hjsd52',
                    email: user.email,
                    password: 'gtghhTkutghikkk'})
                .expect(HttpStatus.BAD_REQUEST)

            expect(response.body).toEqual({"errorsMessages": [{
                    message: expect.any(String),
                    field: "email"},]
            });
        });

        it("should return 404 by attempt to access user's endpoint with authorization error.", async () => {

            await request(app.getHttpServer())
                .post(URL_PATH.usersAdmin)
                .set("Authorization", "Bearer FGRFdfsfdf")
                .send({ login: 'hj',
                    email: 'hjuh@hjuh.com',
                    password: 'gtghhTgg6ytghujikutghikkk'})
                .expect(HttpStatus.UNAUTHORIZED)
            await request(app.getHttpServer())
                .get(URL_PATH.usersAdmin)
                .expect(HttpStatus.UNAUTHORIZED)
            await request(app.getHttpServer())
                .delete(join(URL_PATH.usersAdmin, '6814e896da2168245826d049'))
                .set("Authorization", "Bearer FGRFdfsfdf")
                .expect(HttpStatus.UNAUTHORIZED)
        });

        it("should return 404 by attempt to delete fake user", async () => {

            await request(app.getHttpServer())
                .delete(join(URL_PATH.usersAdmin, '6814e896da2168245826d049'))
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.NOT_FOUND)
        });

        it("should return 400 by attempt to delete user by not valide id.", async () => {

            await request(app.getHttpServer())
                .delete(join(URL_PATH.usersAdmin, '681896da2168245826d049'))
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.NOT_FOUND)
        });

    })
});

