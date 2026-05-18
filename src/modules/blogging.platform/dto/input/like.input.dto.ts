import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class LikeInputDto {
    @IsNotEmpty()
    @IsEnum(Rating,{
        message: "LikeStatus must be {Like, Dislike, None}",
    })
    likeStatus: Rating;
}