import { UserInputDto } from '@modules/users-system/dto/input/user.input.dto';
import { RealObjectBaseDBEntity } from '@core/domain/real.object.base';
import { Column, Entity } from 'typeorm';
import { UserFieldRestrict } from '@modules/users-system/field.restrictions';

@Entity()
export class User extends RealObjectBaseDBEntity{
    @Column({ type: 'varchar', length: UserFieldRestrict.loginMax,
        unique: true, })
    login: string;

    @Column({ type: 'varchar', unique: true, })
    email: string;

    @Column({ type: 'varchar' })
    passwordHash: string;

    @Column({ type: 'boolean', default: 'true' })
    isConfirmEmail: boolean;

    static create(dto: UserInputDto, isConfirmEmail: boolean): User {
        const user = new this();
        user.login = dto.login;
        user.email = dto.email;
        user.passwordHash = dto.password;
        user.isConfirmEmail = isConfirmEmail;

        return user;
    }

}