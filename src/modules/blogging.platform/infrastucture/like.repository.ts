import { LikeCreateDto } from '@modules/blogging.platform/dto/create/like.create.dto';
import { Inject } from '@nestjs/common';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource } from 'typeorm';
import { LikeTarget } from '@modules/blogging.platform/dto/enum/like.target.enum';
import { Like } from '@modules/blogging.platform/domain/like.entity';

export class LikeRepository {
    constructor(
        @Inject(DATA_SOURCE) private dataSource: DataSource
    ) {
    }

    async findLike(
        searchDto: LikeCreateDto,
    ): Promise<Like | null> {

        let table: string;

        searchDto.targetType == LikeTarget.Post
            ? table = 'like_post'
            : table = 'like_comment';
        const searchItem: Like[] = await this.dataSource.query(`
                    SELECT *
                    FROM public.${table}
                    WHERE "targetId" = $1
                      AND "userId" = $2
                    LIMIT 1`,
            [searchDto.targetId, searchDto.userId]
        );
        if (searchItem.length == 0)
            return null;

        return searchItem[0];
    }

    async saveLike(like: Like, target: LikeTarget): Promise<void> {
        let table: string;

        target == LikeTarget.Post
            ? table = 'like_post'
            : table = 'like_comment';

        if(!like.id){
            const result = await this.dataSource.query(`
                INSERT INTO public.${table}(
                    "targetId", "userId", status)
                VALUES($1, $2, $3)
                RETURNING id, "createdAt";`,
                [   like.targetId,
                    like.userId,
                    like.status,
                ])
            like.id = result[0].id;
            like.createdAt = result[0].createdAt;
            return
        }

        await this.dataSource.query(`UPDATE public.${table}
        SET
            status = $1
        WHERE id = $2;`,
            [   like.status,
                like.id,
            ]);

        return;
    }
}