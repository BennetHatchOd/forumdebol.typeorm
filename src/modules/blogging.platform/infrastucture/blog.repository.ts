import { Inject, Injectable } from '@nestjs/common';
import { Blog } from '../domain/blog.entity';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogRepository {

    constructor(@Inject(DATA_SOURCE) private dataSource: DataSource) {}
    
    async findById(id: string): Promise<Blog | null> {
        const numericId = Number(id);
        if (!Number.isInteger(numericId) || numericId < 1) return null;

        const searchItem: Blog[] = await this.dataSource.query(`
            SELECT * 
            FROM public.blog
            WHERE id = $1 AND "deletedAt" IS NULL
            LIMIT 1`,
            [numericId]
        );
        if (searchItem.length == 0)
            return null;

        const blog = Blog.copyInstance(searchItem[0]);

        return blog;
    }

    async existsById(id: string): Promise<boolean> {
        const numericId = Number(id);
        if (!Number.isInteger(numericId) || numericId < 1)
            return false;
        const result = await this.dataSource.query(
            `SELECT EXISTS(
                SELECT 1 
                FROM public.blog 
                WHERE id = $1 AND "deletedAt" IS NULL)`,
            [id],
        );

        return result[0].exists;
    }

    async saveBlog(savedItem: Blog): Promise<void> {

        if(!savedItem.id){
            const result = await this.dataSource.query(`
                INSERT INTO public.blog(
                    name, description, "websiteUrl", "isMembership", "deletedAt")
                VALUES($1, $2, $3, $4, $5)
                RETURNING id, "createdAt";`,
            [   savedItem.name,
                savedItem.description,
                savedItem.websiteUrl,
                savedItem.isMembership,
                savedItem.deletedAt,
            ])
            savedItem.id = result[0].id;
            savedItem.createdAt = result[0].createdAt;
            return
        }

        await this.dataSource.query(`UPDATE public.blog
        SET 
        name = $1, 
        description = $2, 
        "websiteUrl" = $3, 
        "isMembership" = $4, 
        "deletedAt" = $5
        WHERE id = $6;`,
            [   savedItem.name,
            savedItem.description,
            savedItem.websiteUrl,
            savedItem.isMembership,
            savedItem.deletedAt,
            savedItem.id
            ]);
        return ;
    }

}
