import { BlogRepository } from '@modules/blogging.platform/infrastucture/blog.repository';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Blog } from '@modules/blogging.platform/domain/blog.entity';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';

export class DeleteBlogCommand extends Command<void> {
    constructor(
        public id: string,
    ) {
        super()}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogHandler implements ICommandHandler<DeleteBlogCommand, void> {
    constructor(
        private blogRepository: BlogRepository,
    ) {}

    async execute({id}: DeleteBlogCommand):Promise<void> {

        const blog: Blog | null = await this.blogRepository.findById(id);

        if (!blog)
            throw new DomainException({
                message: 'blog with id-${id} not found',
                code: DomainExceptionCode.NotFound});
        blog.delete();
        this.blogRepository.saveBlog(blog);
        return;
    }
}