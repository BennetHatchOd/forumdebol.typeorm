import { IsString } from 'class-validator';

export class PostParamsIdInputDto {
    @IsString()
    blogId: string;

    @IsString()
    id: string;
}