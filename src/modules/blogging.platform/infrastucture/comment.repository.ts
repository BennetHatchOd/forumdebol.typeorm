import { Inject, Injectable } from '@nestjs/common';
import { Comment } from '../domain/comment.entity';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource } from 'typeorm';
import { isDbId } from '@core/is.db.id';
import { Post } from '@modules/blogging.platform/domain/post.entity';

@Injectable()
export class CommentRepository {

    constructor(
        @Inject(DATA_SOURCE) private dataSource: DataSource,
    ) {}
    

    async getCommentById(id: string): Promise<Comment | null> {
        // We're looking for a clean comment,
        // working with one Comment table in the database.

        const idDB = isDbId(id);
        if (!idDB) return null;

        const searchItem: Comment|null = await this.dataSource.query(`
                    SELECT *
                    FROM public.comments
                    WHERE id = $1 AND "deletedAt" IS NULL 
                    LIMIT 1`,
            [idDB]
        );
        return searchItem;
    }

    async existsById(id: string): Promise<boolean> {
        const idDB = isDbId(id);
        if (!idDB) return false;

        const result = await this.dataSource.query(
            `SELECT EXISTS(
                SELECT 1 
                FROM public.comments 
                WHERE id = $1 AND "deletedAt" IS NULL)`,
            [id],
        );

        return result[0].exists;
    }

    async saveComment(saved: Comment): Promise<void> {

        if(!saved.id){
            const result = await this.dataSource.query(`
                INSERT INTO public.comments(
                    content, "postId", "userId", "deletedAt")
                VALUES($1, $2, $3, $4)
                RETURNING id, "createdAt";`,
                [   saved.content,
                    saved.postId,
                    saved.userId,
                    saved.deletedAt,
                ]);
            saved.id = result[0].id;
            saved.createdAt = result[0].createdAt;
            return;
        }

        await this.dataSource.query(`
        UPDATE public.comments
        SET
            content = $1,
            "deletedAt" = $2
        WHERE id = $3;`,
            [   saved.content,
                saved.deletedAt,
                saved.id
            ]);
        return;
    }

    async delete(foundComment: Comment) {
            // await this.postORMRepo.softRemove(post);
    }
}
