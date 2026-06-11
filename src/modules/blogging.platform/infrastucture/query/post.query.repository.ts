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
import { DataSource, EntityManager } from 'typeorm';
import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';
import console from 'node:console';
import { CommentRowViewDto } from '@modules/blogging.platform/dto/view/row/comment.row.view.dto';
import { PostRowViewDto } from '@modules/blogging.platform/dto/view/row/post.row.view.dto';
import { NewestLikesRowViewDto } from '@modules/blogging.platform/dto/view/newest.likes.row.view.dto';
import { NewestLikesViewDto } from '@modules/blogging.platform/dto/view/newest.likes.view.dto';
import { isDbId } from '@core/is.db.id';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Blog } from '@modules/blogging.platform/domain/blog.entity';
import { sortDirectionToDb } from '@core/dto/base.query.params.input.dto';

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

        const post= await this.entityManager
            .createQueryBuilder(Post, 'p')
            .leftJoin('p.blog', 'b')
            .select([
                'p.id as "id"',
                'p.title as "title"',
                'p.shortDescription as "shortDescription"',
                'p.content as "content"',
                'p.createdAt as "createdAt"',
                "p.blogId",
                `b.name as "blogName"`])
            .where('p.id = :idDB',{idDB:idDB})
            .getRawOne();

        if (!post)
            throw new DomainException({
                message: 'post not found',
                code: DomainExceptionCode.NotFound,
            });

        return PostViewDto.mapToView({...post, dislikesCount: 0, likesCount: 0, myStatus: Rating.None}, [] as NewestLikesViewDto[]);
    }

    async find(queryReq: GetPostQueryParams, userId: string|null = null): Promise<PaginatedViewDto<PostViewDto>> {

        let userQueryBuilder = this.entityManager.createQueryBuilder(Post, 'p');

        if (queryReq.searchBlogId)
            userQueryBuilder = userQueryBuilder.where('p.blogId = :blogId', {blogId: queryReq.searchBlogId});

        userQueryBuilder = userQueryBuilder
            .leftJoin('p.blog', 'b')
            .select([
                'p.id as "id"',
                'p.title as "title"',
                'p.shortDescription as "shortDescription"',
                'p.content as "content"',
                'p.createdAt as "createdAt"',
                "p.blogId",
                `b.name as "blogName"`]);

        let orderBy: string;
        switch (queryReq.sortBy) {
            case 'title':
            case 'shortDescription':
            case 'content':
                userQueryBuilder = userQueryBuilder
                    .addSelect(`p."${queryReq.sortBy}" COLLATE "C"`, 'collated')
                    .orderBy('collated', sortDirectionToDb[queryReq.sortDirection])
                break;
            case 'blogName':
                userQueryBuilder = userQueryBuilder
                    .addSelect(`b."name" COLLATE "C"`, 'collated')
                    .orderBy('collated', sortDirectionToDb[queryReq.sortDirection])
                break;
                default:
                    userQueryBuilder = userQueryBuilder
                        .orderBy (`p."${queryReq.sortBy}"`, `${sortDirectionToDb[queryReq.sortDirection]}`)
        };

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
        const postsView
            = posts.map((post) =>
                                {return {...post, dislikesCount: 0, likesCount: 0, myStatus: null}})

        return PaginatedViewDto.mapToView({
            items: this.mapPostsView(postsView, []),
            page: queryReq.pageNumber,
            size: queryReq.pageSize,
            totalCount: totalCount,
        });
    }
    private mapPostsView(posts: PostRowViewDto[],
                         newestLikes: any[]) {


        const postView: PostViewDto[] = posts.map((post: PostRowViewDto) =>{
            const likes = []
                // = newestLikes.find(l=> l.postId == post.id )
                //                                                 ?.newestLikes
                //                                                 ?? [];
            return PostViewDto.mapToView( post, likes)})

        return postView;
    }

}
