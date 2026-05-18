import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';
import { CommentRowViewDto } from '@modules/blogging.platform/dto/view/row/comment.row.view.dto';

export class CommentViewDto {
        public id: string;
        public content: string;
        public createdAt: string;
        public commentatorInfo: {
            userId: string,
            userLogin: string,
        }
        public likesInfo:  {
            likesCount: number,
            dislikesCount: number,
            myStatus: Rating,
        };


        public static mapToView(item: CommentRowViewDto): CommentViewDto {
            let  myStatus = Rating.None;
            if(item.myStatus == "Like")
                myStatus = Rating.Like;
            if(item.myStatus == "Dislike")
                myStatus = Rating.Dislike;
            const view = new CommentViewDto();
            view.id = item.id.toString();
            view.content = item.content;
            view.createdAt = item.createdAt.toISOString();
            view.commentatorInfo = {
                 userId: item.userId.toString(),
                 userLogin: item.userLogin,
            };
            view.likesInfo =  {
                 likesCount: item.likesCount,
                 dislikesCount: item.dislikesCount,
                 myStatus: myStatus,
            }
            return view;

        }
}

