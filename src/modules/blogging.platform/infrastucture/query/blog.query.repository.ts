import { Inject, Injectable } from '@nestjs/common';
import { BlogViewDto } from '../../dto/view/blog.view.dto';
import { Blog } from '../../domain/blog.entity';
import { GetBlogQueryParams } from '../../dto/input/get.blog.query.params.input.dto';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { EmptyPaginator } from '@core/dto/empty.paginator';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource } from 'typeorm';


@Injectable()
export class BlogQueryRepository {

    constructor(@Inject(DATA_SOURCE) private dataSource: DataSource) {}

    async  findByIdWithCheck(id: string): Promise<BlogViewDto> {
        const numericId = Number(id);
        if (!Number.isInteger(numericId) || numericId < 1)
            throw new DomainException({
                message: 'blog not found',
                code: DomainExceptionCode.NotFound});


        const blog: Blog[] = await this.dataSource.query(`
            SELECT * 
                FROM public.blog 
                WHERE 
                      id = $1 
                  AND "deletedAt" IS NULL 
                LIMIT 1;`,
            [numericId]);

        if(blog.length == 0){
            throw new DomainException({
                message: 'blog not found',
                code: DomainExceptionCode.NotFound});
        }

        return BlogViewDto.mapToView(blog[0]);
    }

    async find(queryReq: GetBlogQueryParams): Promise<PaginatedViewDto<BlogViewDto>> {
        let whereSql: string = `"deletedAt" IS NULL`;
        const queryParams: any[] = [];

        if (queryReq.searchNameTerm) {
            whereSql += ` AND name ILIKE $1`;
            queryParams.push(`%${queryReq.searchNameTerm}%`);
        }

        const orderBy =
            queryReq.sortBy === 'name' || queryReq.sortBy === 'description'
            || queryReq.sortBy === 'websiteUrl'
                ? `"${queryReq.sortBy}" COLLATE "C" ${queryReq.sortDirection}`
                : `"${queryReq.sortBy}" ${queryReq.sortDirection}`;

        const sqlRequest = `FROM public.blog WHERE ${whereSql}`;
        const sqlCount = `SELECT COUNT(*) AS count ${sqlRequest};`;
        const totalCount: number = await this.dataSource.query(sqlCount + ';', queryParams);
        queryReq.calculateSkip(+totalCount[0].count);

        const sqlQuery = ` SELECT * ${sqlRequest}
            ORDER BY ${orderBy} 
            LIMIT ${queryReq.pageSize} OFFSET ${queryReq.skip};`;


        if(+totalCount[0].count === 0)
            return new EmptyPaginator<BlogViewDto>();

        const blogs: Blog[] = await this.dataSource.query(sqlQuery, queryParams);

        const items = blogs.map(BlogViewDto.mapToView);

        return PaginatedViewDto.mapToView({
            items: items,
            page: queryReq.pageNumber,
            size: queryReq.pageSize,
            totalCount: +totalCount[0].count
        })
    }
}