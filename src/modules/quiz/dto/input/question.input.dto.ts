import { TrimLength } from '@core/decorators/trim.string.length';
import { QuestionFieldRestrict } from '@modules/quiz/dto/field.restrictions';
import { IsArray, IsString, MaxLength } from 'class-validator';

export class QuestionInputDto {

    @TrimLength(QuestionFieldRestrict.bodyMin, QuestionFieldRestrict.bodyMax)
    body: string;

    @IsArray()
    //@ArrayMinSize(1)
    @IsString({ each: true })
    @MaxLength(QuestionFieldRestrict.oneAnswerMax, { each: true })
    correctAnswers: string[];
}