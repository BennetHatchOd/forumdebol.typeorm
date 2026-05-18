import { UserInputDto } from '@src/modules/users-system/dto/input/user.input.dto';
import { CommentInputDto } from '@src/modules/blogging.platform/dto/input/comment.input.dto';
import { BlogInputDto } from '@src/modules/blogging.platform/dto/input/blog.input.dto';
import { PostInputDto } from '@src/modules/blogging.platform/dto/input/post.input.dto';
import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AUTH_PATH, URL_PATH } from '@src/core/url.path.setting';
import { AuthBasic } from './auth.basic';
import { UserConfig } from '@src/modules/users-system/config/user.config';

export class TestDataBuilder {
    // создаем первоначальное наполнение системы, при этом тестируя
    // базовые ендпоинты по созданию сущностей системы: blog, post, comment, user
    users: UserInputDto[] = [];
    accessTokens: string[] = [];
    // titleSessions: string[];
    comments: CommentInputDto[] = [];
    blogs: BlogInputDto[] = [];
    blogIds: string[] = [];
    postIds: string[] = [];
    commentIds: string[] = [];
    posts: PostInputDto[] = [];
    authLoginPassword: string = '';

    constructor(
        private app:INestApplication,
        readonly numberUsers : number = 1,
        readonly numberBlogs: number = 1,
        readonly numberPosts : number = 1,
        readonly numberComments : number = 1,
    ) {}

    private prepareManyBlogs(){

        for(let i = 0; i < this.numberBlogs; i++)
            this.blogs.push({name: `Blog_${i}`,
                        description: `description for blog ${i}`,
                        websiteUrl:	`https://dff${i}.com`  })
    }

    async createManyBlogs(){
        this.prepareManyBlogs();

        for(let i = 0; i < this.numberBlogs; i++) {
            const blogCreate = await request(this.app.getHttpServer())
                .post(URL_PATH.blogs)
                .set("Authorization", this.authLoginPassword)
                .send(this.blogs[0])
                .expect(HttpStatus.CREATED)
            this.blogIds.push(blogCreate.body.id);
        }
    }

    private prepareManyPosts(blogId: string){

        for(let i = 0; i < this.numberPosts; i++)
            this.posts.push({title:        `post ${i}`,
                        shortDescription:   `shortdescription for post ${i}`,
                        content:	        `content for post ${i}`,
                        blogId:             blogId })
    }

    async createManyPosts(){
        // create many posts for blog with id in this.blogIds[0]
        this.prepareManyPosts(this.blogIds[0]);

        for(let i = 0; i < this.numberPosts; i++){
            const postCreate = await request(this.app.getHttpServer())
                .post(URL_PATH.posts)
                .set("Authorization", this.authLoginPassword)
                .send(this.posts[i])
                .expect(HttpStatus.CREATED)
            this.postIds.push(postCreate.body.id)
        }
    }

    private prepareManyUsers(){

        for(let i = 0; i < this.numberUsers; i++)
            this.users.push({login: `lhfg_${i}`,
                        email: `gh2_${i}@test.com`,
                        password: `paSSword_${i}`
        })
    }

    async createManyUsers(){
        this.prepareManyUsers();

        for(let i =0; i < this.numberUsers; i++){
            const createResponse = await request(this.app.getHttpServer())
                .post(`${URL_PATH.usersAdmin}`)
                .set("Authorization", this.authLoginPassword)
                .send(this.users[i])
                .expect(HttpStatus.CREATED);

            expect(createResponse.body).toEqual({
                "id": expect.any(String),
                "login": this.users[i].login,
                "email": this.users[i].email,
                "createdAt": expect.any(String)
            })
             // userLikes.push({userId: userCreate.body.id,
            //     login:  userCreate.body.login,
            //     addedAt:  expect.any(String)})

            const token = await request(this.app.getHttpServer())
                .post(`${URL_PATH.auth}${AUTH_PATH.login}`)
                .send({
                    "loginOrEmail": this.users[i].login,
                    "password":     this.users[i].password
                })
                expect(token.body).toHaveProperty("accessToken");
                expect(typeof token.body.accessToken).toBe('string');

            // await new Promise((resolve) => {setTimeout(resolve, 2000)})
            // задержка если есть ограничения на количество обращений к ендпоинту с одного IP
            // в промежуток времени
            // ИЗМЕНИТЬ ПРОВЕРКИ
            this.accessTokens.push(token.body.accessToken)
    }}

    private prepareManyComment(){
        for(let i = 0; i < this.numberComments; i++)
            this.comments.push({content: `This is the comment number ${i}`})
    }

    async createManyComment(){
        // create many posts by user[0] and user[1] for blog with id in this.postIds[0]
        //
        this.prepareManyComment();
        for(let i =0; i < this.numberComments; i++){
            const s = `${URL_PATH.posts}/${this.postIds[0]}/comments`;
            const commentCreate = await request(this.app.getHttpServer())
                .post(s)
                .set("Authorization", 'Bearer ' + this.accessTokens[0])
                .send(this.comments[i])
                //.expect(HttpStatus.CREATED);
            this.commentIds.push(commentCreate.body.id)
        }
    }

    // createTitleSessions(){
    //     this.titleSessions = ['Chrome 12', 'Chrome 34', 'Android 17', 'Android 5', 'IoS 6']
    // }
    // createBadUser(){
    //     this.badUser = {
    //         login: 'lhfg',
    //         email: 'gh2@test.com',
    //         password: 'paSS'
    //     }
    // }


    static async createTestData(app: INestApplication,
                                userConfig: UserConfig,
                                numberUsers : number = 1,
                                numberBlogs: number = 1,
                                numberPosts : number = 1,
                                numberComments : number = 1,
):Promise<TestDataBuilder>{
        const testData = new this(app, numberUsers, numberBlogs, numberPosts, numberComments);
        testData.authLoginPassword = AuthBasic.createAuthHeader(userConfig)

        await testData.createManyBlogs();
        // создаем блоги и сохраняем их ИД в массив
        await testData.createManyPosts();
        // создаем посты для 0 блога и сохраняем их ИД в массив
        await testData.createManyUsers();
        // создаем юзеров и сохраняем в массив для каждого из них аксесс токен
        //await testData.createManyComment();
        // создаем комменты для 0 поста и сохраняем их ИД в массив
        return testData;
    }
}
