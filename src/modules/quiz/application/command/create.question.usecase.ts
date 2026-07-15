import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Question } from '@modules/quiz/domain/question.entity';
import { QuestionInputDto } from '@modules/quiz/dto/input/question.input.dto';
import { QuestionRepository } from '@modules/quiz/infrastucture/question.repository';

export class CreateQuestionCommand extends Command<string> {
    constructor(
        public inputDto: QuestionInputDto,
    ) {
        super()}
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionHandler implements ICommandHandler<CreateQuestionCommand, string> {
    constructor(
        private questionRepository: QuestionRepository,
    ) {}

    async execute({inputDto}: CreateQuestionCommand):Promise<string> {
        const question: Question = Question.create(inputDto);
        await this.questionRepository.save(question);
        return question.id.toString();
    }
}

