import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '@modules/blogging.platform/infrastucture/post.repository';
import { PostParamsIdInputDto } from '@core/dto/input/post.params.id.input.dto';
import { Post } from '@modules/blogging.platform/domain/post.entity';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';

export class DeletePostCommand extends Command<void> {
    constructor(
        public inputDto: PostParamsIdInputDto,
    ) {
        super()}
}

@CommandHandler(DeletePostCommand)
export class DeletePostHandler implements ICommandHandler<DeletePostCommand, void> {
    constructor(
        private postRepository: PostRepository,
    ) {}

    async execute({inputDto}: DeletePostCommand):Promise<void> {


        const post: Post | null = await this.postRepository.findByIdBlogId(inputDto);

        if(!post)
            throw new DomainException({
                message: 'post with ${inputDto.id} by blog with ${inputDto.blogId} not found',
                code: DomainExceptionCode.NotFound});

        this.postRepository.delete(post);
        return;

    }
}