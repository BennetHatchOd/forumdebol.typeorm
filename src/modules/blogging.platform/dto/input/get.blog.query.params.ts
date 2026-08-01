import { BaseSortablePaginationParams } from '../../../../core/dto/base.query.params.input.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum BlogSortBy {
    CreatedAt = 'createdAt',
    Description = 'description',
    WebsiteUrl = 'websiteUrl',
    Name = 'name',
}

export class GetBlogQueryParams extends BaseSortablePaginationParams<BlogSortBy> {
    @IsEnum(BlogSortBy)
    sortBy = BlogSortBy.CreatedAt;

    @IsString()
    @IsOptional()
    searchNameTerm: string | null = null;
}

