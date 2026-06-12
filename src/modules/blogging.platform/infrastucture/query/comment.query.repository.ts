import { Inject, Injectable } from '@nestjs/common';
import { CommentViewDto } from '../../dto/view/comment.view.dto';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { GetCommentQueryParams } from '@modules/blogging.platform/dto/input/get.comment.query.params.input.dto';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { EmptyPaginator } from '@core/dto/empty.paginator';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource, EntityManager } from 'typeorm';
import { CommentRowViewDto } from '@modules/blogging.platform/dto/view/row/comment.row.view.dto';
import { isDbId } from '@core/is.db.id';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Comment } from '@modules/blogging.platform/domain/comment.entity';
import { Post } from '@modules/blogging.platform/domain/post.entity';
import { User } from '@modules/users-system/domain/user.entity';

@Injectable()
export class CommentQueryRepository {
    constructor(
        @InjectEntityManager() private entityManager: EntityManager,
    ) {}

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

        const search
            = await this.entityManager
            .createQueryBuilder(Comment, 'c')
            .leftJoin('c.post', 'p')
            .leftJoin('c.user', 'u')
            .select([
                'c.id as "id"',
                'c.content as "content"',
                'c."createdAt" as "createdAt"',
                'u.id as "userId"',
                'u.login as "userLogin"',
            ])
            .where('c.id = :id',{id: id})
            .getRawOne();

        if (!search)
            throw new DomainException({
                message: 'comment not found',
                code: DomainExceptionCode.NotFound,
            });

        return CommentViewDto.mapToView({...search,
            likesCount: 0,
            dislikesCount: 0,
            myStatus: null});
    }

    async find(
        queryReq: GetCommentQueryParams,
        userId: string | null = null,
    ): Promise<PaginatedViewDto<CommentViewDto>> {
        // получаем список всех комментариев, принадлежащих посту, Id которого
        // приходит в query запросе и находится в queryReq.searchParentPostId

        const searchSQL
            = this.entityManager
            .createQueryBuilder(Comment, 'c')
            .leftJoin('c.user', 'p')
            .leftJoin('c.user', 'u')
            .select([
                'c.id as "id"',
                'c.content as "content"',
                'c."createdAt" as "createdAt"',
                'u.id as "userId"',
                'u.login as "userLogin"',
            ])
            .where('p.id = :postId', {postId: queryReq.searchParentPostId})

        const totalCount: number = await searchSQL.getCount();
        if(totalCount === 0)
            return new EmptyPaginator<CommentViewDto>();

        queryReq.calculateSkip(totalCount);


        const comments: CommentRowViewDto[]
            = await searchSQL
            .offset(queryReq.skip)
            .limit(queryReq.pageSize)
            .getRawMany();

        const commentsLikes
            = comments.map((comment: CommentRowViewDto)=>
                {return{...comment,
                    likesCount: 0,
                    dislikesCount: 0,
                    myStatus: null}
                })
        return PaginatedViewDto.mapToView({
            items: this.mapCommentsView(commentsLikes),
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