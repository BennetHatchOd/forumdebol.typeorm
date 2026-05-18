import { BaseSortablePaginationParams } from '@core/dto/base.query.params.input.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum PostSortBy {
    CreatedAt = 'createdAt',
    Title = 'title',
    ShortDescription = 'shortDescription',
    Content = 'content',
    BlogId = 'blogId',
    BlogName = 'blogName',
}

export class GetPostQueryParams extends BaseSortablePaginationParams<PostSortBy> {
    @IsEnum(PostSortBy)
    sortBy = PostSortBy.CreatedAt;

    @IsString()
    @IsOptional()
    searchBlogId: string | null = null;

    // для поиска всех постов, соответсвующих блогу с id равным searchBlogId
    // устанавливает в query из метода Get, строку поиска
    //
    setBlogIdSearchParams(searchBlogId: string): void {
        this.searchBlogId = searchBlogId;
    }
}

