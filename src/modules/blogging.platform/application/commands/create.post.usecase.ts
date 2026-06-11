
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '@modules/blogging.platform/infrastucture/post.repository';
import { PostInputDto } from '@modules/blogging.platform/dto/input/post.input.dto';
import { Post } from '@modules/blogging.platform/domain/post.entity';
import { BlogRepository } from '@modules/blogging.platform/infrastucture/blog.repository';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';

export class CreatePostCommand extends Command<string> {
    constructor(
        public inputDto: PostInputDto,
    ) {
        super()}
}

@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<CreatePostCommand, string> {
    constructor(
        private postRepository: PostRepository,
        private blogRepository: BlogRepository,
    ) {}

    async execute({inputDto}: CreatePostCommand):Promise<string> {

        const blogExist: boolean = await this.blogRepository.existsById(inputDto.blogId);
        if (!blogExist)
            throw new DomainException({
                message: 'blog not found',
                code: DomainExceptionCode.NotFound}
            );
        const newPost: Post = Post.create(inputDto);
        await this.postRepository.save(newPost);
        return newPost.id.toString();
    }
}