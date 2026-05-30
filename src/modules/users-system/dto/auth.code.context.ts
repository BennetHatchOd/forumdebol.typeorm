import { User } from '@modules/users-system/domain/user.entity';


export class AuthCodeContext {
    constructor(
        public user: User,
        public expirationTime: Date,
    ) {}
}