import { BaseSortablePaginationParams } from '../../../../core/dto/base.query.params.input.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum CommentSortBy {
    CreatedAt = 'createdAt',
    // content = 'content',
    login = 'userLogin',
}

export class GetCommentQueryParams extends BaseSortablePaginationParams<CommentSortBy> {
    @IsEnum(CommentSortBy)
    sortBy = CommentSortBy.CreatedAt;

    @IsString()
    @IsOptional()
    searchParentPostId: string | null = null;

    // для поиска всех комментов соответсвующих посту с id равным parentPostId
    // устанавливает в query из метода Get, строку поиска
    //
    setParentPostIdSearchParams(parentPostId: string): void {
        this.searchParentPostId = parentPostId;
    }
}

