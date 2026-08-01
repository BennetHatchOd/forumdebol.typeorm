import { Injectable } from '@nestjs/common';
import { CommentViewDto } from '../../dto/view/comment.view.dto';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { GetCommentQueryParams } from '@modules/blogging.platform/dto/input/get.comment.query.params';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { EmptyPaginator } from '@core/dto/empty.paginator';
import { EntityManager } from 'typeorm';
import { CommentRowViewDto } from '@modules/blogging.platform/dto/view/row/comment.row.view.dto';
import { isDbId } from '@core/is.db.id';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Comment } from '@modules/blogging.platform/domain/comment.entity';
import { LikeComment } from '@modules/blogging.platform/domain/like.comment.entity';
import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';
import { sortDirectionToDb } from '@core/dto/base.query.params.input.dto';

@Injectable()
export class CommentQueryRepository {
    constructor(@InjectEntityManager() private entityManager: EntityManager) {}

    async findByIdWithCheck(
        id: string,
        userId: string | null = null,
    ): Promise<CommentViewDto> {
        // returns a comment by id, if comment isn't found throws an exception

        const idDB = isDbId(id);
        if (!idDB)
            throw new DomainException({
                message: 'comment not found',
                code: DomainExceptionCode.NotFound,
            });

        const comment = await this.entityManager
            .createQueryBuilder(Comment, 'c')
            .leftJoin('c.user', 'u')
            .leftJoin(LikeComment, 'l', 'l.targetId = c.id')
            .select([
                'c.id as "id"',
                'c.content as "content"',
                'c."createdAt" as "createdAt"',
                'u.id as "userId"',
                'u.login as "userLogin"',
                `COUNT(CASE WHEN l.status = 'Like' THEN 1 END)::int as "likesCount"`,
                `COUNT(CASE WHEN l.status = 'Dislike' THEN 1 END)::int as "dislikesCount"`,
            ])
            .where('c.id = :id', { id: idDB })
            .groupBy('c.id')
            .addGroupBy('c.content')
            .addGroupBy('c.createdAt')
            .addGroupBy('u.id')
            .addGroupBy('u.login')
            .getRawOne();

        if (!comment)
            throw new DomainException({
                message: 'comment not found',
                code: DomainExceptionCode.NotFound,
            });

        let status = Rating.None;
        if(userId) {
            const like = await this.entityManager
                .createQueryBuilder(LikeComment, 'l')
                .where('l.targetId = :targetId', { targetId: idDB })
                .andWhere('l.userId = :userId', { userId: +userId })
                .getOne();

            if (like) status = like.status;
        }
        return CommentViewDto.mapToView({ ...comment, myStatus: status });
    }

    async find(
        queryReq: GetCommentQueryParams,
        userId: string | null = null,
    ): Promise<PaginatedViewDto<CommentViewDto>> {
        // получаем список всех комментариев, принадлежащих посту, Id которого
        // приходит в query запросе и находится в queryReq.searchParentPostId

        let searchSQL = this.entityManager
            .createQueryBuilder(Comment, 'c')
            .leftJoin('c.user', 'u')
            .leftJoin('c.post', 'p')
            .leftJoin(LikeComment, 'l', 'l.targetId = c.id')
            .select([
                'c.id as "id"',
                'c.content as "content"',
                'c."createdAt" as "createdAt"',
                'u.id as "userId"',
                'u.login as "userLogin"',
                `COUNT(CASE WHEN l.status = 'Like' THEN 1 END)::int as "likesCount"`,
                `COUNT(CASE WHEN l.status = 'Dislike' THEN 1 END)::int as "dislikesCount"`,
            ])
            .groupBy('c.id')
            .addGroupBy('c.content')
            .addGroupBy('c.createdAt')
            .addGroupBy('u.id')
            .addGroupBy('u.login')
            .where('p.id = :postId', { postId: queryReq.searchParentPostId });

        const totalCount: number = await searchSQL.getCount();
        if (totalCount === 0) return new EmptyPaginator<CommentViewDto>();

        queryReq.calculateSkip(totalCount);

        searchSQL = (queryReq.sortBy === 'userLogin')
            ? searchSQL.orderBy(`"${queryReq.sortBy}" COLLATE C`,sortDirectionToDb[queryReq.sortDirection])
            :  searchSQL.orderBy(`"${queryReq.sortBy}"`, sortDirectionToDb[queryReq.sortDirection]);

        const comments: CommentRowViewDto[] = await searchSQL
            .offset(queryReq.skip)
            .limit(queryReq.pageSize)
            .getRawMany();

        const statuses = new Map<number, Rating>();
        if (userId) {
            const commentIds = comments.map((comment) => comment.id).join(', ');

            const likes = await this.entityManager
                .createQueryBuilder(LikeComment, 'l')
                .where('l.userId = :userId', { userId: +userId })
                .andWhere(`l.targetId IN (${commentIds})`)
                .getMany();
            for (let like of likes) {
                statuses.set(like.targetId, like.status);
            }
        }

        const commentsLikes = comments.map((comment: CommentRowViewDto) => {
            const status: Rating = statuses.get(comment.id) ?? Rating.None;
            return { ...comment, myStatus: status };
        });
        return PaginatedViewDto.mapToView({
            items: this.mapCommentsView(commentsLikes),
            page: queryReq.pageNumber,
            size: queryReq.pageSize,
            totalCount: totalCount,
        });
    }

    private mapCommentsView(comments: CommentRowViewDto[]) {
        const commentView: CommentViewDto[] = comments.map((value) =>
            CommentViewDto.mapToView(value),
        );

        return commentView;
    }
}