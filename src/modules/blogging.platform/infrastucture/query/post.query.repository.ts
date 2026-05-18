import { Inject, Injectable } from '@nestjs/common';
import { Post } from '../../domain/post.entity';
import { PostViewDto } from '../../dto/view/post.view.dto';
import { GetPostQueryParams } from '../../dto/input/get.post.query.params.input.dto';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { LikesInfoViewDto } from '@modules/blogging.platform/dto/view/likes.info.view.dto';
import { EmptyPaginator } from '@core/dto/empty.paginator';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource } from 'typeorm';
import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';
import console from 'node:console';
import { CommentRowViewDto } from '@modules/blogging.platform/dto/view/row/comment.row.view.dto';
import { PostRowViewDto } from '@modules/blogging.platform/dto/view/row/post.row.view.dto';
import { NewestLikesRowViewDto } from '@modules/blogging.platform/dto/view/newest.likes.row.view.dto';
import { NewestLikesViewDto } from '@modules/blogging.platform/dto/view/newest.likes.view.dto';

@Injectable()
export class PostQueryRepository {
    constructor(
        @Inject(DATA_SOURCE) private dataSource: DataSource,
    ){}

    async  findByIdWithCheck(
        id: string,
        userId: string|null = null): Promise<PostViewDto> {
        // returns a post by id, if post isn't found throws an exception

        const numericId = Number(id);
        if (!Number.isInteger(numericId) || numericId < 1)
            throw new DomainException({
                message: 'post not found',
                code: DomainExceptionCode.NotFound,
            });

        const post: PostRowViewDto[] = await this.dataSource.query(`
                    SELECT
                        p.*, 
                        b.name AS "blogName",
                        counts.likes_count AS "likesCount",
                        counts.dislikes_count AS "dislikesCount",
                        me.my_status AS "myStatus"
                    FROM public.posts p
                    JOIN public.blogs b ON p."blogId" = b.id
                    LEFT JOIN LATERAL (
                        SELECT
                            COUNT(*) FILTER (WHERE l.status = 'Like')::int AS likes_count,
                            COUNT(*) FILTER (WHERE l.status = 'Dislike')::int AS dislikes_count
                        FROM public.like_post l
                        WHERE l."targetId" = p.id
                        ) counts ON true
                    LEFT JOIN LATERAL (
                        SELECT l2.status AS my_status
                        FROM public.like_post l2
                        WHERE l2."targetId" = p.id
                          AND l2."userId" = $2
                        LIMIT 1
                        ) me ON true
                    WHERE p.id = $1
                      AND p."deletedAt" IS NULL;`,
            [numericId, userId]
        );

        if (post.length == 0)
            throw new DomainException({
                message: 'post not found',
                code: DomainExceptionCode.NotFound,
            });

        const likes: NewestLikesRowViewDto[] = await this.dataSource.query(`
              SELECT
                  l."createdAt" AS "addedAt",
                  l."userId"::text AS "userId",
                  u.login AS "login"
              FROM public.like_post l
              JOIN public."Users" u ON u.id = l."userId"
              WHERE l."targetId" = $1
                AND l.status = 'Like'
              ORDER BY l."createdAt" DESC
              LIMIT 3;`,
              [numericId]);

        const likesViewDto = likes.map(l => NewestLikesViewDto.mapToView(l))
        return PostViewDto.mapToView(post[0], likesViewDto);
    }

