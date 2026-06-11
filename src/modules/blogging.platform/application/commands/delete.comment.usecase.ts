import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '@modules/blogging.platform/infrastucture/comment.repository';
import { Comment} from '@modules/blogging.platform/domain/comment.entity';
import { ModifyCommentDto } from '@modules/blogging.platform/dto/modify.comment.dto';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';

export class DeleteCommentCommand extends Command<void> {
    constructor(
        public deleteDto: ModifyCommentDto,
    ) {
        super()}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler<DeleteCommentCommand> {
    constructor(
        private commentRepository: CommentRepository,
    ) {
    }

    async execute({ deleteDto }: DeleteCommentCommand): Promise<void> {

        const foundComment: Comment | null = await this.commentRepository.getCommentById(deleteDto.targetId);

        if(!foundComment)
            throw  new DomainException({
                message: 'blog not found',
                code: DomainExceptionCode.NotFound,
            });
        if(foundComment.userId !== +deleteDto.userId)
            throw new DomainException({
                message: "comment is not your own",
                code: DomainExceptionCode.Forbidden,
            });

        this.commentRepository.delete(foundComment);
        return;
    }
}
