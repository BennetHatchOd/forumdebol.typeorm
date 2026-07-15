import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { QuestionRepository } from '@modules/quiz/infrastucture/question.repository';
import { Question } from '@modules/quiz/domain/question.entity';

export class DeleteQuestionCommand extends Command<void> {
    constructor(
        public id: string,
    ) {
        super()}
}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionHandler implements ICommandHandler<DeleteQuestionCommand, void> {
    constructor(
        private questionRepository: QuestionRepository,
    ) {}

    async execute({id}: DeleteQuestionCommand):Promise<void> {

        const question: Question | null = await this.questionRepository.findById(id);

        if (!question)
            throw new DomainException({
                message: 'question with id-${id} not found',
                code: DomainExceptionCode.NotFound});

        await this.questionRepository.delete(question);
        return;
    }
}