import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeCreateDto } from '@modules/blogging.platform/dto/create/like.create.dto';
import { LikeRepository } from '@modules/blogging.platform/infrastucture/like.repository';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { PostRepository } from '@modules/blogging.platform/infrastucture/post.repository';
import { CommentRepository } from '@modules/blogging.platform/infrastucture/comment.repository';
import { LikeComment } from '@modules/blogging.platform/domain/like.comment.entity';
import { LikeBase } from '@modules/blogging.platform/domain/like.base';
import { LikeFactory } from '@modules/blogging.platform/domain/like.factory';

export class MakeLikeCommand extends Command<void> {
    constructor(public likeDto: LikeCreateDto) {
        super();
    }
}

@CommandHandler(MakeLikeCommand)
export class MakeLikeHandler implements ICommandHandler<MakeLikeCommand> {
    constructor(
        private likeRepository: LikeRepository,
        private postRepository: PostRepository,
        private commentRepository: CommentRepository,
    ) {}

    async execute({ likeDto }: MakeLikeCommand): Promise<void> {

        if(likeDto.targetType == 'post'){
            const post = await this.postRepository.existsById(likeDto.targetId)
            if(!post)
                throw  new DomainException({
                    message: 'post not found',
                    code: DomainExceptionCode.NotFound,
                });}
        else {
            const comment = await this.commentRepository.existsById(likeDto.targetId)
            if(!comment)
                throw  new DomainException({
                    message: 'comment not found',
                    code: DomainExceptionCode.NotFound,
                });
        }

        let newLike: LikeBase | null =
            await this.likeRepository.findLike(likeDto);

        if (!newLike)
            newLike = LikeFactory.create(likeDto);
        else if (newLike.status !== likeDto.status) newLike.status = likeDto.status;
        else return;

        await this.likeRepository.save(newLike);
        return;
    }
}
