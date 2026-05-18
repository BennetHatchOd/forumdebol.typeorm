import {v4 as uuidv4} from 'uuid'
import { add } from 'date-fns';

export class NewPassword {
    userId: string;
    code: string;
    expirationTime: Date;

    static createInstance(userId: string, timeLifeCode: number): NewPassword {
        const newPassword = new this();
        newPassword.userId = userId;
        newPassword.code = uuidv4();
        newPassword.expirationTime = add(new Date(), { hours: timeLifeCode});

        return newPassword;
    }
}