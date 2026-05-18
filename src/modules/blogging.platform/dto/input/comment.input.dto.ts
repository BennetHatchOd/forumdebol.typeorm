import { CommentFieldRestrict } from '../field.restrictions';
import { TrimLength } from '@core/decorators/trim.string.length';

export class CommentInputDto {
    @TrimLength(CommentFieldRestrict.contentMin, CommentFieldRestrict.contentMax)
    public content: string;
}