import { CreateCodeDto } from '@modules/users-system/dto/create/create.code.dto';

export class ConfirmEmail {
    id: number;
    code: string;
    expirationTime: Date;
    userId: number;


    static createInstance(dto: CreateCodeDto): ConfirmEmail {
        const codeTuple = new this();
        codeTuple.code = dto.code;
        codeTuple.expirationTime = dto.expirationTime;
        codeTuple.userId = dto.userId;

        return codeTuple;
    }
}