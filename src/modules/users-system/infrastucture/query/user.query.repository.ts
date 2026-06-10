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
import { isDbId } from '@core/is.db.id';

@Injectable()
export class UserQueryRepository {

    constructor(
        @InjectRepository(User) private userORMRepo: Repository<User>,
    ){}

    async  findById(id: string): Promise<UserViewDto> {
        // если пост не найден, выкидываем ошибку 404 прямо в репозитории

        const idDB = isDbId(id);
        if (!idDB)
            throw new DomainException({
                message: 'user not found',
                code: DomainExceptionCode.NotFound,
            });

        const user: User|null = await this.userORMRepo.findOne({where: {id: idDB}});

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
                qb.orWhere('user.login ILIKE :login', {
                    login: `%${queryReq.searchLoginTerm}%`,
                });
            }

            if (queryReq.searchEmailTerm != null && queryReq.searchEmailTerm !== '') {
                qb.orWhere('user.email ILIKE :email', {
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

}