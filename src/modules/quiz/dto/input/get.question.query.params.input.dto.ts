import { BaseSortablePaginationParams } from '@core/dto/base.query.params.input.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PublishedStatus } from '@modules/quiz/dto/type/published.status.type';

export enum QuestionSortBy {
    CreatedAt = 'createdAt',
    Id = 'id',
    UpdatedAt = 'updatedAt',
}

export class GetQuestionQueryParams extends BaseSortablePaginationParams<QuestionSortBy> {
    @IsEnum(QuestionSortBy)
    sortBy = QuestionSortBy.CreatedAt;

    @IsString()
    @IsOptional()
    bodySearchTerm: string | null = null;

    @IsEnum(PublishedStatus)
    @IsOptional()
    publishedStatus: PublishedStatus = PublishedStatus.All;
}

