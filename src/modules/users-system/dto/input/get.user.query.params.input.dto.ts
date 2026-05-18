import { BaseSortablePaginationParams } from '@core/dto/base.query.params.input.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum UserSortBy {
    CreatedAt = 'createdAt',
    login = 'login',
    email = 'email',
}

export class GetUserQueryParams extends BaseSortablePaginationParams<UserSortBy> {
    @IsEnum(UserSortBy)
    sortBy = UserSortBy.CreatedAt;

    @IsString()
    @IsOptional()
    searchLoginTerm: string | null = null;

    @IsString()
    @IsOptional()
    searchEmailTerm: string | null = null;
}

