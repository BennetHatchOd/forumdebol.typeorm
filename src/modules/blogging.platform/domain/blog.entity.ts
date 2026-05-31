import { BlogInputDto } from '@modules/blogging.platform/dto/input/blog.input.dto';
import { RealObjectBaseDBEntity } from '@core/domain/real.object.base.entity';
import { Column } from 'typeorm';
import { BlogFieldRestrict } from '@modules/blogging.platform/dto/field.restrictions';

export class Blog extends RealObjectBaseDBEntity{
    @Column({ type: 'varchar', length: BlogFieldRestrict.nameMax})
    name: string;

    @Column({ type: 'varchar', length: BlogFieldRestrict.descriptionMax})
    description: string;

    @Column({ type: 'varchar', length: BlogFieldRestrict.websiteUrlMax})
    websiteUrl: string;

    @Column({ type: 'boolean', default: 'true' })
    isMembership: boolean;

    update(change: BlogInputDto) {
        this.name = change.name;
        this.description = change.description;
        this.websiteUrl = change.websiteUrl;
    }

    static create(dto: BlogInputDto): Blog {
        const blog = new this();
        blog.name = dto.name;
        blog.description = dto.description;
        blog.websiteUrl = dto.websiteUrl;

        return blog;
      }
}
