import { IsEmail, IsUUID } from 'class-validator';

export class ConfirmCodeInputDto{
    @IsUUID(4)
    code: string;
}