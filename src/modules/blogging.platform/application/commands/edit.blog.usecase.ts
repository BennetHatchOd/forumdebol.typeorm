import { BlogInputDto } from '@modules/blogging.platform/dto/input/blog.input.dto';
import { BlogRepository } from '@modules/blogging.platform/infrastucture/blog.repository';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Blog } from '@modules/blogging.platform/domain/blog.entity';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';

export class EditBlogCommand extends Command<void> {
    constructor(
        public id: string,
        public editData: BlogInputDto,
    ) {
        super()}
}

@CommandHandler(EditBlogCommand)
export class EditBlogHandler implements ICommandHandler<EditBlogCommand, void> {
    constructor(
        private blogRepository: BlogRepository,
    ) {}

    async execute({id, editData}: EditBlogCommand):Promise<void> {

        const blog: Blog | null = await this.blogRepository.findById(id);

        if (!blog)
            throw new DomainException({
                message: 'blog with ${id} not found',
                code: DomainExceptionCode.NotFound});
        blog.update(editData);
        this.blogRepository.save(blog);
        return;

    }
}
