import { User } from '../../domain/user.entity';

export class UserAboutViewDto {
        userId:              string;
        login:           string;
        email:           string;
    constructor(user: User) {
        this.userId = user.id.toString();
        this.login = user.login;
        this.email = user.email;
    }

    static   mapToView(inputUser: User): UserAboutViewDto {
        return  new UserAboutViewDto(inputUser);
    }
}
