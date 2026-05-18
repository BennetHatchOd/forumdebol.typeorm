import { BlogInputDto } from '@modules/blogging.platform/dto/input/blog.input.dto';

export class Blog {
    id!: number ;
    name: string;
    description: string;
    websiteUrl: string;
    isMembership: boolean;
    createdAt: Date;
    deletedAt:  Date | null;

    delete() {
        if (this.deletedAt !== null) {
            throw new Error('Blog already deleted');
        }
        this.deletedAt = new Date();
    }

    update(change: BlogInputDto) {
        this.name = change.name;
        this.description = change.description;
        this.websiteUrl = change.websiteUrl;
    }

    static createInstance(dto: BlogInputDto): Blog {
        const blog = new this();
        blog.name = dto.name;
        blog.description = dto.description;
        blog.websiteUrl = dto.websiteUrl;
        blog.isMembership = false;
        blog.createdAt = new Date();
        blog.deletedAt = null;

        return blog;
      }

    static copyInstance(dto: Blog): Blog {
        const blog = new this();

        blog.id = dto.id;
        blog.description = dto.description;
        blog.websiteUrl = dto.websiteUrl;
        blog.isMembership = dto.isMembership;
        blog.name = dto.name;
        blog.createdAt = dto.createdAt;
        blog.deletedAt = dto.deletedAt;

        return blog;
    }
}
