import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestDataBuilderByDb } from '../helper/test.data.builder.by.db';
import { initSettings } from '../helper/init.settings';
import { INJECT_TOKEN } from '@core/constans/jwt.tokens';
import { UserConfig } from '@modules/users-system/config/user.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from '../helper/delete.all.data';
import request from 'supertest';
import { join } from 'path';
import { URL_PATH } from '@core/url.path.setting';
import { setCheckLikeComment } from './likesHelper/set.check.Like.comment';
import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';
import { defaultUserConfig } from '../helper/default.user.config';

describe('LikeCommentController (e2e)', () => {
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
                            signOptions: { expiresIn: '1m' },
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

    describe('Send likes and dislikes for a comment', () => {
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 2;
            testData.numberComments = 1;
            await testData.createManyComment();
            await testData.createManyAccessTokens();
        })

        afterAll(async () => {
            await deleteAllData(app, globalPrefix);
        })

        it('should set likes/dislikes for a comment by one user and return likesInfo', async () => {

            let status = Rating.Like
            expect(await setCheckLikeComment(app, testData.comments[0].id.toString(), testData.accessTokens[1], status))
                .toEqual({
                    likesCount: 1,
                    dislikesCount: 0,
                    myStatus: status
                })

            status = Rating.Dislike
            expect(await setCheckLikeComment(app, testData.comments[0].id.toString(), testData.accessTokens[1], status))
                .toEqual({
                    likesCount: 0,
                    dislikesCount: 1,
                    myStatus: status
                })

            status = Rating.None
            expect(await setCheckLikeComment(app, testData.comments[0].id.toString(), testData.accessTokens[1], status))
                .toEqual({
                    likesCount: 0,
                    dislikesCount: 0,
                    myStatus: status
                })

            status = Rating.Like
            expect(await setCheckLikeComment(app, testData.comments[0].id.toString(), testData.accessTokens[1], status))
                .toEqual({
                    likesCount: 1,
                    dislikesCount: 0,
                    myStatus: status
                })
            status = Rating.Like
            expect(await setCheckLikeComment(app, testData.comments[0].id.toString(), testData.accessTokens[1], status))
                .toEqual({
                    likesCount: 1,
                    dislikesCount: 0,
                    myStatus: status
                })
            status = Rating.Like
            expect(await setCheckLikeComment(app, testData.comments[0].id.toString(), testData.accessTokens[1], status))
                .toEqual({
                    likesCount: 1,
                    dislikesCount: 0,
                    myStatus: status
                })

        });

        it('should return the like status for an unauthorized user', async () => {

            const commentResponce = await request(app.getHttpServer())
                .get(join(URL_PATH.comments, testData.comments[0].id.toString()))
                .expect(HttpStatus.OK);
            expect(commentResponce.body.likesInfo).toEqual({
                likesCount: 1,
                dislikesCount: 0,
                myStatus: Rating.None
            })
        })
    })

    describe('Send likes and dislikes for a comment by many users', () => {
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 8;
            testData.numberComments = 1;
            await testData.createManyComment();
            await testData.createManyAccessTokens();
        })

        afterAll(async () => {
            await deleteAllData(app, globalPrefix);
        })

        it('should set likes/dislikes for a comment by many users and return likesInfo', async() => {
            let status = Rating.Like
            expect(await setCheckLikeComment(app, testData.comments[0].id.toString(), testData.accessTokens[1], status))
                .toEqual({
                    likesCount: 1,
                    dislikesCount: 0,
                    myStatus: status })
            status = Rating.Like
            expect(await setCheckLikeComment(app, testData.comments[0].id.toString(), testData.accessTokens[0], status))
                .toEqual({ likesCount: 2,
                    dislikesCount: 0,
                    myStatus: status })
            status = Rating.Like
            expect(await setCheckLikeComment(app, testData.comments[0].id.toString(), testData.accessTokens[2], status))
                .toEqual({ likesCount: 3,
                    dislikesCount: 0,
                    myStatus: status })
            status = Rating.Dislike
            expect(await setCheckLikeComment(app, testData.comments[0].id.toString(), testData.accessTokens[3], status))
                .toEqual({ likesCount: 3,
                    dislikesCount: 1,
                    myStatus: status })
            status = Rating.Dislike
            expect(await setCheckLikeComment(app, testData.comments[0].id.toString(), testData.accessTokens[4], status))
                .toEqual({ likesCount: 3,
                    dislikesCount: 2,
                    myStatus: status })
            status = Rating.Dislike
            expect(await setCheckLikeComment(app, testData.comments[0].id.toString(), testData.accessTokens[5], status))
                .toEqual({ likesCount: 3,
                    dislikesCount: 3,
                    myStatus: status })
            status = Rating.Dislike
            expect(await setCheckLikeComment(app, testData.comments[0].id.toString(), testData.accessTokens[6], status))
                .toEqual({ likesCount: 3,
                    dislikesCount: 4,
                    myStatus: status })
        })


    })

    describe('Send likes and dislikes for many comment by many users', () => {
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 8;
            testData.numberComments = 4;
            await testData.createManyComment();
            await testData.createManyAccessTokens();
        })

        afterAll(async () => {
        await deleteAllData(app, globalPrefix);
    })

        it('should return many likeInfo for comments', async() => {

            let status = Rating.Like
            let users = [
                        [0, 1, 2, 5 ],// какие юзеры поставили Лайк 0 комментарию
                        [0, 1, 3, 4, 5, 6 ,7],
                        [0, 2, 3, 4],
                        [2, 5]
                        ]
            for(let i = 0; i < testData.numberComments; i++){
                for (let user of users[i]){
                    await setCheckLikeComment(app, testData.comments[i].id.toString(), testData.accessTokens[user], status)
                }
            }
            status = Rating.Dislike

            users = [
                    [0, 4, 5, 6, 7],
                    [2],
                    [0, 1, 5, 6],
                    [0, 1, 2, 3, 4, 4, 5, 6]
                    ]
            for(let i = 0; i < testData.numberComments; i++){
                for (let user of users[i]){
                    await setCheckLikeComment(app, testData.comments[i].id.toString(), testData.accessTokens[user], status)
                }
            }

            status = Rating.None
            users = [
                    [4],
                    [3],
                    [6, 1],
                    [2]
                    ]
            for(let i = 0; i < testData.numberComments; i++){
                for (let user of users[i]){
                    await setCheckLikeComment(app, testData.comments[i].id.toString(), testData.accessTokens[user], status)
                }
            }

            let commentResponce = await request(app.getHttpServer())
                .get(join(URL_PATH.comments,testData.comments[0].id.toString()))
                .set("Authorization", 'Bearer ' + testData.accessTokens[3])
            expect(commentResponce.body.likesInfo).toEqual({ likesCount: 2,
                                                            dislikesCount: 4,
                                                            myStatus: Rating.None })

            commentResponce = await request(app.getHttpServer())
                .get(join(URL_PATH.comments,testData.comments[1].id.toString()))
                .set("Authorization", 'Bearer ' + testData.accessTokens[4])
            expect(commentResponce.body.likesInfo).toEqual({ likesCount: 6,
                                                            dislikesCount: 1,
                                                            myStatus: Rating.Like })

            commentResponce = await request(app.getHttpServer())
                .get(join(URL_PATH.comments,testData.comments[2].id.toString()))
                .set("Authorization", 'Bearer ' + testData.accessTokens[4])
            expect(commentResponce.body.likesInfo).toEqual({ likesCount: 3,
                                                            dislikesCount: 2,
                                                            myStatus: Rating.Like })

            commentResponce = await request(app.getHttpServer())
                .get(join(URL_PATH.comments,testData.comments[3].id.toString()))
                .set("Authorization", 'Bearer ' + testData.accessTokens[5])
            expect(commentResponce.body.likesInfo).toEqual({ likesCount: 0,
                                                            dislikesCount: 6,
                                                            myStatus: Rating.Dislike })

            // check for non authorization user
            commentResponce = await request(app.getHttpServer())
                .get(join(URL_PATH.comments,testData.comments[2].id.toString()))
            expect(commentResponce.body.likesInfo).toEqual({ likesCount: 3,
                                                            dislikesCount: 2,
                                                            myStatus: Rating.None })
        })
        it('Get all comments', async() => {

            const commentResponce = await request(app.getHttpServer())
                .get(join(URL_PATH.posts, testData.posts[0].id.toString(), "comments"))
                .set("Authorization", 'Bearer ' + testData.accessTokens[2])
                .expect(HttpStatus.OK)

        expect(commentResponce.body.items[3].likesInfo).toEqual({ likesCount: 2,
                                                        dislikesCount: 4,
                                                        myStatus: Rating.Like })
        expect(commentResponce.body.items[2].likesInfo).toEqual({ likesCount: 6,
                                                        dislikesCount: 1,
                                                        myStatus: Rating.Dislike })
        expect(commentResponce.body.items[1].likesInfo).toEqual({ likesCount: 3,
                                                        dislikesCount: 2,
                                                        myStatus: Rating.Like })
        expect(commentResponce.body.items[0].likesInfo).toEqual({ likesCount: 0,
                                                        dislikesCount: 6,
                                                        myStatus: Rating.None })
        });
    })

    describe('Send likes and dislikes comment with errors', () => {
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberUsers = 1;
            testData.numberComments = 1;
            await testData.createManyComment();
            await testData.createManyAccessTokens();
        })

        afterAll(async () => {
            await deleteAllData(app, globalPrefix);
        })

        it('should return 401 if user is not logged in', async() => {
            const response = await request(app.getHttpServer())
                .put(join(URL_PATH.comments, testData.comments[0].id.toString(), 'like-status'))
                .set("Authorization", 'Bearer ' + "ghfgg")
                .send({likeStatus: Rating.Like })
                .expect(HttpStatus.UNAUTHORIZED);
        })
        it('should return 404 if comment not exist', async() => {
            const response = await request(app.getHttpServer())
                .put(join(URL_PATH.comments, '5346345', 'like-status'))
                .set("Authorization", 'Bearer ' + testData.accessTokens[0])
                .send({likeStatus: Rating.Like })
                .expect(HttpStatus.NOT_FOUND);
        })

        it('should return 400 if send not {likesStatus:Rating}', async() => {
            let response = await request(app.getHttpServer())
                .put(join(URL_PATH.comments, testData.comments[0].id.toString(), 'like-status'))
                .set("Authorization", 'Bearer ' + testData.accessTokens[0])
                .send({likeStatus: 'like' })
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body.errorsMessages.length).toBe(1)
            expect(response.body.errorsMessages[0]).toEqual({
                                                        message: expect.any(String),
                                                        field: "likeStatus"
                                                    })

            response = await request(app.getHttpServer())
                .put(join(URL_PATH.comments, testData.comments[0].id.toString(), 'like-status'))
                .set("Authorization", 'Bearer ' + testData.accessTokens[0])
                .send({likesStatus: Rating.Like })
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body.errorsMessages[0]).toEqual({
                message: expect.any(String),
                field: "likeStatus"})

            response = await request(app.getHttpServer())
                .put(join(URL_PATH.comments, testData.comments[0].id.toString(), 'like-status'))
                .set("Authorization", 'Bearer ' + testData.accessTokens[0])
                .send({likes: "Like" })
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body.errorsMessages.length).toBe(1)
            expect(response.body.errorsMessages[0]).toEqual({
                message: expect.any(String),
                field: "likeStatus"
            })
        })
    })
})
