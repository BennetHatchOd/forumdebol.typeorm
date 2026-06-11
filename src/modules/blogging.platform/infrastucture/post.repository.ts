import { Inject, Injectable } from '@nestjs/common';
import { Post } from '../domain/post.entity';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PostParamsIdInputDto } from '@core/dto/input/post.params.id.input.dto';
import { isDbId } from '@core/is.db.id';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PostRepository {

    constructor(
        @InjectRepository(Post) private postORMRepo: Repository<Post>
    ) {}
    
    async findById(id: string): Promise<Post | null> {
        const idDB = isDbId(id);
        if (!idDB) return null;


        const post: Post|null
            = await this.postORMRepo.findOneBy({id: idDB})

        return post;
    }

    async findByIdBlogId(id: PostParamsIdInputDto ): Promise<Post | null> {
        const idDB = isDbId(id.id);
        if (!idDB) return null;

        const numericBlogId = isDbId(id.blogId);
        if (!numericBlogId) return null;

        const post: Post|null = await this.postORMRepo.findOneBy(
            {id: idDB,
             blog: {
                id: numericBlogId,
                }
            });

        return post;
    }

    async existsById(id: string): Promise<boolean> {
        const idDB = isDbId(id);
        if (!idDB) return false;
        const result = await this.postORMRepo.exists( {where: {id: idDB}});

        return result;
    }

    async save(savedItem: Post): Promise<void> {
        await this.postORMRepo.save(savedItem);
        return ;
    }

    async delete(post: Post) {
        await this.postORMRepo.softRemove(post);
    }
}
