import { INestApplication, Inject } from '@nestjs/common';
import { AuthBasic } from './auth.basic';
import { UserConfig } from '@src/modules/users-system/config/user.config';
import { Blog} from '@src/modules/blogging.platform/domain/blog.entity';
import { Post } from '@src/modules/blogging.platform/domain/post.entity';
import { Comment } from '@src/modules/blogging.platform/domain/comment.entity';
import { CreateCommentDto } from '@modules/blogging.platform/dto/create/create.comment.dto';
import { PasswordHashService } from '@src/modules/users-system/application/password.hash.service';
import request from 'supertest';
import { join } from 'path';
import { AUTH_PATH, URL_PATH } from '@core/url.path.setting';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource } from 'typeorm';
import { User } from '@modules/users-system/domain/user.entity';

export class TestDataBuilderByDb {
    // создаем первоначальное наполнение системы
    accessTokens: string[] = [];
    users: User[] = [];
    usersPassword: string[] = [];
    comments: Comment[] = [];
    blogs: Blog[] = [];
    posts: Post[] = [];
    authLoginPassword: string = '';
    usersLikes: {addedAt: string,
                userId: string,
                login: string}[] = []
    private isCreate = {
        blog: false,
        post: false,
        comment: false,
        user: false,
    }

    constructor(private app:INestApplication,
                @Inject(DATA_SOURCE)private readonly dataSource: DataSource,
                public passwordHashService: PasswordHashService,
                public userConfig: UserConfig,
                public numberUsers : number = 1,
                public numberBlogs: number = 1,
                public numberPosts : number = 1,
                public numberComments : number = 1,
    ) {}

    async createManyBlogs() {
        this.isCreate.blog = true;

        for (let i = 0; i < this.numberBlogs; i++) {
            const blog = {
                name: `Blog_${i}`,
                description: `description for blog ${i}`,
                websiteUrl:	`https://dff${i}.com`
            }
            const result:number = await this.dataSource.query(`
                INSERT INTO public.blog(
                    name, description, "websiteUrl")
                VALUES('${blog.name}', '${blog.description}', '${blog.websiteUrl}')
                RETURNING id;`)

            const blogInstance: Blog = Blog.create(blog);
            blogInstance.id = result[0].id;
            this.blogs.push(blogInstance);
        }
    }

    async createManyPosts(){
        // create many posts for blog with id in this.blogIds[0]
        this.isCreate.post = true;
        await this.checkBlog();

        for(let i = 0; i < this.numberPosts; i++){
            const post ={
                title: `post ${i}`,
                shortDescription: `shortdescription for post ${i}`,
                content: `content for post ${i}`,
                blogId: this.blogs[0].id!.toString(),
            };
            const result = await this.dataSource.query(`
                INSERT INTO public.post(
                    title, content, "shortDescription", "blogId")
                VALUES('${post.title}', '${post.content}', '${post.shortDescription}', '${this.blogs[0].id!}')
                RETURNING id;`);

            const postInstance: Post = Post.create(post);
            postInstance.id = result[0].id;
            this.posts.push(postInstance);
        }
    }

    async createManyUsers(){
        this.isCreate.user = true;
        for(let i =0; i < this.numberUsers; i++){
            const user = {
                login: `lhfg_${i}`,
                email: `gh2_${i}@test.com`,
                password: `paSSword_${i}`
            }
            this.usersPassword.push(user.password)
            user.password = await this.passwordHashService.createHash(
                user.password,
                this.userConfig.saltRound,
            );
            const newUser: User = User.create(user, true);

            const result = await this.dataSource.query(`
                INSERT INTO public.user(
                    login, email, "passwordHash")
                VALUES('${user.login}', '${user.email}', '${user.password}')
                RETURNING id;`)
            newUser.id = result[0].id;
            this.users.push(newUser);
            this.usersLikes.push({
                addedAt: expect.any(String),
                userId: newUser.id!.toString(),
                login: user.login,})
        }
    }

    async createManyAccessTokens(){
        if(!this.isCreate.user)
            await this.createManyUsers();

        for(let i =0; i < this.numberUsers; i++) {

            const token = await request(this.app.getHttpServer())
                .post(join(URL_PATH.auth, AUTH_PATH.login))
                .send({
                    "loginOrEmail": this.users[i].login,
                    "password": this.usersPassword[i]
                })
            this.accessTokens.push(token.body.accessToken)
        }
    }

   //  async createManyComment(){
   //      this.isCreate.comment = true;
   //      await this.checkPost()
   //      await this.checkUser();
   //
   //      for(let i =0; i < this.numberComments; i++){
   //          const comment: CreateCommentDto =
   //              {content: `This is the comment number ${i}`,
   //               postId: this.posts[0].id!.toString(),
   //               userId: this.users[0].id!.toString(),
   //               };
   //
   //          const result = await this.dataSource.query(`
   //              INSERT INTO public.comments(
   //                  content, "postId", "userId")
   //              VALUES('${comment.content}', '${comment.postId}', '${comment.userId}')
   //              RETURNING id;`);
   //
   //          const commentInstance: Comment = Comment.createInstance(comment);
   //          commentInstance.id = result[0].id;
   //          this.comments.push(commentInstance);
   //      }
   // }

    async writeToDB<T extends object>(
        entities: T[],
        tableName: string,
    ):Promise<void> {

            if (!entities.length) return;

        for (const entity of entities) {
            const fields = Object.keys(entity).map(f => `"${f}"`).join(", ");
            const values = Object.values(entity).map(this.toRawSql).join(", ");

            const sql = `
            INSERT INTO "${tableName}" (${fields})
            VALUES (${values})`;
            await this.dataSource.query(sql);
        }
    }

    clearData(){
        this.users = [];
        this.usersPassword = [];
        this.comments = [];
        this.blogs = [];
        this.posts = [];
        this.accessTokens = [];
        this.usersLikes =[];

        this.isCreate = {
            blog: false,
            post: false,
            comment: false,
            user: false,
        }
    }

    private toRawSql(value: any): string {
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `'${value}'`;
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        if (value instanceof Date) return `'${value.toISOString()}'`;
        return value.toString();
    }

    private async checkBlog(){
        if (!this.isCreate.blog) {
            await this.createManyBlogs();
            this.isCreate.blog = true;
        }
    }

    private async checkPost(){
        if(!this.isCreate.post){
            await this.createManyPosts();
            this.isCreate.post = true;
        }
    }

    private async checkUser(){
        if(!this.isCreate.user) {
            await this.createManyAccessTokens();
            this.isCreate.user = true;
        }
    }

    static async createTestData(app: INestApplication,
                                userConfig: UserConfig,
                                dataSource: DataSource,
                                passwordHashService: PasswordHashService,
    ):Promise<TestDataBuilderByDb>{
        const testData = new this(app, dataSource, passwordHashService, userConfig);
        testData.authLoginPassword = AuthBasic.createAuthHeader(userConfig)
        return testData;
    }
}
