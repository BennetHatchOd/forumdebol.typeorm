import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initSettings } from '../helper/init.settings';
import { defaultUserConfig } from '../helper/default.user.config';
import { TestDataBuilderByDb } from 'test/helper/test.data.builder.by.db';
import { UserConfig } from '@src/modules/users-system/config/user.config';
import { deleteAllData } from '../helper/delete.all.data';
import { URL_PATH } from '@core/url.path.setting';
import { join } from 'path';


describe('QuestionController (e2e)', () => {
    let app: INestApplication;
    let testData: TestDataBuilderByDb;
    let globalPrefix;
    let question;

    beforeAll(async () => {
        const result
            = await initSettings((moduleBuilder) =>
            moduleBuilder
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

    describe('Testing simple CRUD question.\n' +
        'scenario this block of tests:\n ' +
        'post - get - put{id} - get - publish -get' +
        ' - delete{id} - get', () => {

        question = {
            "body": "qwerasdfzxcv",
            "correctAnswers": ['string1', 'string2']}

        let questionId: string;
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
        })

        afterAll(async () => {
        })

        it('should return 201 and a created question', async () => {

            const response = await request(app.getHttpServer())
                .post(URL_PATH.questions)
                .set("Authorization", testData.authLoginPassword)
                .send(question)
                .expect(HttpStatus.CREATED)

            expect(response.body).toEqual({
                id: expect.any(String),
                body: question.body,
                correctAnswers: question.correctAnswers,
                "published": false,
                createdAt: expect.any(String),
                updatedAt: null,
            })
            questionId = response.body.id;
        });

        it('should return 200 and the found question', async () => {
            const response = await request(app.getHttpServer())
                .get(join(URL_PATH.questions))
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.OK)
            expect(response.body.items[0]).toEqual({
                id: questionId,
                body: question.body,
                correctAnswers: question.correctAnswers,
                "published": false,
                createdAt: expect.any(String),
                updatedAt: null,
            })
        })

        it('should return 204 and 200 after check editing question', async () => {
            question = {
                "body": "111111111111",
                "correctAnswers": ['00001', '0000002']
            }
            await request(app.getHttpServer())
                .put(join(URL_PATH.questions, questionId))
                .set("Authorization", testData.authLoginPassword)
                .send(question)
                .expect(HttpStatus.NO_CONTENT)

            const response = await request(app.getHttpServer())
                .get(join(URL_PATH.questions))
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.OK)
            expect(response.body.items[0]).toEqual({
                id: questionId,
                body: question.body,
                correctAnswers: question.correctAnswers,
                "published": false,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            })
        })

        it('should return 204 after publish and unpublish this question', async () => {
            await request(app.getHttpServer())
                .put(join(URL_PATH.questions, questionId,'publish'))
                .set("Authorization", testData.authLoginPassword)
                .send({"published": true})
                .expect(HttpStatus.NO_CONTENT)
            const response = await request(app.getHttpServer())
                .get(join(URL_PATH.questions))
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.OK)
            expect(response.body.items[0]).toEqual({
                id: questionId,
                body: question.body,
                correctAnswers: question.correctAnswers,
                "published": true,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            })
        })




        it('should return 204 after deleting and 404 after get this question', async () => {
            await request(app.getHttpServer())
                .delete(join(URL_PATH.questions, questionId))
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.NO_CONTENT)
            const response = await request(app.getHttpServer())
                .get(join(URL_PATH.questions))
                .set("Authorization", testData.authLoginPassword)
            expect(response.body).toEqual({
                items: [],
                page: 0,
                pageSize: 0,
                pagesCount: 0,
                totalCount: 0,
            })
        })

    })

    describe('Testing paginator for question', () => {
        const questions = [
            {"body": "ghfdghff GnUSkhjqwerasdfzxcv",
                "correctAnswers": ['string1', 'string2'],
                published: true,},
            {"body": "hdffdg khghg kjg jghghjqwegredhzxcv",
                "correctAnswers": ['string3', 'string4'],
                published: false,},
            {"body": "wed56ggfzxcv",
                "correctAnswers": ['string5', 'string6'],
                published: false,},
            {"body": "7ughyyt rasdfzxcvGnUS",
                "correctAnswers": ['string7', 'string8'],
                published: true,},
            {"body": "ftgqwer asdfzxcv",
                "correctAnswers": ['string9', 'string0'],
                published: true,},
            {"body": "dghfqwerashgglt8 8GnUS08 dfzxcv",
                "correctAnswers": ['strin10', 'strin11', 'hju'],
                published: false,},
            {"body": "qwweerasty uhdfzxcv",
                "correctAnswers": ['strin11', 'strin12', 'gggf', 'rty'],
                published: false,},
            {"body": "qwErljh aykk sdfzGnUSxcv",
                "correctAnswers": ['strin13', 'strin14'],
                published: true,},
            {"body": "GnUSq whuklkl hll hkjhkj erasdfzxcv",
                "correctAnswers": ['strin15', 'strin16'],
                published: true,},
            {"body": "qw hkh hhjlk herasdfzxcv",
                "correctAnswers": ['string1', 'string2'],
                published: false,},
            {"body": "fgQwerjaGnUSs jjd  f ujzxcv",
                "correctAnswers": ['string1', 'string2'],
                published: false,},
            {"body": "juqwrasdmfzxGnUScv",
                "correctAnswers": ['string1', 'string2'],
                published: true,},
            {"body": "qwettir uuhmasdfzxcGnUSv",
                "correctAnswers": ['string1', 'string2'],
                published: false,},
            {"body": "qwerasdfqwerj zxGnUScv",
                "correctAnswers": ['string1', 'string2'],
                published: true,}
            ];
        let pagesCount: number;
        let page: number;
        let pageSize: number;
        let totalCount: number;

        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            pagesCount = Math.floor((questions.length - 1) / 10) + 1;
            page = 1;
            pageSize = 10;
            totalCount = questions.length;
            await testData.writeQuestionsToDB(questions);
        })

        afterAll(async () => {
        })

        it('should return 200 and a list of questions with default paginator', async () => {
            const response = await request(app.getHttpServer())
                .get(URL_PATH.questions)
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.OK)

            expect(response.body).toEqual({
                pagesCount: pagesCount,
                page: page,
                pageSize: pageSize,
                totalCount: totalCount,
                items: expect.any(Array)
            });
            expect(response.body.items[0]).toEqual({
                id: expect.any(String),
                body: questions.at(-1)!.body,
                correctAnswers: questions.at(-1)!.correctAnswers,
                createdAt: expect.any(String),
                updatedAt: null,
                published: questions.at(-1)!.published
            })

        })

        it('should return 200 and a paginator with pageSize, pageNumber ', async () => {
            const response = await request(app.getHttpServer())
                .get(URL_PATH.questions)
                .query({
                    pageSize: 4,
                    pageNumber: 15
                })
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.OK)
            expect(response.body).toEqual({
                pagesCount: Math.floor((questions.length - 1) / 4) + 1,
                page: Math.floor((questions.length - 1) / 4) + 1,
                pageSize: 4,
                totalCount: totalCount,
                items: expect.any(Array)
            })
            expect(response.body.items.length).toBe(totalCount - 4 * (Math.floor((questions.length - 1) / 4)));
        })

        it('should return 200 and a paginator with bodySearchTerm', async () => {
            const response = await request(app.getHttpServer())
                .get(URL_PATH.questions)
                .query({
                    pageSize: 5,
                    pageNumber: 1,
                    bodySearchTerm: 'qwer',
                    sortBy: 'id',
                    sortDirection: 'asc'
                })
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.OK);
            expect(response.body).toEqual({
                pagesCount: 2,
                page: 1,
                pageSize: 5,
                totalCount: 6,
                items: expect.any(Array)
            });
            expect(response.body.items.length).toBe(5)
        })

        it('should return 200 and a paginator with bodySearchTerm and publishedStatus', async () => {

            const response = await request(app.getHttpServer())
                .get(URL_PATH.questions)
                .set("Authorization", testData.authLoginPassword)
                .query({
                    pageSize: 10,
                    pageNumber: 1,
                    publishedStatus: 'notPublished',
                    bodySearchTerm: 'gnus'
                })
            expect(response.body).toEqual({
                pagesCount: 1,
                page: 1,
                pageSize: 10,
                totalCount: 3,
                items: expect.any(Array)
            });
            expect(response.body.items.length).toBe(3)
        })
    })

    //
    // describe('Testing create, edit and delete questions with some wrongs', () => {
    //     beforeAll(async () => {
    //         testData.clearData();
    //         await deleteAllData(app, globalPrefix);
    //     })
    //
    //     afterAll(async () => {
    //     })
    //
    //     it('should return 400 if we send wrong content', async () => {
    //         const response = await request(app.getHttpServer())
    //             .post(URL_PATH.questions)
    //             .set("Authorization", testData.authLoginPassword)
    //             .send({
    //                 name: "stroipp;lking1hi",
    //                 description: "string2",
    //                 websiteUrl: "htt://google.com"})
    //             .expect(HttpStatus.BAD_REQUEST)
    //         expect(response.body.errorsMessages.length).toBe(2)
    //         expect(response.body.errorsMessages).toEqual([{
    //             message: expect.any(String),
    //             field: "name"
    //         },
    //             {
    //                 message: expect.any(String),
    //                 field: "websiteUrl"
    //             }])
    //     })
    //     it('should return 401 if user not authorization', async () => {
    //         await request(app.getHttpServer())
    //             .post(URL_PATH.questions)
    //             .send(question)
    //             .expect(HttpStatus.UNAUTHORIZED)
    //     })
    //
    //     it('should return 404 if questions not exist', async () => {
    //         await request(app.getHttpServer())
    //             .put(join(URL_PATH.questions, "245"))
    //             .set("Authorization", testData.authLoginPassword)
    //             .send(question)
    //             .expect(HttpStatus.NOT_FOUND)
    //
    //     })
    // })
})