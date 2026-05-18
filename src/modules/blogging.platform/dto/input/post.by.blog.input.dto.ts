import { IsString, Length } from 'class-validator';
import { PostFieldRestrict } from '../field.restrictions';
import { TrimLength } from '../../../../core/decorators/trim.string.length';

export class PostByBlogInputDto {
    @TrimLength(PostFieldRestrict.titleMin, PostFieldRestrict.titleMax)
    public title: string;

    @TrimLength(PostFieldRestrict.shortDescriptionMin, PostFieldRestrict.shortDescriptionMax)
    public shortDescription: string;

    @TrimLength(PostFieldRestrict.contentMin, PostFieldRestrict.contentMax)
    public content: string;
}



