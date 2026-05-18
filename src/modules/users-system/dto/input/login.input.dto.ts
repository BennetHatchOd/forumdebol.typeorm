import { IsString, Length } from 'class-validator';
import { UserFieldRestrict } from '../../field.restrictions';

export class LoginInputDto {
    loginOrEmail: string;

    @IsString()
    @Length(UserFieldRestrict.passwordMax, UserFieldRestrict.passwordMax)
    password:  string;
}
