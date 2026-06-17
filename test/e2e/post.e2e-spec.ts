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
import { PostInputDto } from '@modules/blogging.platform/dto/input/post.input.dto';

describe('PostController (e2e)', () => {
    let app: INestApplication;
    let testData: TestDataBuilderByDb;
    let globalPrefix;
    let post;

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

    describe('Testing simple CRUD posts.', () => {
        post = {
            title: "title",
            shortDescription: "shortDescription",
            content: "content",
            blogId: "1"
        }

        let postId: string;
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberBlogs = 2;
            await testData.createManyBlogs();
            post.blogId = testData.blogs[0].id!.toString();
        })

        afterAll(async () => {
        })

        it('should return 201 and a created post', async () => {

            const response = await request(app.getHttpServer())
                .post(join(URL_PATH.blogsAdmin,testData.blogs[0].id!.toString(),'posts'))
                .set("Authorization", testData.authLoginPassword)
                .send(post)
                .expect(HttpStatus.CREATED)
            expect(response.body).toEqual({
                id: expect.any(String),
                title: post.title,
                shortDescription: post.shortDescription,
                content: post.content,
                createdAt: expect.any(String),
                blogName: testData.blogs[0].name,
                blogId: testData.blogs[0].id!.toString(),
                extendedLikesInfo: expect.any(Object),
            })
            postId = response.body.id;
        });

        it('should return 200 and the found posts', async () => {
            const response = await request(app.getHttpServer())
                .get(join(URL_PATH.posts, postId))
                .expect(HttpStatus.OK)
            expect(response.body).toEqual({
                id: postId,
                title: post.title,
                shortDescription: post.shortDescription,
                content: post.content,
                createdAt: expect.any(String),
                blogName: testData.blogs[0].name,
                blogId: testData.blogs[0].id!.toString(),
                extendedLikesInfo: expect.any(Object),
            })

        })

        it('should return 204 and 200 after check editing post', async () => {
            post = {
                title: "jkggfd",
                shortDescription: "khgfgP",
                content: "https://google.net",
            }
            await request(app.getHttpServer())
                .put(join(URL_PATH.blogsAdmin,testData.blogs[0].id!.toString(),'posts', postId))
                .set("Authorization", testData.authLoginPassword)
                .send(post)
                .expect(HttpStatus.NO_CONTENT)

            const response = await request(app.getHttpServer())
                .get(join(URL_PATH.posts, postId))
                .expect(HttpStatus.OK)
            expect(response.body).toEqual({
                id: postId,
                title: post.title,
                shortDescription: post.shortDescription,
                content: post.content,
                createdAt: expect.any(String),
                blogName: testData.blogs[0].name,
                blogId: testData.blogs[0].id!.toString(),
                extendedLikesInfo: expect.any(Object),
            })
        })

        it('should return 204 after deleting and 404 after get this post', async () => {
            await request(app.getHttpServer())
                .delete(join(URL_PATH.blogsAdmin,testData.blogs[0].id!.toString(),'posts', postId))
                .set("Authorization", testData.authLoginPassword)
                .expect(HttpStatus.NO_CONTENT)
            await request(app.getHttpServer())
                .get(join(URL_PATH.blogsAdmin,testData.blogs[0].id!.toString(),'posts', postId))
                .expect(HttpStatus.NOT_FOUND)
        })
    })

    describe('Testing paginator for posts', () => {
        const posts = [
            {
                title: "nalo3aLk",
                shortDescription: "string2",
                content: "https://google.com",
                blogId: "3",
            },
            {
                title: "f3Alnalo3aLm",
                shortDescription: "stri",
                content: "https://google1.com",
                blogId: "3",
            },
            {
                title: "F3pa3alnar",
                shortDescription: "strigtng2",
                content: "https://google2.com",
                blogId: "3",
            },
            {
                title: "fF3pa3alnar",
                shortDescription: "strigtng2",
                content: "https://google2.com",
                blogId: "3",
            },
            {
                title: "f3ALHtT",
                shortDescription: "fgh3AhLHtT",
                content: "https://google3.com",
                blogId: "3",
            },
        ];
        let pagesCount: number;
        let page: number;
        let pageSize: number;
        let totalCount: number;

        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberPosts = 10;
            testData.numberBlogs = 3;
            await testData.createManyPosts();
            pagesCount = Math.floor((posts.length + testData.numberPosts - 1) / 10) + 1;
            page = 1;
            pageSize = 10;
            totalCount = posts.length + testData.numberPosts;
            posts.forEach((post) => {
                post.blogId = testData.blogs[1].id!.toString();
            })
            await testData.writeToDB<PostInputDto>(posts, 'post')
        })

        afterAll(async () => {
        })

        it('should return 200 and a default paginator', async () => {
            const response = await request(app.getHttpServer())
                .get(URL_PATH.posts)
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
                title: posts.at(-1)!.title,
                shortDescription: posts.at(-1)!.shortDescription,
                content: posts.at(-1)!.content,
                createdAt: expect.any(String),
                blogName: testData.blogs[1].name,
                blogId: posts.at(-1)!.blogId.toString(),
                extendedLikesInfo: expect.any(Object),
            })

        })

        it('should return 200 and a paginator with pageSize, pageNumber ', async () => {
            const response = await request(app.getHttpServer())
                .get(URL_PATH.posts)
                .query({
                    pageSize: 4,
                    pageNumber: 11
                })
                .expect(HttpStatus.OK)
            expect(response.body).toEqual({
                pagesCount: 4,
                page: 4,
                pageSize: 4,
                totalCount: totalCount,
                items: expect.any(Array)
            })
            expect(response.body.items.length).toBe(3)
        })

        it('should return 200 and a paginator with sort by title', async () => {
            const response = await request(app.getHttpServer())
                .get(join(URL_PATH.blogs,testData.blogs[1].id!.toString(), 'posts'))
                .query({
                    pageSize: 11,
                    pageNumber: 6,
                    sortBy: 'title',
                    sortDirection: 'asc'
                })
                .expect(HttpStatus.OK);
            expect(response.body).toEqual({
                pagesCount: 1,
                page: 1,
                pageSize: 11,
                totalCount: 5,
                items: expect.any(Array)
            });
            expect(response.body.items.length).toBe(5)
            const names = response.body.items.map(item => item.title);
            expect(names).toEqual(
               // ['F3pa3alnar', 'f3ALztT', 'f3Alnalo3aLm', 'nalo3aLk'])
                 ["F3pa3alnar", "f3ALHtT", "f3Alnalo3aLm", "fF3pa3alnar", "nalo3aLk"]);
        })
    })

    describe('Testing create, edit and delete blogs with some wrongs', () => {
        const post = {
                title: "nalo3aLk",
                shortDescription: "string2",
                content: "https://google.com",
        }

        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberPosts = 2;
            testData.numberBlogs = 2;
            await testData.createManyPosts();
        })

        afterAll(async () => {
        })

        it('should return 400 if we send wrong content', async () => {
            const response = await request(app.getHttpServer())
                .post(join(URL_PATH.blogsAdmin,testData.blogs[0].id!.toString(),'posts'))
                .set("Authorization", testData.authLoginPassword)
                .send({
                    title: "n123456789012345678901234567890",
                    shortDescription: "string21234567890" +
                        "string21234567890string21234567890string21234567890" +
                        "string21234567890string21234567890string21234567890" +
                        "string21234567890string21234567890string21234567890",
                    content: "https://google.com"})
                .expect(HttpStatus.BAD_REQUEST)
            expect(response.body.errorsMessages.length).toBe(2)
            expect(response.body.errorsMessages).toEqual([{
                  message: expect.any(String),
                  field: "title"
                },
                {
                  message: expect.any(String),
                  field: "shortDescription"
                }])
        })

        it('should return 401 if user not authorization', async () => {
            await request(app.getHttpServer())
                .post(join(URL_PATH.blogsAdmin,testData.blogs[0].id!.toString(),'posts'))
                .send(post)
                .expect(HttpStatus.UNAUTHORIZED)
        })

        it('should return 404 if post not exist', async () => {
            await request(app.getHttpServer())
                .put(join(URL_PATH.blogsAdmin,testData.blogs[0].id!.toString(),'posts', "2jh45"))
                .set("Authorization", testData.authLoginPassword)
                .send(post)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('should return 404 if post not exist for this blog', async () => {
            await request(app.getHttpServer())
                .put(join(URL_PATH.blogsAdmin,testData.blogs[0].id!.toString(),'posts', testData.posts[0].id!.toString()))
                .set("Authorization", testData.authLoginPassword)
                .send(post)
                .expect(HttpStatus.NO_CONTENT)

            await request(app.getHttpServer())
                .put(join(URL_PATH.blogsAdmin,testData.blogs[1].id!.toString(),'posts', testData.posts[0].id!.toString()))
                .set("Authorization", testData.authLoginPassword)
                .send(post)
                .expect(HttpStatus.NOT_FOUND)

        })
    })
})