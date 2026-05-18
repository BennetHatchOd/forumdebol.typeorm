import { Blog } from '../../domain/blog.entity';

export class BlogViewDto {
        id:              string;
        name:            string;
        description:     string;
        createdAt:       string;
        isMembership:    boolean;
        websiteUrl:      string;

        constructor() {}

    public static   mapToView(item: Blog): BlogViewDto {
        const view = new BlogViewDto();

        view.id = item.id.toString();
        view.name = item.name;
        view.description = item.description;
        view.createdAt = item.createdAt.toISOString();
        view.isMembership = item.isMembership;
        view.websiteUrl = item.websiteUrl;
        return  view;
    }
}
