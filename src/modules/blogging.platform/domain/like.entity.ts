import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';
import { LikeCreateDto } from '@modules/blogging.platform/dto/create/like.create.dto';

export class Like {

    id: number;
    targetId: number;
    userId: number;
    status: Rating;
    createdAt: Date;

    static createInstance(dto: LikeCreateDto): Like {
        const like = new this();
        like.targetId = +dto.targetId;
        like.userId = +dto.userId;
        like.status = dto.status;
        return like;
    }
}
