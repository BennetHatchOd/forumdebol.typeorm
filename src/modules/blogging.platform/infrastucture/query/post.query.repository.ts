import { Injectable } from '@nestjs/common';
import { Post } from '../../domain/post.entity';
import { PostViewDto } from '../../dto/view/post.view.dto';
import { GetPostQueryParams } from '../../dto/input/get.post.query.params.input.dto';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { EmptyPaginator } from '@core/dto/empty.paginator';
import { EntityManager } from 'typeorm';
import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';
import { PostRowViewDto } from '@modules/blogging.platform/dto/view/row/post.row.view.dto';
import { NewestLikesViewDto } from '@modules/blogging.platform/dto/view/newest.likes.view.dto';
import { isDbId } from '@core/is.db.id';
import { InjectEntityManager } from '@nestjs/typeorm';
import { sortDirectionToDb } from '@core/dto/base.query.params.input.dto';
import { LikePost } from '@modules/blogging.platform/domain/like.post.entity';

@Injectable()
export class PostQueryRepository {
    constructor(
        @InjectEntityManager() private entityManager: EntityManager,
    ){}

    async  findByIdForView(
        id: string,
        userId: string|null = null): Promise<PostViewDto> {
        // returns a post by id, if post isn't found throws an exception

        const idDB = isDbId(id);
        if (!idDB)
            throw new DomainException({
                message: 'post not found',
                code: DomainExceptionCode.NotFound,
            });

        // find the post
        const post= await this.entityManager
            .createQueryBuilder(Post, 'p')
            .leftJoin('p.blog', 'b')
            .leftJoin(LikePost, 'l', 'l.targetId = p.id')
            .select([
                'p.id as "id"',
                'p.title as "title"',
                'p.shortDescription as "shortDescription"',
                'p.content as "content"',
                'p.createdAt as "createdAt"',
                'p.blogId as "blogId"',
                `b.name as "blogName"`,
                `COUNT(CASE WHEN l.status = 'Like' THEN 1 END)::int as "likesCount"`,
                `COUNT(CASE WHEN l.status = 'Dislike' THEN 1 END)::int as "dislikesCount"`,
            ])
            .where('p.id = :idDB',{idDB:idDB})
            .groupBy('p.id')
            .addGroupBy('p.title')
            .addGroupBy('p.shortDescription')
            .addGroupBy('p.content')
            .addGroupBy('p.createdAt')
            .addGroupBy('p.blogId')
            .addGroupBy('b.name')
            .getRawOne();

        if (!post)
            throw new DomainException({
                message: 'post not found',
                code: DomainExceptionCode.NotFound,
            });

        // find status
        let status = Rating.None;
        if(userId) {
            const like = await this.entityManager
                .createQueryBuilder(LikePost, 'l')
                .where('l.targetId = :targetId', { targetId: idDB })
                .andWhere('l.userId = :userId', { userId: +userId })
                .getOne();

            if (like) status = like.status;
        }

        // find the newest likes

        const rowLikes = await this.entityManager
            .createQueryBuilder()
            .select(
                `(
              SELECT jsonb_agg(
                jsonb_build_object(
                  'addedAt', fr."createdAt",
                  'userId', fr."userId"::text,
                  'login', fr."login"
                )
              )
              FROM (
                SELECT lp."createdAt", lp."userId", u."login"
                FROM "like_post" lp
                LEFT JOIN "user" u ON u.id = lp."userId"
                WHERE lp."targetId" = :id  AND lp.status = 'Like'
                ORDER BY lp."createdAt" DESC
                LIMIT 3
              ) fr
            )`,  'likes'
            )
            .from(Post, 'p')
            .setParameter('id', idDB)
            .getRawOne();

        const newestLikes: NewestLikesViewDto[] = rowLikes?.likes ?? [];

        // mapping
        return PostViewDto.mapToView({...post, myStatus: status}, newestLikes);
    }