    async find(queryReq: GetPostQueryParams, userId: string|null = null): Promise<PaginatedViewDto<PostViewDto>> {

        let whereSql: string = `p."deletedAt" IS NULL AND b."deletedAt" IS NULL`;
        const queryParams: any[] = [];
        const countParams: any[] = [];

        if (queryReq.searchBlogId) {
            whereSql += ` AND b.id = $1`;
            queryParams.push(`${queryReq.searchBlogId}`);
            countParams.push(`${queryReq.searchBlogId}`);
        }
        const userIdParam = queryReq.searchBlogId ? '$2' : '$1';
        queryParams.push(userId);

        let orderBy: string;
        switch (queryReq.sortBy) {
            case 'title':
            case 'shortDescription':
            case 'content':
                orderBy =
                    `p."${queryReq.sortBy}" COLLATE "C" ${queryReq.sortDirection}`
                break;
            case 'blogName':
                orderBy =
                    `b."name" COLLATE "C" ${queryReq.sortDirection}`
                break;
                default:
                    orderBy =
                    `p."${queryReq.sortBy}" ${queryReq.sortDirection}`
        }

        const sqlCount = `
            SELECT COUNT(*)::int AS count 
            FROM public.posts p 
            JOIN public.blogs b ON b.id = p."blogId" 
            WHERE ${whereSql};`;

        const totalCount: number =
            +(await this.dataSource.query(sqlCount, countParams))[0].count;
        if(totalCount === 0)
            return new EmptyPaginator<PostViewDto>();

        queryReq.calculateSkip(totalCount);

        const posts: PostRowViewDto[] = await this.dataSource.query(`
                    SELECT
                        p.*, 
                        b.name AS "blogName",
                        counts.likes_count AS "likesCount",
                        counts.dislikes_count AS "dislikesCount",
                        me.my_status AS "myStatus"
                    FROM public.posts p
                    JOIN public.blogs b ON p."blogId" = b.id
                    LEFT JOIN LATERAL (
                        SELECT
                            COUNT(*) FILTER (WHERE l.status = 'Like')::int AS likes_count,
                            COUNT(*) FILTER (WHERE l.status = 'Dislike')::int AS dislikes_count
                        FROM public.like_post l
                        WHERE l."targetId" = p.id
                        ) counts ON true
                    LEFT JOIN LATERAL (
                        SELECT l2.status AS my_status
                        FROM public.like_post l2
                        WHERE l2."targetId" = p.id
                          AND l2."userId" = ${userIdParam}
                        LIMIT 1
                        ) me ON true
                    WHERE ${whereSql}
                    ORDER BY ${orderBy}
                    LIMIT ${queryReq.pageSize} OFFSET ${queryReq.skip};`,
            queryParams);

        const postsId: number[] = posts.map(p => p.id );

        const newestLikes = await this.dataSource.query(`
                    SELECT
                        p.id AS "postId",
                        COALESCE(
                                json_agg(
                                json_build_object(
                                        'addedAt', nl."createdAt",
                                        'userId', nl."userId",
                                        'login', nl."login"
                                )
                                ORDER BY nl."createdAt" DESC
                                        ) FILTER (WHERE nl."userId" IS NOT NULL),
                                '[]'::json
                        ) AS "newestLikes"
                    FROM public.posts p
                             LEFT JOIN LATERAL (
                        SELECT
                            l."createdAt",
                            l."userId"::text AS "userId",
                            u.login
                        FROM public.like_post l
                                 JOIN public."Users" u ON u.id = l."userId"
                        WHERE l."targetId" = p.id
                          AND l.status = 'Like'
                        ORDER BY l."createdAt" DESC
                        LIMIT 3
                        ) nl ON true
                    WHERE p.id = ANY($1)
                    GROUP BY p.id;`,
            [postsId]);

        return PaginatedViewDto.mapToView({
            items: this.mapPostsView(posts, newestLikes),
            page: queryReq.pageNumber,
            size: queryReq.pageSize,
            totalCount: totalCount,
        });
    }
    private mapPostsView(posts: PostRowViewDto[],
                         newestLikes: any[]) {


        const postView: PostViewDto[] = posts.map((post: PostRowViewDto) =>{
            const likes
                = newestLikes.find(l=> l.postId == post.id )
                                                                ?.newestLikes
                                                                ?? [];
            return PostViewDto.mapToView( post, likes)})

        return postView;
    }

}
