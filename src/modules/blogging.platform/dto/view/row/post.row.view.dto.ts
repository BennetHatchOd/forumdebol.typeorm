import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';

export class PostRowViewDto {
    id: number;
    title: string;
    shortDescription: string;
    content: string;
    createdAt: Date;
    blogId: number;
    blogName: string;
    likesCount: number
    dislikesCount: number;
    myStatus: Rating;
}
