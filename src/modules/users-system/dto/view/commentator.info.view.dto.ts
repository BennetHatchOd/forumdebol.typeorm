import { User } from '@modules/users-system/domain/user.entity';

export class CommentatorInfoViewDto {
    userId:          string;
    login:           string;

    constructor(user: User) {
        this.userId = user.id.toString();
        this.login = user.login;
    }

    static   mapToView(inputUser: User): CommentatorInfoViewDto {
        return  new CommentatorInfoViewDto(inputUser);
    }
}

