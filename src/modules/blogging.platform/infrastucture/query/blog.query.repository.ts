import { Injectable } from '@nestjs/common';
import { BlogViewDto } from '../../dto/view/blog.view.dto';
import { Blog } from '../../domain/blog.entity';
import { GetBlogQueryParams } from '../../dto/input/get.blog.query.params.input.dto';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { EmptyPaginator } from '@core/dto/empty.paginator';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isDbId } from '@core/is.db.id';
import { sortDirectionToDb } from '@core/dto/base.query.params.input.dto';
import console from 'node:console';


@Injectable()
export class BlogQueryRepository {

    constructor(@InjectRepository(Blog) private blogORMRepo: Repository<Blog>) {}

    async  findById(id: string): Promise<BlogViewDto> {
        const idDB = isDbId(id);
        if (!idDB)
        throw new DomainException({
                message: 'blog not found',
                code: DomainExceptionCode.NotFound});


        const blog: Blog | null = await this.blogORMRepo
                                        .createQueryBuilder('b')
                                        .where('b.id = :idDB',{idDB})
                                        .getOne();

        if(!blog)
            throw new DomainException({
                message: 'blog not found',
                code: DomainExceptionCode.NotFound});

        return BlogViewDto.mapToView(blog);
    }

    async find(queryReq: GetBlogQueryParams): Promise<PaginatedViewDto<BlogViewDto>> {

        const req = this.blogORMRepo.createQueryBuilder('b');
        req.where(`"deletedAt" IS NULL`);

        if (queryReq.searchNameTerm) {
            req.andWhere('name ILIKE :name', {name: `%${queryReq.searchNameTerm}%`})
        }

        if( queryReq.sortBy === 'name' || queryReq.sortBy === 'description'
            || queryReq.sortBy === 'websiteUrl'){
                req.addSelect(`"b"."${queryReq.sortBy}" COLLATE "C"`, 'collated')
                .orderBy('collated', sortDirectionToDb[queryReq.sortDirection])
        }else{
            req.orderBy(`b.${queryReq.sortBy}`, sortDirectionToDb[queryReq.sortDirection])
        }


        const totalCount: number = await req.getCount();
        if(totalCount === 0)
            return new EmptyPaginator<BlogViewDto>();

        queryReq.calculateSkip(+totalCount);

        const blogs: Blog[] = await req.take(queryReq.pageSize).skip(queryReq.skip).getMany();

        const items = blogs.map(BlogViewDto.mapToView);

        return PaginatedViewDto.mapToView({
            items: items,
            page: queryReq.pageNumber,
            size: queryReq.pageSize,
            totalCount: totalCount
        })
    }
}