import { BlogInputDto } from '@modules/blogging.platform/dto/input/blog.input.dto';
import { BlogRepository } from '@modules/blogging.platform/infrastucture/blog.repository';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Blog } from '@modules/blogging.platform/domain/blog.entity';

export class CreateBlogCommand extends Command<string> {
    constructor(
        public inputDto: BlogInputDto,
    ) {
        super()}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogHandler implements ICommandHandler<CreateBlogCommand, string> {
    constructor(
        private blogRepository: BlogRepository,
    ) {}

    async execute({inputDto}: CreateBlogCommand):Promise<string> {
        const blog: Blog = Blog.create(inputDto);
        await this.blogRepository.saveBlog(blog);
        return blog.id.toString();

    }
}

