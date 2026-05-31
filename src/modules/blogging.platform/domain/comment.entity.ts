import { CreateCommentDto } from '../dto/create/create.comment.dto';
import { RealObjectBaseDBEntity } from '@core/domain/real.object.base.entity';
import { Column, ManyToOne } from 'typeorm';
import { CommentFieldRestrict } from '@modules/blogging.platform/dto/field.restrictions';
import { Post } from '@modules/blogging.platform/domain/post.entity';
import { User } from '@modules/users-system/domain/user.entity';

export class Comment extends RealObjectBaseDBEntity{

    @Column({ type: 'varchar', length: CommentFieldRestrict.contentMax})
    content: string;

    @ManyToOne(() => Post)
    postId: number;

    @ManyToOne(() => User)
    userId: number;

    async update(change: string): Promise<void> {
        this.content = change;
    }

    static create(createDto: CreateCommentDto): Comment {
        const comment = new this();
        comment.content = createDto.content;
        comment.postId = +createDto.postId;
        comment.userId = +createDto.userId;
        return comment;
    }
}
