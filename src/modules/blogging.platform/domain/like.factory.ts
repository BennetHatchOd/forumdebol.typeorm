import { LikeComment } from '@modules/blogging.platform/domain/like.comment.entity';
import { LikePost } from '@modules/blogging.platform/domain/like.post.entity';
import { LikeCreateDto } from '@modules/blogging.platform/dto/create/like.create.dto';
import { LikeBase } from '@modules/blogging.platform/domain/like.base';

export class LikeFactory {
    static create(dto: LikeCreateDto): LikeBase {
        switch (dto.targetType) {
            case 'post':
                return LikePost.create(dto);
            case 'comment':
                return LikeComment.create(dto);
            default:
                throw new Error('Unsupported targetType');
        }
    }
}