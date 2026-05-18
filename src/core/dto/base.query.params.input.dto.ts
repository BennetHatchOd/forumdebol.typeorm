import { Type } from 'class-transformer';
import { IsEnum, IsNumber, Min } from 'class-validator';

class PaginationParams {

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageNumber: number = 1;
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageSize: number = 10;

    public skip: number = 0;

    calculateSkip(totalPage: number): void {

        let  maxPage: number = Math.floor(totalPage / this.pageSize);
        if (totalPage % this.pageSize > 0)
            maxPage++;
        if ( maxPage < this.pageNumber )
            this.pageNumber = maxPage;

        this.skip = (this.pageNumber - 1) * this.pageSize;
    }
}

export enum SortDirection {
    Asc = 'asc',
    Desc = 'desc',
}

//базовый класс для query параметров с сортировкой и пагинацией
//поле sortBy должно быть реализовано в наследниках
export abstract class BaseSortablePaginationParams<T> extends PaginationParams {
    @IsEnum(SortDirection)
    sortDirection: SortDirection = SortDirection.Desc;
    abstract sortBy: T;
}