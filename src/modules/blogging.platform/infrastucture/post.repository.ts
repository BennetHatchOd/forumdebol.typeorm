import { Inject, Injectable } from '@nestjs/common';
import { Post } from '../domain/post.entity';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource } from 'typeorm';
import { PostParamsIdInputDto } from '@core/dto/input/post.params.id.input.dto';
import { isDbId } from '@core/is.db.id';

@Injectable()
export class PostRepository {

    constructor(
        @Inject(DATA_SOURCE) private dataSource: DataSource
    ) {}
    
    async findById(id: string): Promise<Post | null> {
        const idDB = isDbId(id);
        if (!idDB) return null;

        const searchItem: Post[] = await this.dataSource.query(`
                    SELECT *
                    FROM public.post
                    WHERE id = $1 AND "deletedAt" IS NULL 
                    LIMIT 1`,
            [idDB]
        );
        if (searchItem.length == 0)
            return null;

        const post: Post = Post.copyInstance(searchItem[0]);

        return post;
    }

    async findByIdBlogId(id: PostParamsIdInputDto ): Promise<Post | null> {
        const idDB = isDbId(id);
        if (!idDB) return null;

        const numericBlogId = isDbId(id.blogId);
        if (!numericBlogId) return null;

        const searchItem: Post[] = await this.dataSource.query(`
                    SELECT *
                    FROM public.post
                    WHERE id = $1 AND "blogId" = $2 AND "deletedAt" IS NULL 
                    LIMIT 1`,
            [idDB, numericBlogId]
        );
        if (searchItem.length == 0)
            return null;

        const post: Post = Post.copyInstance(searchItem[0]);

        return post;
    }

    async existsById(id: string): Promise<boolean> {
        const idDB = isDbId(id);
        if (!idDB) return false;
        const result = await this.dataSource.query(
            `SELECT EXISTS(
                SELECT 1 
                FROM public.post 
                WHERE id = $1 AND "deletedAt" IS NULL)`,
            [id],
        );

        return result[0].exists;
    }

    async savePost(savedItem: Post): Promise<void> {

        if(!savedItem.id){
            const result = await this.dataSource.query(`
                INSERT INTO public.post(
                    title, "shortDescription", content, "blogId", "deletedAt")
                VALUES($1, $2, $3, $4, $5)
                RETURNING id, "createdAt";`,
                [   savedItem.title,
                    savedItem.shortDescription,
                    savedItem.content,
                    savedItem.blogId,
                    savedItem.deletedAt,
                ])
            savedItem.id = result[0].id;
            savedItem.createdAt = result[0].createdAt;
            return
        }

        await this.dataSource.query(`UPDATE public.post
        SET
            title = $1,
            content = $2, 
            "shortDescription" = $3, 
            "deletedAt" = $4
        WHERE id = $5;`,
            [   savedItem.title,
                savedItem.content,
                savedItem.shortDescription,
                savedItem.deletedAt,
                savedItem.id
            ]);
        return ;
    }

}
