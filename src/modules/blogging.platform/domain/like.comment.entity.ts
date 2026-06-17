import { LikeCreateDto } from '@modules/blogging.platform/dto/create/like.create.dto';
import { Column, Entity, JoinColumn, ManyToOne, RelationId, Unique } from 'typeorm';
import { Comment } from '@modules/blogging.platform/domain/comment.entity';
import { LikeBase } from '@modules/blogging.platform/domain/like.base';

@Entity()
@Unique(['userId', 'targetId'])
export class LikeComment extends LikeBase {
    @ManyToOne(() => Comment)
    @JoinColumn({ name: 'targetId' })
    target: Comment;

    @Column()
    targetId: number;

    static create(dto: LikeCreateDto): LikeComment {
        const like = super.createBase.call(this,dto);
        like.target = {id: +dto.targetId} as Comment;
        return like;
    }
}