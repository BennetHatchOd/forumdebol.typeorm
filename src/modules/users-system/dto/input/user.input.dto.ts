import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { UserFieldRestrict } from '../../field.restrictions';

export class UserInputDto {
    @IsString()
    @Matches('^[a-zA-Z0-9_-]*$')
    @Length(UserFieldRestrict.loginMin, UserFieldRestrict.loginMax)
    login: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @Length(UserFieldRestrict.passwordMin, UserFieldRestrict.passwordMax)
    password:  string;
}
