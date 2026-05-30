import { Inject, Injectable } from '@nestjs/common';
import { CommentViewDto } from '../../dto/view/comment.view.dto';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { GetCommentQueryParams } from '@modules/blogging.platform/dto/input/get.comment.query.params.input.dto';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { EmptyPaginator } from '@core/dto/empty.paginator';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource } from 'typeorm';
import { CommentRowViewDto } from '@modules/blogging.platform/dto/view/row/comment.row.view.dto';

@Injectable()
export class CommentQueryRepository {
    constructor(
        @Inject(DATA_SOURCE) private dataSource: DataSource,
    ) {}

    async findByIdWithCheck(
        id: string,
        userId: string | null = null,
    ): Promise<CommentViewDto> {
        // returns a comment by id, if comment isn't found throws an exception

        const numericId = Number(id);
        if (!Number.isInteger(numericId) || numericId < 1)
            throw new DomainException({
                message: 'comment not found',
                code: DomainExceptionCode.NotFound,
            });

        const search: CommentRowViewDto[] = await this.dataSource.query(`
                    SELECT
                        c.*,
                        u.login AS "userLogin",
                        counts.likes_count AS "likesCount",
                        counts.dislikes_count AS "dislikesCount",
                        me.my_status AS "myStatus"
                    FROM public.comments c
                    JOIN public.user u ON c."userId" = u.id
                    LEFT JOIN LATERAL (
                        SELECT
                            COUNT(*) FILTER (WHERE l.status = 'Like')::int AS likes_count,
                            COUNT(*) FILTER (WHERE l.status = 'Dislike')::int AS dislikes_count
                        FROM public.like_comment l
                        WHERE l."targetId" = c.id
                        ) counts ON true
                    LEFT JOIN LATERAL (
                        SELECT l2.status AS my_status
                        FROM public.like_comment l2
                        WHERE l2."targetId" = c.id
                          AND l2."userId" = $2
                        LIMIT 1
                        ) me ON true
                    WHERE c.id = $1
                      AND c."deletedAt" IS NULL;`,
            [numericId, userId]
        );
        if (search.length == 0)
            throw new DomainException({
                message: 'comment not found',
                code: DomainExceptionCode.NotFound,
            });

        return CommentViewDto.mapToView(search[0]);
    }

    async find(
        queryReq: GetCommentQueryParams,
        userId: string | null = null,
    ): Promise<PaginatedViewDto<CommentViewDto>> {
        // получаем список всех комментариев, принадлежащих посту, Id которого
        // приходит в query запросе и находится в queryReq.searchParentPostId

        let whereSql: string = `c."deletedAt" IS NULL AND c."postId" = $1`;
        const queryParams: any[] = [];
        const countParams: any[] = [];
        queryParams.push(`${queryReq.searchParentPostId}`);
        queryParams.push(userId);
        countParams.push(`${queryReq.searchParentPostId}`);


        let orderBy: string;
        switch (queryReq.sortBy) {
            case 'content':
                orderBy =
                    `c."${queryReq.sortBy}" COLLATE "C" ${queryReq.sortDirection}`
                break;
            case 'userLogin':
                orderBy =
                    `u."login" COLLATE "C" ${queryReq.sortDirection}`
                break;
            default:
                orderBy =
                    `c."${queryReq.sortBy}" ${queryReq.sortDirection}`
        }

        const sqlCount = `
            SELECT COUNT(*) AS count 
            FROM public.comments c 
            WHERE ${whereSql};`;

        const totalCount: number = +(await this.dataSource.query(sqlCount, countParams))[0].count;
        if(totalCount === 0)
            return new EmptyPaginator<CommentViewDto>();

        queryReq.calculateSkip(totalCount);

        const comments: CommentRowViewDto[] = await this.dataSource.query(`
                    SELECT
                        c.*,
                        u.login AS "userLogin",
                        counts.likes_count AS "likesCount",
                        counts.dislikes_count AS "dislikesCount",
                        me.my_status AS "myStatus"
                    FROM public.comments c
                    JOIN public.user u ON c."userId" = u.id
                    LEFT JOIN LATERAL (
                        SELECT
                            COUNT(*) FILTER (WHERE l.status = 'Like')::int AS likes_count,
                            COUNT(*) FILTER (WHERE l.status = 'Dislike')::int AS dislikes_count
                        FROM public.like_comment l
                        WHERE l."targetId" = c.id
                        ) counts ON true
                    LEFT JOIN LATERAL (
                        SELECT l2.status AS my_status
                        FROM public.like_comment l2
                        WHERE l2."targetId" = c.id
                          AND l2."userId" = $2
                        LIMIT 1
                        ) me ON true
                    WHERE ${whereSql}
                    ORDER BY ${orderBy}
                    LIMIT ${queryReq.pageSize} OFFSET ${queryReq.skip};`,
            queryParams);

        return PaginatedViewDto.mapToView({
            items: this.mapCommentsView(comments),
            page: queryReq.pageNumber,
            size: queryReq.pageSize,
            totalCount: totalCount,
        });
    }

    private mapCommentsView(comments:CommentRowViewDto[]){
        const commentView: CommentViewDto[] = comments.map((value) =>
            (CommentViewDto.mapToView(value)))

        return commentView;
    }
}