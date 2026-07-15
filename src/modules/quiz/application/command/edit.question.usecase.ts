import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { QuestionInputDto } from '@modules/quiz/dto/input/question.input.dto';
import { QuestionRepository } from '@modules/quiz/infrastucture/question.repository';
import { Question } from '@modules/quiz/domain/question.entity';

export class EditQuestionCommand extends Command<void> {
    constructor(
        public id: string,
        public editData: QuestionInputDto,
    ) {
        super()}
}

@CommandHandler(EditQuestionCommand)
export class EditQuestionHandler implements ICommandHandler<EditQuestionCommand, void> {
    constructor(
        private questionRepository: QuestionRepository,
    ) {}

    async execute({id, editData}: EditQuestionCommand):Promise<void> {

        const question: Question | null = await this.questionRepository.findById(id);

        if (!question)
            throw new DomainException({
                message: 'question with ${id} not found',
                code: DomainExceptionCode.NotFound});

        question.update(editData);
        await this.questionRepository.save(question);
        return;

    }
}
