import { IsBoolean, IsDefined } from 'class-validator';

export class PublishQuestionInputDto {
    @IsDefined()
    @IsBoolean()
    published: boolean;
}