    async find(queryReq: GetPostQueryParams, userId: string|null = null): Promise<PaginatedViewDto<PostViewDto>> {

        // find the posts
        let userQueryBuilder = this.entityManager.createQueryBuilder(Post, 'p');

        if (queryReq.searchBlogId)
            userQueryBuilder = userQueryBuilder.where('p.blogId = :blogId', {blogId: queryReq.searchBlogId});

        userQueryBuilder = userQueryBuilder
            .leftJoin('p.blog', 'b')
            .leftJoin(LikePost, 'l', 'l.targetId = p.id')
            .select([
                'p.id as "id"',
                'p.title as "title"',
                'p.shortDescription as "shortDescription"',
                'p.content as "content"',
                'p.createdAt as "createdAt"',
                'p.blogId as "blogId"',
                `b.name as "blogName"`,
                `COUNT(CASE WHEN l.status = 'Like' THEN 1 END)::int as "likesCount"`,
                `COUNT(CASE WHEN l.status = 'Dislike' THEN 1 END)::int as "dislikesCount"`,
            ])
            .groupBy('p.id')
            .addGroupBy('p.title')
            .addGroupBy('p.shortDescription')
            .addGroupBy('p.content')
            .addGroupBy('p.createdAt')
            .addGroupBy('p.blogId')
            .addGroupBy('b.name');

        switch (queryReq.sortBy) {
            case 'title':
            case 'shortDescription':
            case 'content':
                userQueryBuilder = userQueryBuilder
                    .addSelect(`p."${queryReq.sortBy}" COLLATE "C"`, 'collated')
                    .orderBy('collated', sortDirectionToDb[queryReq.sortDirection])
                    .addGroupBy('collated');
                break;
            case 'blogName':
                userQueryBuilder = userQueryBuilder
                    .addSelect(`b."name" COLLATE "C"`, 'collated')
                    .orderBy('collated', sortDirectionToDb[queryReq.sortDirection])
                    .addGroupBy('collated');
                break;
                default:
                    userQueryBuilder = userQueryBuilder
                        .orderBy (`p."${queryReq.sortBy}"`, `${sortDirectionToDb[queryReq.sortDirection]}`)
        }

        const totalCount: number =
            await userQueryBuilder.getCount()
        if(totalCount === 0)
            return new EmptyPaginator<PostViewDto>();

        queryReq.calculateSkip(totalCount);

        const posts: PostRowViewDto[]
            = await userQueryBuilder
            .offset(queryReq.skip)
            .limit(queryReq.pageSize)
            .getRawMany();

        const postIds = posts.map((post) => post.id).join(', ');

        // find status
        const statuses = new Map<number, Rating>();

        if (userId) {

            const likes = await this.entityManager
                .createQueryBuilder(LikePost, 'l')
                .where('l.userId = :userId', { userId: +userId })
                .andWhere(`l.targetId IN (${postIds})`)
                .getMany();
            for (let like of likes) {
                statuses.set(like.targetId, like.status);
            }
        }

        // find the newest likes
        const rowsLikes: { postId: number; likes: NewestLikesViewDto[] }[]
            = await this.entityManager.query(
              `SELECT
                p."id" AS "postId",
                COALESCE(jsonb_agg(
                  jsonb_build_object(
                    'addedAt', lp."createdAt",
                    'userId', lp."userId"::text,
                    'login', lp."login"
                  )) FILTER (WHERE lp."createdAt" IS NOT NULL),
                        '[]'::jsonb) AS "likes"
              FROM "post" p
              LEFT JOIN LATERAL (
                SELECT
                  l."createdAt",
                  l."userId",
                  u."login"
                FROM "like_post" l
                LEFT JOIN "user" u ON u.id = l."userId"
                WHERE l."targetId" = p."id" AND l.status = 'Like'
                ORDER BY l."createdAt" DESC
                LIMIT 3
              ) lp ON true
              WHERE p."id" IN (${postIds})
              GROUP BY p."id"`);

        // mapping to PostRowViewDto[]
        const postsView
            = posts.map((post: PostRowViewDto) => {
            const status: Rating = statuses.get(post.id) ?? Rating.None;
            return { ...post, myStatus: status };
        });

        return PaginatedViewDto.mapToView({
            items: this.mapPostsView(postsView, rowsLikes),
            page: queryReq.pageNumber,
            size: queryReq.pageSize,
            totalCount: totalCount,
        });
    }
    private mapPostsView(posts: PostRowViewDto[],
                         newestLikes: { postId: number; likes: NewestLikesViewDto[] }[]) {


        const postView: PostViewDto[] = posts.map((post: PostRowViewDto) =>{
            const likes
                = newestLikes.find(l=> l.postId == post.id )
                                                                ?.likes
                                                                ?? [];
            return PostViewDto.mapToView( post, likes)})

        return postView;
    }

}
