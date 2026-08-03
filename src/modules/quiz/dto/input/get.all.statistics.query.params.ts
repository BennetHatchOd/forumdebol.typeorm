import { PaginationParams } from '@core/dto/base.query.params.input.dto';
import { IsArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsSortByWithDirection } from '@core/decorators/is.sort.by.with.direction';

export enum GamesUsersTopSortBy {
    avgScores = 'avgScores',
    sumScore = 'sumScore',
    gamesCount = 'gamesCount',
    winsCount = 'winsCount',
    lossesCount = 'lossesCount',
    drawsCount = 'drawsCount',
}

export class GetAllStatisticsQueryParams extends PaginationParams {
    @IsOptional()
    @Transform(({ value }) =>
        value == null ? undefined : Array.isArray(value) ? value : [value],
    )
    @IsArray()
    @IsSortByWithDirection({ message: 'Invalid sortBy format' })
    sort?: string | string[];
}