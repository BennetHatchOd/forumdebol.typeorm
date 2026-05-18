import { Rating } from '../enum/rating.enum';
import { PostRowViewDto } from '@modules/blogging.platform/dto/view/row/post.row.view.dto';
import { NewestLikesViewDto } from '@modules/blogging.platform/dto/view/newest.likes.view.dto';

export class PostViewDto {
    id: string;
    title: string;
    shortDescription: string;
    content: string;
    createdAt: string;
    blogId: string;
    blogName: string;
    extendedLikesInfo:{
        likesCount: number
        dislikesCount: number;
        myStatus: Rating;
        newestLikes: {
            addedAt: string,
            userId: string,
            login: string
        }[];
    }

     public static mapToView(
         post: PostRowViewDto,
         likes: NewestLikesViewDto[]
     ): PostViewDto {
         let  myStatus = Rating.None;
         if(post.myStatus == "Like")
             myStatus = Rating.Like;
         if(post.myStatus == "Dislike")
             myStatus = Rating.Dislike;
        const view = new PostViewDto();

        view.id = post.id.toString();
        view.title = post.title;
        view.shortDescription = post.shortDescription;
        view.createdAt = post.createdAt.toISOString();
        view.content = post.content;
        view.blogId = post.blogId.toString();
        view.blogName = post.blogName;
        view.extendedLikesInfo = {
            likesCount: post.likesCount,
            dislikesCount: post.dislikesCount,
            myStatus: myStatus,
            newestLikes: likes
        }

        return  view;
    }
}




