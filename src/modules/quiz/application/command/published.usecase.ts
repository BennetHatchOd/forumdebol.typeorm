import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Question } from '@modules/quiz/domain/question.entity';
import { QuestionRepository } from '@modules/quiz/infrastucture/question.repository';
import { PublishQuestionInputDto } from '@modules/quiz/dto/input/publish.question.input.dto';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';

export class PublishedCommand extends Command<void> {
    constructor(
        public id: string,
        public inputDto: PublishQuestionInputDto,
    ) {
        super()}
}

@CommandHandler(PublishedCommand)
export class PublishedHandler implements ICommandHandler<PublishedCommand, void> {
    constructor(
        private questionRepository: QuestionRepository,
    ) {}

    async execute({id, inputDto}: PublishedCommand):Promise<void> {
        const question: Question|null = await this.questionRepository.findById(id);

        if(!question)
            throw new DomainException({
            message: 'question with id-${id} not found',
            code: DomainExceptionCode.NotFound});

        question.publish(inputDto.published);
        question.updatedAt = new Date();
        await this.questionRepository.save(question);
        return;
    }
}