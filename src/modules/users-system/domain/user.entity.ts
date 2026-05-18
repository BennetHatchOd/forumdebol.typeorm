import { UserInputDto } from '@modules/users-system/dto/input/user.input.dto';

export class User {
    id!: number;
    login: string;
    email: string;
    passwordHash: string;
    isConfirmEmail: boolean;
    createdAt: Date;
    deletedAt: Date | null;

    delete() {
        if (this.deletedAt !== null) {
            throw new Error('User already deleted');
        }
        this.deletedAt = new Date();
    }

    static createInstance(dto: UserInputDto, isConfirmEmail: boolean): User {
        const user = new this();
        user.login = dto.login;
        user.email = dto.email;
        user.passwordHash = dto.password;
        user.isConfirmEmail = isConfirmEmail;
        user.deletedAt = null;
       // user.createdAt = new Date();

        return user;
    }

    static copyInstance(dto: User): User {
        const user = new this();
       
        user.id = dto.id;
        user.login = dto.login;
        user.email = dto.email;
        user.passwordHash = dto.passwordHash;
        user.isConfirmEmail = dto.isConfirmEmail;
        user.createdAt = dto.createdAt;
        user.deletedAt = dto.deletedAt;

        return user;
    }
}