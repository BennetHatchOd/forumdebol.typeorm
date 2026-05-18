import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import {  URL_PATH } from '@core/url.path.setting';
import { initSettings } from '../helper/init.settings';
import { TestDataBuilderByDb } from '../helper/test.data.builder.by.db';
import { join } from 'path';
import { deleteAllData } from '../helper/delete.all.data';
import { INJECT_TOKEN } from '@core/constans/jwt.tokens';
import { UserConfig } from '@src/modules/users-system/config/user.config';
import { JwtService } from '@nestjs/jwt';
import { defaultUserConfig } from '../helper/default.user.config';

describe('CommentController (e2e)', () => {
    let app: INestApplication;
    let testData: TestDataBuilderByDb;
    let globalPrefix;
    const content: string[] = [
        "comment for post number 1",
        "comment for post number 2",
        "comment for post number 3",]
    const commentIds: string[] = [];
    beforeAll(async () => {
        const result
            = await initSettings((moduleBuilder) =>
            moduleBuilder
                .overrideProvider(INJECT_TOKEN.ACCESS_TOKEN)
                .useFactory({
                    factory: (userConfig: UserConfig) => {
                        return new JwtService({
                            secret: userConfig.accessTokenSecret,
                            signOptions: { expiresIn: '15s' },
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
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Testing create comments. Edit and delete comments', () => {
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 2;
            testData.numberPosts = 2;
            testData.numberComments = 5;
            await testData.createManyAccessTokens();
            await testData.createManyComment();

        })

        afterAll(async () => {
            await deleteAllData(app, globalPrefix);
        })

        it('should return 201 and a created comment', async () => {

            const response = await request(app.getHttpServer())
                .post(join(URL_PATH.posts, testData.posts[1].id.toString(), "comments"))
                .set("Authorization", 'Bearer ' + testData.accessTokens[1])
                .send({
                    content: content[0],
                })
                .expect(HttpStatus.CREATED)
            expect(response.body).toEqual({
                id: expect.any(String),
                content: content[0],
                commentatorInfo: {
                    userId: testData.users[1].id.toString(),
                    userLogin: testData.users[1].login
                },
                createdAt: expect.any(String),
                likesInfo: expect.any(Object)
            })
            commentIds.push(response.body.id);
        });

        it('should return 200 and the found comment', async () => {
            const response = await request(app.getHttpServer())
                .get(join(URL_PATH.comments, commentIds[0]))
                .expect(HttpStatus.OK)
            expect(response.body).toEqual({
                id: commentIds[0],
                content: content[0],
                commentatorInfo: {
                    userId: testData.users[1].id.toString(),
                    userLogin: testData.users[1].login
                },
                createdAt: expect.any(String),
                likesInfo: {
                    likesCount: 0,
                    dislikesCount: 0,
                    myStatus: "None"
                }
            })
        })

        it('should return 204 after editing comment', async () => {
                const response = await request(app.getHttpServer())
                    .put(join(URL_PATH.comments, commentIds[0]))
                    .set("Authorization", 'Bearer ' + testData.accessTokens[1])
                    .send({
                        content: content[1],
                    })
                    .expect(HttpStatus.NO_CONTENT)
                expect(response.body).toEqual({})
            }
        )
        it('should return 204 after deleting and 404 after get this comment', async () => {
            await request(app.getHttpServer())
                .delete(join(URL_PATH.comments, commentIds[0]))
                .set("Authorization", 'Bearer ' + testData.accessTokens[1])
                .expect(HttpStatus.NO_CONTENT)
            await request(app.getHttpServer())
                .get(join(URL_PATH.comments, commentIds[0]))
                .set("Authorization", 'Bearer ' + testData.accessTokens[1])
                .expect(HttpStatus.NOT_FOUND)
        })

    })

    describe('Testing paginator for comments', () => {
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 2;
            testData.numberPosts = 2;
            testData.numberComments = 10;
            await testData.createManyAccessTokens();
            await testData.createManyComment();

        })

        afterAll(async () => {
            await deleteAllData(app, globalPrefix);
        })

        it('should return 200 and create many comments for the second post', async () => {
            for (let i = 0; i <= 5; i++)
                await request(app.getHttpServer())
                    .post(join(URL_PATH.posts, testData.posts[1].id.toString(), "comments"))
                    .set("Authorization", 'Bearer ' + testData.accessTokens[1])
                    .send({
                        content: 'this text not have any sense ' + `${i}`,
                    })
                    .expect(HttpStatus.CREATED)
        })
        it('should return 200 and a paginator', async () => {
            const response = await request(app.getHttpServer())
                .get(join(URL_PATH.posts, testData.posts[0].id.toString(), "comments"))
                .query({ pageSize: 4 })
                .expect(HttpStatus.OK)
            expect(response.body).toEqual({
                pagesCount: 3,
                page: 1,
                pageSize: 4,
                totalCount: 10,
                items: expect.any(Array)
            })
            expect(response.body.items.length).toBe(4)
        })
        it('should return 204 and a paginator', async () => {
            const response = await request(app.getHttpServer())
                .get(join(URL_PATH.posts, testData.posts[1].id.toString(), "comments"))
                .query({ pageSize: 12 })
                .expect(HttpStatus.OK)
            expect(response.body).toEqual({
                pagesCount: 1,
                page: 1,
                pageSize: 12,
                totalCount: 6,
                items: expect.any(Array)
            })
            expect(response.body.items.length).toBe(6)
        })
    })

    describe('Testing create, edit and delete comments with some wrongs', () => {
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 2;
            testData.numberPosts = 2;
            testData.numberComments = 2;
            await testData.createManyAccessTokens();
            await testData.createManyComment();

        })

        afterAll(async () => {
            await deleteAllData(app, globalPrefix);
        })

        it('should return 400 if we send wrong content', async () => {
            await request(app.getHttpServer())
                .put(join(URL_PATH.comments, testData.comments[0].id.toString()))
                .set("Authorization", 'Bearer ' + testData.accessTokens[0])
                .send({
                    contents: 'this text not have any sense ',
                })
                .expect(HttpStatus.BAD_REQUEST)
        })
        it('should return 401 if user not authorization', async () => {
            await request(app.getHttpServer())
                .put(join(URL_PATH.comments, testData.comments[0].id.toString()))
                .set("Authorization", 'Bearer ' + 'jj')
                .send({contents: 'this text not have any sense ' })
                .expect(HttpStatus.UNAUTHORIZED)
            await request(app.getHttpServer())
                .delete(join(URL_PATH.comments, testData.comments[0].id.toString()))
                .expect(HttpStatus.UNAUTHORIZED)
        })
        it("should return 403 if user edit or delete someone else's we send wrong content", async () => {
            await request(app.getHttpServer())
                .put(join(URL_PATH.comments, testData.comments[0].id.toString()))
                .set("Authorization", 'Bearer ' + testData.accessTokens[1])
                .send({ content: 'this text not have any sense ' })
                .expect(HttpStatus.FORBIDDEN)
            await request(app.getHttpServer())
                .delete(join(URL_PATH.comments, testData.comments[0].id.toString()))
                .set("Authorization", 'Bearer ' + testData.accessTokens[1])
                .expect(HttpStatus.FORBIDDEN)
        })

        it('should return 404 if comment not exist', async () => {
            await request(app.getHttpServer())
                .put(join(URL_PATH.comments, "testData"))
                .set("Authorization", 'Bearer ' + testData.accessTokens[1])
                .send({ content: 'this text not have any sense ' })
                .expect(HttpStatus.NOT_FOUND)
            await request(app.getHttpServer())
                .delete(join(URL_PATH.comments, "testData"))
                .set("Authorization", 'Bearer ' + testData.accessTokens[1])
                .expect(HttpStatus.NOT_FOUND)
            await request(app.getHttpServer())
                .get(join(URL_PATH.comments, "testData"))
                .expect(HttpStatus.NOT_FOUND)
        })
    })
})