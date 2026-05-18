import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';

export class EmptyPaginator<T> extends PaginatedViewDto<T>{
    pagesCount = 0;
    page = 0;
    pageSize = 0;
    totalCount = 0;
    items:T[]=[]
}