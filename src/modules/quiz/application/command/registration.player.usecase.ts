import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Question } from '@modules/quiz/domain/question.entity';
import { QuestionRepository } from '@modules/quiz/infrastucture/question.repository';
import { GameRepository } from '@modules/quiz/infrastucture/game.repository';
import { Game } from '@modules/quiz/domain/game.entity';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { PlayingUser } from '@modules/quiz/domain/playing.user.entity';
import { StatusGame } from '@modules/quiz/dto/type/status.game.enum';

export class RegistrationPlayerCommand extends Command<string> {
    constructor(public user: string) {
        super();
    }
}

@CommandHandler(RegistrationPlayerCommand)
export class RegistrationPlayerHandler implements ICommandHandler<
    RegistrationPlayerCommand,
    string
> {
    constructor(
        private quizRepository: GameRepository,
        private questionRepository: QuestionRepository,
    ) {}

    async execute({ user }: RegistrationPlayerCommand): Promise<string> {
        const activeGame: Game | null =
            await this.quizRepository.findActive(user);
        if (activeGame)
            throw new DomainException({
                message:
                    ' current user is already participating in active pair',
                code: DomainExceptionCode.Forbidden,
            });

        const pendingGame: Game | null =
            await this.quizRepository.findPending();
        if (pendingGame) {
            if (pendingGame.playingUsers[0].user.id == +user)
                throw new DomainException({
                    message: ' current user is already pending second player',
                    code: DomainExceptionCode.Forbidden,
                });

            const newPlayer: PlayingUser = PlayingUser.create(
                +user,
                pendingGame,
            );
            pendingGame.playingUsers.push(newPlayer);
            pendingGame.status = StatusGame.Active;
            await this.quizRepository.save(pendingGame);
            return pendingGame.id.toString();
        }

        const questions: Question[] | null =
            await this.questionRepository.getQuestionForRound();
        if (!questions)
            throw new DomainException({
                message: ' not enought questions for quize',
                code: DomainExceptionCode.InternalServerError,
            });
        const newGame = Game.create(questions, user);
        await this.quizRepository.save(newGame);
        return newGame.id.toString();
    }
}
