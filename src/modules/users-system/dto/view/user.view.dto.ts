import { User } from '../../domain/user.entity';

export class UserViewDto {
        id:              string;
        login:           string;
        email:           string;
        createdAt:       string;
    constructor(user: User) {
        this.id = user.id.toString();
        this.login = user.login;
        this.email = user.email;
        this.createdAt = user.createdAt.toISOString();
    }

    static   mapToView(inputUser: User): UserViewDto {
        return  new UserViewDto(inputUser);
    }
}
