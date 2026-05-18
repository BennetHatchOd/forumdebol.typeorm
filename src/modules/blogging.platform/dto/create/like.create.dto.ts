import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';
import { LikeTarget } from '@modules/blogging.platform/dto/enum/like.target.enum';

export class LikeCreateDto {

    targetId: string;
    userId: string;
    status: Rating;
    targetType: LikeTarget;
}