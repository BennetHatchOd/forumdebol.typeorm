
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '@modules/blogging.platform/infrastucture/post.repository';
import { PostParamsIdInputDto } from '@core/dto/input/post.params.id.input.dto';
import { PostByBlogInputDto } from '@modules/blogging.platform/dto/input/post.by.blog.input.dto';
import { Post } from '@modules/blogging.platform/domain/post.entity';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { BlogQueryRepository } from '@modules/blogging.platform/infrastucture/query/blog.query.repository';
import { BlogRepository } from '@modules/blogging.platform/infrastucture/blog.repository';

export class EditPostCommand extends Command<void> {
    constructor(
        public inputDto: PostParamsIdInputDto,
        public editData: PostByBlogInputDto
    ) {
        super()}
}

@CommandHandler(EditPostCommand)
export class EditPostHandler implements ICommandHandler<EditPostCommand, void> {
    constructor(
        private postRepository: PostRepository,
    ) {}

    async execute({inputDto, editData}: EditPostCommand):Promise<void> {

        const post: Post | null = await this.postRepository.findByIdBlogId(inputDto);

        if(!post)
            throw new DomainException({
                message: 'post with ${inputDto.id} by blog with ${inputDto.blogId} not found',
                code: DomainExceptionCode.NotFound});

        post.update(editData);
        await this.postRepository.save(post);
        return;

    }
}