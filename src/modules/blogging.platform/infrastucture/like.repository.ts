import { LikeCreateDto } from '@modules/blogging.platform/dto/create/like.create.dto';
import { EntityManager } from 'typeorm';
import { LikeTarget } from '@modules/blogging.platform/dto/enum/like.target.enum';
import { LikeBase } from '@modules/blogging.platform/domain/like.base';
import { InjectEntityManager } from '@nestjs/typeorm';

export class LikeRepository {
    constructor(
        @InjectEntityManager() private entityManager: EntityManager
    ) {
    }

    async findLike(
        searchDto: LikeCreateDto,
    ): Promise<LikeBase | null> {

        let queryBuilder: any;

        if(searchDto.targetType == LikeTarget.Post) {
            queryBuilder = this.entityManager.createQueryBuilder('LikePost', 'like');
        }else {
            queryBuilder = this.entityManager.createQueryBuilder('LikeComment', 'like');
        }
        const searchItem = queryBuilder
            .where(`"targetId" = :targetId AND "userId"= :userId`,
                { targetId: searchDto.targetId,
                  userId: searchDto.userId})
                .getOne();

        return searchItem;
    }

    async save(like: LikeBase): Promise<void> {

        await this.entityManager.save(like);

        return;
    }
}