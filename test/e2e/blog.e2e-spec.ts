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
import { BlogInputDto } from '@modules/blogging.platform/dto/input/blog.input.dto';

describe('BlogController (e2e)', () => {
    let app: INestApplication;
    let testData: TestDataBuilderByDb;
    let globalPrefix;
    let blog;

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

    describe('Testing simple CRUD blogs.\n' +
        'scenario this block of tests:\n ' +
        'post - get{id} - put{id} - get{id} - delete{id} - get{id}', () => {
        blog = {
            name: 'string1',
            description: 'string2',
            websiteUrl: 'https://google.com'
        }
        let blogId: string;
        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
        })

        afterAll(async () => {
        })

        it('should return 201 and a created blog', async () => {

            const response = await request(app.getHttpServer())
                .post(URL_PATH.blogsAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send(blog)
               .expect(HttpStatus.CREATED)
            expect(response.body).toEqual({
                id: expect.any(String),
                name: blog.name,
                description: blog.description,
                websiteUrl: blog.websiteUrl,
                createdAt: expect.any(String),
                isMembership: false
            })
            blogId = response.body.id;
        });

        it('should return 200 and the found blog', async () => {
            const response = await request(app.getHttpServer())
                .get(join(URL_PATH.blogs, blogId))
                .expect(HttpStatus.OK)
            expect(response.body).toEqual({
                id: blogId,
                name: blog.name,
                description: blog.description,
                websiteUrl: blog.websiteUrl,
                createdAt: expect.any(String),
                isMembership: false
            })
        })

        it('should return 204 and 200 after check editing blog', async () => {
            blog = {
                name: 'jkggfd',
                description: 'khgfgP',
                websiteUrl: 'https://google.net'
            }
            await request(app.getHttpServer())
                .put(join(URL_PATH.blogsAdmin, blogId))
                .set("Authorization", testData.authLoginPassword)
                .send(blog)
                .expect(HttpStatus.NO_CONTENT)

            const response = await request(app.getHttpServer())
                .get(join(URL_PATH.blogs, blogId))
                .expect(HttpStatus.OK)
            expect(response.body).toEqual({
                id: blogId,
                name: blog.name,
                description: blog.description,
                websiteUrl: blog.websiteUrl,
                createdAt: expect.any(String),
                isMembership: false
            })
        })

        it('should return 204 after deleting and 404 after get this blog', async () => {
            await request(app.getHttpServer())
                .delete(join(URL_PATH.blogsAdmin, blogId))
                .set("Authorization", testData.authLoginPassword)
                .send(blog)
                .expect(HttpStatus.NO_CONTENT)
            const response = await request(app.getHttpServer())
                .get(join(URL_PATH.blogs, blogId))
                .expect(HttpStatus.NOT_FOUND)
        })

    })

    describe('Testing paginator for blogs', () => {
        const blogs = [
            {
                name: "nalo3aLk",
                description: "string2",
                websiteUrl: "https://google.com"
            },
            {
                name: "f3Alnalo3aLm",
                description: "stri",
                websiteUrl: "https://google1.com"
            },
            {
                name: "F3pa3alnar",
                description: "strigtng2",
                websiteUrl: "https://google2.com"
            },
            {
                name: "f3ALztT",
                description: "fgh3AhLHtT",
                websiteUrl: "https://google3.com"
            },
        ];
        let pagesCount: number;
        let page: number;
        let pageSize: number;
        let totalCount: number;

        beforeAll(async () => {
            await deleteAllData(app, globalPrefix);
            testData.clearData();
            testData.numberBlogs = 10;
            await testData.createManyBlogs();
            pagesCount = Math.floor((blogs.length + testData.numberBlogs - 1) / 10) + 1;
            page = 1;
            pageSize = 10;
            totalCount = blogs.length + testData.numberBlogs;
            await testData.writeToDB<BlogInputDto>(blogs, 'blog')
        })

        afterAll(async () => {
        })

        it('should return 200 and a list of blogs with default paginator', async () => {
            const response = await request(app.getHttpServer())
                .get(URL_PATH.blogs)
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
                name: blogs.at(-1)!.name,
                description: blogs.at(-1)!.description,
                websiteUrl: blogs.at(-1)!.websiteUrl,
                createdAt: expect.any(String),
                isMembership: false
            })

        })

        it('should return 200 and a paginator with pageSize, pageNumber ', async () => {
            const response = await request(app.getHttpServer())
                .get(URL_PATH.blogs)
                .query({
                    pageSize: 4,
                    pageNumber: 15
                })
                .expect(HttpStatus.OK)
            expect(response.body).toEqual({
                pagesCount: 4,
                page: 4,
                pageSize: 4,
                totalCount: 14,
                items: expect.any(Array)
            })
            expect(response.body.items.length).toBe(2)
        })

        it('should return 200 and a paginator with searchNameTerm', async () => {
            const response = await request(app.getHttpServer())
                .get(URL_PATH.blogs)
                .query({
                    pageSize: 11,
                    pageNumber: 15,
                    searchNameTerm: '3al',
                    sortBy: 'name',
                    sortDirection: 'asc'
                })
                .expect(HttpStatus.OK);
            expect(response.body).toEqual({
                pagesCount: 1,
                page: 1,
                pageSize: 11,
                totalCount: 4,
                items: expect.any(Array)
            });
            expect(response.body.items.length).toBe(4)
            const names = response.body.items.map(item => item.name);
            expect(names).toEqual(
                ['F3pa3alnar', 'f3ALztT', 'f3Alnalo3aLm', 'nalo3aLk'])
        })

        it('should return 200 and a paginator with searchNameTerm for SA', async () => {
            const response = await request(app.getHttpServer())
                .get(URL_PATH.blogsAdmin)
                .set("Authorization", testData.authLoginPassword)
                .query({
                    pageSize: 11,
                    pageNumber: 15,
                    searchNameTerm: '3al',
                    sortBy: 'name',
                    sortDirection: 'asc'
                })
                .expect(HttpStatus.OK);
            expect(response.body).toEqual({
                pagesCount: 1,
                page: 1,
                pageSize: 11,
                totalCount: 4,
                items: expect.any(Array)
            });
            expect(response.body.items.length).toBe(4)
            const names = response.body.items.map(item => item.name);
            expect(names).toEqual(
                ['F3pa3alnar', 'f3ALztT', 'f3Alnalo3aLm', 'nalo3aLk'])
        })
    })


