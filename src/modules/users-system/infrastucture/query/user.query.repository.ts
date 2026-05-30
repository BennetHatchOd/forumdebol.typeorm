import { Injectable } from '@nestjs/common';
import { UserViewDto } from '../../dto/view/user.view.dto';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { GetUserQueryParams } from '../../dto/input/get.user.query.params.input.dto';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { EmptyPaginator } from '@core/dto/empty.paginator';
import { FindManyOptions, ILike, Repository } from 'typeorm';
import { User } from '@modules/users-system/domain/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserQueryRepository {

    constructor(
        @InjectRepository(User) private userORMRepo: Repository<User>,
    ){}

    async  findById(id: string): Promise<UserViewDto> {
        // если пост не найден, выкидываем ошибку 404 прямо в репозитории

        const numericId = Number(id);
        if( !Number.isInteger(numericId) || numericId < 1)
            throw new DomainException({
                message: 'user not found',
                code: DomainExceptionCode.NotFound,
            });

        const user: User|null = await this.userORMRepo.findOne({where: {id: numericId}});

        if(!user){
            throw new DomainException({
                message: 'user not found',
                code: DomainExceptionCode.NotFound});
        }
        return UserViewDto.mapToView(user);
    }

    async find(queryReq: GetUserQueryParams): Promise<PaginatedViewDto<UserViewDto>> {
        const collateFields = new Set(['login', 'email']);

        const buildQuery = () => {
            const qb = this.userORMRepo.createQueryBuilder('user');

            if (queryReq.searchLoginTerm != null && queryReq.searchLoginTerm !== '') {
                qb.andWhere('user.login ILIKE :login', {
                    login: `%${queryReq.searchLoginTerm}%`,
                });
            }

            if (queryReq.searchEmailTerm != null && queryReq.searchEmailTerm !== '') {
                qb.andWhere('user.email ILIKE :email', {
                    email: `%${queryReq.searchEmailTerm}%`,
                });
            }

            const sortDirection = queryReq.sortDirection.toUpperCase() as 'ASC' | 'DESC';

            if (collateFields.has(queryReq.sortBy)) {
                qb.orderBy(`"${queryReq.sortBy}" COLLATE "C"`, sortDirection);
            } else {
                qb.orderBy(`"${queryReq.sortBy}"`, sortDirection);
            }

            return qb;
        };

        const totalCount = await buildQuery().getCount();

        if (totalCount === 0) {
            return new EmptyPaginator<UserViewDto>();
        }

        queryReq.calculateSkip(totalCount);

        const users = await buildQuery()
            .skip(queryReq.skip)
            .take(queryReq.pageSize)
            .getMany();

        const items = users.map(UserViewDto.mapToView);

        return PaginatedViewDto.mapToView({
            items,
            page: queryReq.pageNumber,
            size: queryReq.pageSize,
            totalCount,
        });
    }



    // async find(queryReq: GetUserQueryParams): Promise<PaginatedViewDto<UserViewDto>> {
    //
    //     const totalCount: number = await this.userORMRepo.count(this.buildFindOptions(queryReq));
    //     if(totalCount === 0)
    //         return new EmptyPaginator<UserViewDto>();
    //
    //     queryReq.calculateSkip(totalCount);
    //
    //     const users: User[] = await this.userORMRepo.find(this.buildFindOptions(queryReq));
    //
    //     const items = users.map(UserViewDto.mapToView);
    //
    //     return PaginatedViewDto.mapToView({
    //         items: items,
    //         page: queryReq.pageNumber,
    //         size: queryReq.pageSize,
    //         totalCount: totalCount
    //     })
    //
    // }
    // private buildFindOptions(dto: GetUserQueryParams): FindManyOptions<User> {
    //     const options: FindManyOptions<User> = {};
    //
    //     const where: any = {};
    //
    //     if (dto.searchLoginTerm !== null )
    //         where.login = ILike(`%${dto.searchLoginTerm}%`);
    //
    //     if (dto.searchEmailTerm !== null )
    //         where.email = ILike(`%${dto.searchEmailTerm}%`);
    //
    //     if (Object.keys(where).length > 0)
    //         options.where = where;
    //
    //     if (dto.maxPage > 0) {
    //         options.order = { [dto.sortBy]: dto.sortDirection };
    //
    //         options.take = dto.pageSize;
    //         options.skip = dto.skip;
    //     }
    //     return options;
    // }
}