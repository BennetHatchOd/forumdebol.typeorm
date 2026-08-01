import { BaseSortablePaginationParams } from '@core/dto/base.query.params.input.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PublishedStatus } from '@modules/quiz/dto/type/published.status.type';

export enum QuestionSortBy {
    CreatedAt = 'createdAt',
    Id = 'id',
    UpdatedAt = 'updatedAt',
    Body = 'body',
}

export class GetQuestionQueryParams extends BaseSortablePaginationParams<QuestionSortBy> {
    @IsOptional()
    @IsEnum(QuestionSortBy)
    sortBy = QuestionSortBy.CreatedAt;

    @IsString()
    @IsOptional()
    bodySearchTerm: string | null = null;

    @IsEnum(PublishedStatus)
    @IsOptional()
    publishedStatus: PublishedStatus = PublishedStatus.All;
}

