import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '@modules/blogging.platform/infrastucture/comment.repository';
import { CreateCommentDto } from '@modules/blogging.platform/dto/create/create.comment.dto';
import { Comment } from '@modules/blogging.platform/domain/comment.entity';
import { PostRepository } from '@modules/blogging.platform/infrastucture/post.repository';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';

export class CreateCommentCommand extends Command<string> {
    constructor(
        public createDto: CreateCommentDto,
    ){ super()}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler implements ICommandHandler<CreateCommentCommand, string> {
    constructor(
        private commentRepository: CommentRepository,
        private postRepository: PostRepository,
    ) {
    }

    async execute({ createDto}: CreateCommentCommand): Promise<string> {

        if(!await this.postRepository.existsById(createDto.postId))
            throw  new DomainException({
                message: 'post not found',
                code: DomainExceptionCode.NotFound,
            });
        const newComment: Comment = Comment.createInstance(createDto);
        await this.commentRepository.saveComment(newComment);
        return newComment.id.toString();
    }
}