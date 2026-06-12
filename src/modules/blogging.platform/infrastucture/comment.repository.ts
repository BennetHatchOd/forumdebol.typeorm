import { Injectable } from '@nestjs/common';
import { Comment } from '../domain/comment.entity';
import { EntityManager } from 'typeorm';
import { isDbId } from '@core/is.db.id';
import { InjectEntityManager } from '@nestjs/typeorm';

@Injectable()
export class CommentRepository {

    constructor(
        @InjectEntityManager() private entityManager: EntityManager,
    ) {}
    

    async getCommentById(id: string): Promise<Comment | null> {

        const idDB = isDbId(id);
        if (!idDB) return null;

        const searchItem: Comment|null = await this.entityManager
            .createQueryBuilder(Comment, 'c')
            .where('c.id = :id', {id: id})
            .getOne();

        return searchItem;
    }

    async existsById(id: string): Promise<boolean> {
        const idDB = isDbId(id);
        if (!idDB) return false;

        const result = await this.entityManager
                .createQueryBuilder(Comment, 'c')
                .where('c.id = :id', {id: id})
                .getCount();

        return result > 0;
    }

    async save(saved: Comment): Promise<void> {
        await this.entityManager.save(saved);
        return;
    }

    async delete(comment: Comment) {
        await this.entityManager.softRemove(comment);
    }
}
