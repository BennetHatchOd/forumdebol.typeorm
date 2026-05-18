import { CreateCommentDto } from '../dto/create/create.comment.dto';

export class Comment {
    id: number;
    content: string;
    postId: number;
    userId: number;
    createdAt: Date;
    deletedAt:  Date | null;

    delete() {
        if (this.deletedAt !== null) {
            throw new Error('Comment already deleted');
        }
        this.deletedAt = new Date();
    }

    async update(change: string): Promise<void> {
        this.content = change;
    }

    static createInstance(createDto: CreateCommentDto): Comment {
        const comment = new this();
        comment.content = createDto.content;
        comment.postId = +createDto.postId;
        comment.userId = +createDto.userId;
        return comment;
    }

    static copyInstance(dto: Comment): Comment {
        const comment = new this();
        comment.id = dto.id;
        comment.content = dto.content;
        comment.postId = dto.postId;
        comment.userId = dto.userId;
        comment.createdAt = dto.createdAt;
        comment.deletedAt = dto.deletedAt;
        return comment;
    }
}
