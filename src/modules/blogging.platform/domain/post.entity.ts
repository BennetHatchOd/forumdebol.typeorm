import { PostInputDto } from '../dto/input/post.input.dto';
import { PostFieldRestrict } from '../dto/field.restrictions';
import { PostByBlogInputDto } from '@modules/blogging.platform/dto/input/post.by.blog.input.dto';
import { RealObjectBaseDBEntity } from '@core/domain/real.object.base';
import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { Blog } from '@modules/blogging.platform/domain/blog.entity';

@Entity()
export class Post extends RealObjectBaseDBEntity{
    @Column({ type: 'varchar', length: PostFieldRestrict.titleMax})
    title: string;

    @Column({ type: 'varchar', length: PostFieldRestrict.shortDescriptionMax})
    shortDescription: string;

    @Column({ type: 'varchar', length: PostFieldRestrict.contentMax})
    content: string;

    @ManyToOne(() => Blog)
    blog: Blog;

    @RelationId((p: Post)=>p.blog)
    blogId: number;

    async update(change: PostByBlogInputDto) {
        this.title = change.title;
        this.shortDescription = change.shortDescription;
        this.content = change.content;
    }

    static create(createDto: PostInputDto): Post {
        const post = new this();
        post.title = createDto.title;
        post.shortDescription = createDto.shortDescription;
        post.content = createDto.content;
        post.blog = {id:+createDto.blogId} as Blog;

        return post;
    }
}
