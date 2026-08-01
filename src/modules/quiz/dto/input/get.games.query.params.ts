import { BaseSortablePaginationParams } from '@core/dto/base.query.params.input.dto';
import { IsEnum, IsOptional } from 'class-validator';

export enum GamesSortBy {
    PairCreatedDate = 'pairCreatedDate',
    Id = 'id',
    StartGameDate = 'startGameDate',
    FinishGameDate = 'finishGameDate',
    status = 'status',
}

export const gamesSortByToDb: Record<GamesSortBy, 'id' | 'pairCreatedAt' | 'startAt' | 'finishAt' | 'status'> = {
    [GamesSortBy.Id]: 'id',
    [GamesSortBy.PairCreatedDate]: 'pairCreatedAt',
    [GamesSortBy.StartGameDate]: 'startAt',
    [GamesSortBy.FinishGameDate]: 'finishAt',
    [GamesSortBy.status]: 'status'
};
export class GetGamesQueryParams extends BaseSortablePaginationParams<GamesSortBy> {
    @IsOptional()
    @IsEnum(GamesSortBy)
    sortBy = GamesSortBy.PairCreatedDate;
}