describe('Testing create, edit and delete blogs with some wrongs', () => {
        beforeAll(async () => {
            testData.clearData();
            await deleteAllData(app, globalPrefix);
        })

        afterAll(async () => {
        })

        it('should return 400 if we send wrong content', async () => {
            const response = await request(app.getHttpServer())
                .post(URL_PATH.blogsAdmin)
                .set("Authorization", testData.authLoginPassword)
                .send({
                    name: "stroipp;lking1hi",
                    description: "string2",
                    websiteUrl: "htt://google.com"})
                .expect(HttpStatus.BAD_REQUEST)
            expect(response.body.errorsMessages.length).toBe(2)
            expect(response.body.errorsMessages).toEqual([{
                  message: expect.any(String),
                  field: "name"
                },
                {
                  message: expect.any(String),
                  field: "websiteUrl"
                }])
        })
        it('should return 401 if user not authorization', async () => {
            await request(app.getHttpServer())
                .post(URL_PATH.blogsAdmin)
                .send(blog)
                .expect(HttpStatus.UNAUTHORIZED)
        })

        it('should return 404 if blog not exist', async () => {
            await request(app.getHttpServer())
                .put(join(URL_PATH.blogs, "245"))
                .set("Authorization", testData.authLoginPassword)
                .send(blog)
                .expect(HttpStatus.NOT_FOUND)

        })
    })
})