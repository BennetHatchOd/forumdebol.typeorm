import { IsUrl } from 'class-validator';
import { BlogFieldRestrict } from '../field.restrictions';
import { TrimLength } from '../../../../core/decorators/trim.string.length';

export class BlogInputDto {
    @TrimLength(BlogFieldRestrict.nameMin, BlogFieldRestrict.nameMax)
    public name:        string;

    @TrimLength(BlogFieldRestrict.descriptionMin, BlogFieldRestrict.descriptionMax)
    public description: string;

    @IsUrl()
    @TrimLength(BlogFieldRestrict.websiteUrlMin, BlogFieldRestrict.websiteUrlMax)
    public websiteUrl:  string;
}