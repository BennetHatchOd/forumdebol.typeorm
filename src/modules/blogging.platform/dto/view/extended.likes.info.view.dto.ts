import { Rating } from '../enum/rating.enum';

export class ExtendedLikesInfoViewDto {
    likesCount: number;
    dislikesCount: number;
    myStatus: Rating;
    newestLikes: {
        addedAt: string,
        userId: string,
        login: string
    }[]
};
