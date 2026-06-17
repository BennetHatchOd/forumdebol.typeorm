import { LikeCreateDto } from '@modules/blogging.platform/dto/create/like.create.dto';
import { LikeBase } from '@modules/blogging.platform/domain/like.base';
import { Post } from '@modules/blogging.platform/domain/post.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

@Entity()
@Unique(['userId', 'targetId'])
export class LikePost extends LikeBase {

    @ManyToOne(() => Post)
    @JoinColumn({ name: 'targetId' })
    target: Post;

    @Column()
    targetId: number;

    static create(dto: LikeCreateDto): LikePost {
        const like = super.createBase.call(this,dto);
        like.target = {id: +dto.targetId} as Post;
        return like;
    }
}