import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GameRepository } from '@modules/quiz/infrastucture/game.repository';
import { QuestionRepository } from '@modules/quiz/infrastucture/question.repository';
import { Game } from '@modules/quiz/domain/game.entity';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { AnswerInputDto } from '@modules/quiz/dto/input/answer.input.dto';
import { UserConfig } from '@modules/users-system/config/user.config';
import { AnsweredQuestion } from '@modules/quiz/domain/answered.question.entity';
import { User } from '@modules/users-system/domain/user.entity';
import { StatusGame } from '@modules/quiz/dto/type/status.game.enum';
import console from 'node:console';

export class CheckAnswerCommand extends Command<string> {
    constructor(
        public userId: string,
        public inputDto: AnswerInputDto,
    ) {
        super();
    }
}

@CommandHandler(CheckAnswerCommand)
export class CheckAnswerHandler implements ICommandHandler<
    CheckAnswerCommand>
{
    constructor(
        private quizRepository: GameRepository,
        private readonly userConfig: UserConfig,
    ) {}

    async execute({ userId, inputDto }: CheckAnswerCommand): Promise<string> {
        // check active game of user
        const activeGame: Game | null =
            await this.quizRepository.findActive(userId);
        if (!activeGame){
            throw new DomainException({
                message: "current user isn't participating in active pair",
                code: DomainExceptionCode.Forbidden,
            });
        }
        activeGame.roundQuestion.sort((a,b) => a.id - b.id);
        // check not answered question
        const indexPlayer = activeGame.playingUsers.findIndex(
            (player) => player.user.id == +userId,
        );
        const numberQuesion =
            activeGame.playingUsers[indexPlayer].numberQuestion;
        if (numberQuesion >= this.userConfig.quizQuestion)
            throw new DomainException({
                message:
                    'user is in active pair but has already answered to all questions',
                code: DomainExceptionCode.Forbidden,
            });
        // check correct answer
        const isCorrect = activeGame.roundQuestion[numberQuesion]
            .question.correctAnswers.includes(inputDto.answer);

        // write answer to AnsweredQuestion
        const answeredQuestion = new AnsweredQuestion();
        answeredQuestion.game = activeGame;
        answeredQuestion.user = { id: +userId } as User;
        answeredQuestion.question =
            activeGame.roundQuestion[numberQuesion].question;
        answeredQuestion.answer = inputDto.answer;
        answeredQuestion.isCorrect = isCorrect;
        activeGame.answeredQuestion.push(answeredQuestion);

        // game scoring
        activeGame.playingUsers[indexPlayer].numberQuestion++;
        if (isCorrect) activeGame.playingUsers[indexPlayer].score++;

        if (
            activeGame.playingUsers[indexPlayer].numberQuestion
            < this.userConfig.quizQuestion)
        {
            await this.quizRepository.save(activeGame);
            return activeGame.answeredQuestion.at(-1)!.id.toString();
        }

        if (
            activeGame.playingUsers[1 - indexPlayer].numberQuestion >=
                this.userConfig.quizQuestion)
        {
            activeGame.status = StatusGame.Finished;
            activeGame.finishAt = new Date();
            // add final score
            if(activeGame.playingUsers[1 - indexPlayer].score > 0)
                activeGame.playingUsers[1 - indexPlayer].score++;
        }

        await this.quizRepository.save(activeGame);
        return activeGame.answeredQuestion.at(-1)!.id.toString();

    }
}