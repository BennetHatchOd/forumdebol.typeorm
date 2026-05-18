import { Rating } from '../enum/rating.enum';

export class LikesInfoViewDto {
    likesCount: number;
    dislikesCount: number;
    myStatus: Rating;
};