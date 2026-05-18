import { User } from '@modules/users-system/domain/user.entity';


export class UserWithTime {
    constructor(
        public userId: number,
        public login: string,
        public email: string,
        public passwordHash: string,
        public isConfirmEmail: boolean,
        public deletedAt: Date,
        public expirationTime: Date,
    ) {}

    static mapToUser(data: UserWithTime): User {
        const user = new User();
        user.id = data.userId;
        user.login = data.login;
        user.email = data.email;
        user.isConfirmEmail = data.isConfirmEmail;
        user.deletedAt = data.deletedAt;
        user.passwordHash = data.passwordHash;
        return user;
    }
}