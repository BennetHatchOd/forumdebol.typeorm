import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { CodeBaseDBEntity } from '@core/entity/code.base.entity';

export class ConfirmEmail {
    id: number;
    code: string;
    expirationTime: Date;
    userId: number;

    static createInstance(userId: number, timeLifeCode: number): ConfirmEmail {
        const confirmEmail = new this();
        confirmEmail.userId = userId;
        confirmEmail.code = uuidv4();
        confirmEmail.expirationTime = add(new Date(), { hours: timeLifeCode});

        return confirmEmail;
    }
}