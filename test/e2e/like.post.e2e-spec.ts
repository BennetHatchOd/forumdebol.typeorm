import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestDataBuilderByDb } from '../helper/test.data.builder.by.db';
import { initSettings } from '../helper/init.settings';
import { INJECT_TOKEN } from '@core/constans/jwt.tokens';
import { UserConfig } from '@modules/users-system/config/user.config';
import { JwtService } from '@nestjs/jwt';
import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';
import { setCheckLikePost } from './likesHelper/set.check.Like.post';
import { deleteAllData } from '../helper/delete.all.data';
import request from 'supertest';
import { URL_PATH } from '@core/url.path.setting';
import { join } from 'path';
import { defaultUserConfig } from '../helper/default.user.config';

describe('LikePostController (e2e)', () => {
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
	  	testData.clearData();
		await app.close();
	 });

	describe('Send likes and dislikes for a post', () => {
		beforeAll(async () => {
			await deleteAllData(app, globalPrefix);
		    testData.clearData();
			testData.numberUsers = 8;
			testData.numberPosts = 1;
			await testData.createManyPosts();
			await testData.createManyAccessTokens();
		})

		afterAll(async () => {
		  await deleteAllData(app, globalPrefix);
		})

		it('should return extendedLikeInfo for one post', async () => {

		  let status = Rating.Like
		  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[1], status))
			  .toEqual({
			   likesCount: 1,
			   dislikesCount: 0,
			   myStatus: status,
			   newestLikes: [testData.usersLikes[1]]
			  })
		  status = Rating.Dislike
		  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[1], status))
			  .toEqual({
			   likesCount: 0,
			   dislikesCount: 1,
			   myStatus: status,
			   newestLikes: []
			  })

		  status = Rating.None
		  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[1], status))
			  .toEqual({
			   likesCount: 0,
			   dislikesCount: 0,
			   myStatus: status,
			   newestLikes: []
			  })

		  status = Rating.Like
		  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[1], status))
			  .toEqual({
			   likesCount: 1,
			   dislikesCount: 0,
			   myStatus: status,
			   newestLikes: [testData.usersLikes[1]]
			  })
		  status = Rating.Like
		  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[1], status))
			  .toEqual({
			   likesCount: 1,
			   dislikesCount: 0,
			   myStatus: status,
			   newestLikes: [testData.usersLikes[1]]
			  })
		  status = Rating.Like
		  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[1], status))
			  .toEqual({
			   likesCount: 1,
			   dislikesCount: 0,
			   myStatus: status,
			   newestLikes: [testData.usersLikes[1]]
			  })
		})

		it('should return LikeInfo for an unauthorized user with Rating.None', async () => {

			  const postResponce = await request(app.getHttpServer())
				  .get(join(URL_PATH.posts, testData.posts[0].id.toString()))
				  .expect(HttpStatus.OK);
			  const post = postResponce.body
			  expect(post.extendedLikesInfo).toEqual({
			   likesCount: 1,
			   dislikesCount: 0,
			   myStatus: Rating.None,
			   newestLikes: [testData.usersLikes[1]]
			  })
		})

		it('should return LikeInfo after some users like and dislike the post', async () => {

			  let status = Rating.Like
			  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[0], status))
				  .toEqual({
				   likesCount: 2,
				   dislikesCount: 0,
				   myStatus: status,
				   newestLikes: [testData.usersLikes[0], testData.usersLikes[1]]
				  })

			  status = Rating.Like
			  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[2], status))
				  .toEqual({
				   likesCount: 3,
				   dislikesCount: 0,
				   myStatus: status,
				   newestLikes: [testData.usersLikes[2], testData.usersLikes[0], testData.usersLikes[1]]
				  })
			  status = Rating.Dislike
			  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[3], status))
				  .toEqual({
				   likesCount: 3,
				   dislikesCount: 1,
				   myStatus: status,
				   newestLikes: [testData.usersLikes[2], testData.usersLikes[0], testData.usersLikes[1]]
				  })

			  status = Rating.Like
			  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[4], status))
				  .toEqual({
				   likesCount: 4,
				   dislikesCount: 1,
				   myStatus: status,
				   newestLikes: [testData.usersLikes[4], testData.usersLikes[2], testData.usersLikes[0]]
				  })


			  status = Rating.None
			  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[5], status))
				  .toEqual({
				   likesCount: 4,
				   dislikesCount: 1,
				   myStatus: status,
				   newestLikes: [testData.usersLikes[4], testData.usersLikes[2], testData.usersLikes[0]]
				  })


			  status = Rating.Dislike
			  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[2], status))
				  .toEqual({
				   likesCount: 3,
				   dislikesCount: 2,
				   myStatus: status,
				   newestLikes: [testData.usersLikes[4], testData.usersLikes[0], testData.usersLikes[1]]
				  })
			  status = Rating.Like
			  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[6], status))
				  .toEqual({
				   likesCount: 4,
				   dislikesCount: 2,
				   myStatus: status,
				   newestLikes: [testData.usersLikes[6], testData.usersLikes[4], testData.usersLikes[0]]
				  })
			  status = Rating.None
			  expect(await setCheckLikePost(app, testData.posts[0].id.toString(), testData.accessTokens[6], status))
				  .toEqual({
				   likesCount: 3,
				   dislikesCount: 2,
				   myStatus: status,
				   newestLikes: [testData.usersLikes[4], testData.usersLikes[0], testData.usersLikes[1]]
				  })
			 })
	})

	describe('Send likes and dislikes for many post', () => {
	  beforeAll(async () => {
	   await deleteAllData(app, globalPrefix);
	   testData.clearData();
	   testData.numberUsers = 8;
	   testData.numberPosts = 4;
	   await testData.createManyPosts();
	   await testData.createManyAccessTokens();
	  })

	  afterAll(async () => {
	   await deleteAllData(app, globalPrefix);
	  })

	  it('Some users like and dislike some posts. Testing paginator.', async() => {

		 let status = Rating.Like
		 let users = [
			 [1, 0, 4 ],
			 [1, 7, 4, 3, 6 ,5],
			 [2, 3, 4],
			 [2, 5]
			]
		 for(let i = 0; i < 4; i++){
			 for (let user of users[i]){
				 await setCheckLikePost(app, testData.posts[i].id.toString(), testData.accessTokens[user], status)
			 }
		 }

		 status = Rating.Dislike

		 users = [
			 [2, 6],
			 [2],
			 [1, 5, 6],
			 [1, 2, 3, 4, 4, 5, 6]
			]
		 for(let i = 0; i < 4; i++){
			 for (let user of users[i]){
				 await setCheckLikePost(app, testData.posts[i].id.toString(), testData.accessTokens[user], status)
			 }
		 }

		 status = Rating.None
		 users = [
			 [],
			 [6],
			 [6, 1],
			 []
			 ]
		 for(let i = 0; i < 4; i++){
			 for (let user of users[i]){
				 await setCheckLikePost(app, testData.posts[i].id.toString(), testData.accessTokens[user], status)
			 }
		 }

		 let postResponce = await request(app.getHttpServer())
			 .get(join(URL_PATH.posts, testData.posts[0].id.toString())).set("Authorization", 'Bearer ' + testData.accessTokens[2])
		 expect(postResponce.body.extendedLikesInfo).toEqual({ likesCount: 3,
														 dislikesCount: 2,
														 myStatus: Rating.Dislike ,
														 newestLikes: [testData.usersLikes[4], testData.usersLikes[0], testData.usersLikes[1]] })

		 postResponce = await request(app.getHttpServer())
		   .get(join(URL_PATH.posts, testData.posts[1].id.toString())).set("Authorization", 'Bearer ' + testData.accessTokens[3])
		 expect(postResponce.body.extendedLikesInfo).toEqual({ likesCount: 5,
														 dislikesCount: 1,
														 myStatus: Rating.Like,
														 newestLikes: [testData.usersLikes[5], testData.usersLikes[3], testData.usersLikes[4]]  })

		 postResponce = await request(app.getHttpServer())
			 .get(join(URL_PATH.posts, testData.posts[2].id.toString())).set("Authorization", 'Bearer ' + testData.accessTokens[4])
		 expect(postResponce.body.extendedLikesInfo).toEqual({ likesCount: 3,
														 dislikesCount: 1,
														 myStatus: Rating.Like,
														 newestLikes: [testData.usersLikes[4], testData.usersLikes[3], testData.usersLikes[2]]  })

		 postResponce = await request(app.getHttpServer())
		   .get(join(URL_PATH.posts, testData.posts[3].id.toString())).set("Authorization", 'Bearer ' + testData.accessTokens[5])
		 expect(postResponce.body.extendedLikesInfo).toEqual({ likesCount: 0,
														 dislikesCount: 6,
														 myStatus: Rating.Dislike,
														 newestLikes: []  })

		 postResponce = await request(app.getHttpServer())
			 .get(join(URL_PATH.posts, testData.posts[1].id.toString()))
		 expect(postResponce.body.extendedLikesInfo).toEqual({ likesCount: 5,
														 dislikesCount: 1,
														 myStatus: Rating.None,
														 newestLikes: [testData.usersLikes[5], testData.usersLikes[3], testData.usersLikes[4]]  })
	 })

		 it('should return a paginator', async() => {

		 let postResponce = await request(app.getHttpServer()).get(join(URL_PATH.blogs,testData.posts[0].blogId.toString(),'posts'))
												 .set("Authorization", 'Bearer ' + testData.accessTokens[2])


		 expect(postResponce.body.items[0].extendedLikesInfo).toEqual({ likesCount: 0,
														 dislikesCount: 6,
														 myStatus: Rating.Dislike,
														 newestLikes: []})

		 expect(postResponce.body.items[3].extendedLikesInfo).toEqual({ likesCount: 3,
														 dislikesCount: 2,
														 myStatus: Rating.Dislike  ,
														 newestLikes: [testData.usersLikes[4], testData.usersLikes[0], testData.usersLikes[1]] })

		 expect(postResponce.body.items[2].extendedLikesInfo).toEqual({ likesCount: 5,
														 dislikesCount: 1,
														 myStatus: Rating.Dislike,
														 newestLikes: [testData.usersLikes[5], testData.usersLikes[3], testData.usersLikes[4]] })

		 expect(postResponce.body.items[1].extendedLikesInfo).toEqual({ likesCount: 3,
														 dislikesCount: 1,
														 myStatus: Rating.Like,
														 newestLikes: [testData.usersLikes[4], testData.usersLikes[3], testData.usersLikes[2]]  })


	 })
	})

	describe('Send likes and dislikes post with errors', () => {
		beforeAll(async () => {
			await deleteAllData(app, globalPrefix);
			testData.clearData();
			testData.numberUsers = 1;
			testData.numberPosts = 1;
			await testData.createManyPosts();
			await testData.createManyAccessTokens();
		})

		afterAll(async () => {
			await deleteAllData(app, globalPrefix);
		})

		it('should return 401 if user is not logged in', async() => {
			const response = await request(app.getHttpServer())
				.put(join(URL_PATH.posts, testData.posts[0].id.toString(), 'like-status'))
				.set("Authorization", 'Bearer ' + "ghfgg")
				.send({likeStatus: Rating.Like })
				.expect(HttpStatus.UNAUTHORIZED);
		})

		it('should return 404 if post not exist', async() => {
			const response = await request(app.getHttpServer())
				.put(join(URL_PATH.posts, '5346345', 'like-status'))
				.set("Authorization", 'Bearer ' + testData.accessTokens[0])
				.send({likeStatus: Rating.Like })
				.expect(HttpStatus.NOT_FOUND);
		})

		it('should return 400 if send not {likesStatus:Rating}', async() => {
			let response = await request(app.getHttpServer())
				.put(join(URL_PATH.posts, testData.posts[0].id.toString(), 'like-status'))
				.set("Authorization", 'Bearer ' + testData.accessTokens[0])
				.send({likeStatus: 'like' })
				.expect(HttpStatus.BAD_REQUEST);


			expect(response.body.errorsMessages.length).toBe(1)
			expect(response.body.errorsMessages[0]).toEqual({
				message: expect.any(String),
				field: "likeStatus"
			})

			response = await request(app.getHttpServer())
				.put(join(URL_PATH.posts, testData.posts[0].id.toString(), 'like-status'))
				.set("Authorization", 'Bearer ' + testData.accessTokens[0])
				.send({likesStatus: Rating.Like })
				.expect(HttpStatus.BAD_REQUEST);

			expect(response.body.errorsMessages[0]).toEqual({
				message: expect.any(String),
				field: "likeStatus"})

			response = await request(app.getHttpServer())
				.put(join(URL_PATH.posts, testData.posts[0].id.toString(), 'like-status'))
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
