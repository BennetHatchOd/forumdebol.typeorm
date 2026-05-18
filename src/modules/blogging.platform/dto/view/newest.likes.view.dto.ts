import { NewestLikesRowViewDto } from '@modules/blogging.platform/dto/view/newest.likes.row.view.dto';

export class NewestLikesViewDto{
    addedAt: string;
    userId: string;
    login: string


    public static mapToView(likes: NewestLikesRowViewDto){
        const viewDto = new NewestLikesViewDto();
        viewDto.userId = likes.userId.toString();
        viewDto.login = likes.login;
        viewDto.addedAt = likes.addedAt.toISOString();
        return viewDto;
    }
}