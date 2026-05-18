import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { PostInputDto } from '../dto/input/post.input.dto';
import { PostFieldRestrict } from '../dto/field.restrictions';
import { PostByBlogInputDto } from '@modules/blogging.platform/dto/input/post.by.blog.input.dto';


export class Post {
    id: number;
    title: string;
    shortDescription: string;
    content: string;
    blogId: number;
    createdAt: Date;
    deletedAt:  Date | null;

    delete() {
        if (this.deletedAt !== null) {
            throw new Error('Post already deleted');
        }
        this.deletedAt = new Date();
    }

    async update(change: PostByBlogInputDto) {
        this.title = change.title;
        this.shortDescription = change.shortDescription;
        this.content = change.content;
    }

    static createInstance(createDto: PostInputDto): Post {
        const post = new this();
        post.title = createDto.title;
        post.shortDescription = createDto.shortDescription;
        post.content = createDto.content;
        post.blogId = +createDto.blogId;

        return post;
    }

    static copyInstance(dto: Post): Post {
        const post = new this();

        post.id = dto.id;
        post.content = dto.content;
        post.title = dto.title;
        post.shortDescription = dto.shortDescription;
        post.blogId = dto.blogId;
        post.createdAt = dto.createdAt;
        post.deletedAt = dto.deletedAt;

        return post;
    }
}
