import { TrimLength } from '@core/decorators/trim.string.length';
import { UserFieldRestrict } from '../../field.restrictions';
import { IsUUID } from 'class-validator';

export class NewPasswordInputDto{
    @TrimLength(UserFieldRestrict.passwordMin, UserFieldRestrict.passwordMax)
    newPassword: string;

    @IsUUID(4)
    recoveryCode: string;
}