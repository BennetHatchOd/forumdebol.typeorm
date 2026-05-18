export class CreateCodeDto {
    userId: number;
    code: string;
    expirationTime: Date;

    constructor(userId: number, code: string, expirationTime: Date) {
        this.userId = userId;
        this.code = code;
        this.expirationTime = expirationTime;
    }
}