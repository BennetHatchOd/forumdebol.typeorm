import { Injectable } from '@nestjs/common';
import { Blog } from '../domain/blog.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isDbId } from '@core/is.db.id';

@Injectable()
export class BlogRepository {

    constructor(
        @InjectRepository(Blog) private blogORMRepo: Repository<Blog>,) {}
    
    async findById(id: string): Promise<Blog | null> {
        const idDB = isDbId(id);
        if (!idDB) return null;

        const blog: Blog | null = await this.blogORMRepo.findOneBy({id:idDB});

        return blog;
    }

    async existsById(id: string): Promise<boolean> {
        const idDB = isDbId(id);
        if (!idDB) return false;

        const result = await this.blogORMRepo.existsBy({id:idDB});

        return result;
    }

    async save(savedItem: Blog): Promise<void> {

        await this.blogORMRepo.save(savedItem);

        return ;
    }

    async delete(blog: Blog): Promise<void> {
        await this.blogORMRepo.softRemove(blog);
        return ;
    }
}
