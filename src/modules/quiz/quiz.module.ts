import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandHandlers } from '@modules/quiz/application/command';
import { QueryHandlers } from '@modules/quiz/application/query';
import { Question } from '@modules/quiz/domain/question.entity';
import { QuestionRepository } from '@modules/quiz/infrastucture/question.repository';
import { QuestionController } from '@modules/quiz/api/question.controller';
import { QuestionQueryRepository } from '@modules/quiz/infrastucture/query/question.query.repository';
import { GameController } from '@modules/quiz/api/game.controler';
import { Game } from '@modules/quiz/domain/game.entity';
import { AnsweredQuestion } from '@modules/quiz/domain/answered.question.entity';
import { PlayingUser } from '@modules/quiz/domain/playing.user.entity';
import { RoundQuestion } from '@modules/quiz/domain/round.question.entity';
import { GameQueryRepository } from '@modules/quiz/infrastucture/query/game.query.repository';
import { GameRepository } from '@modules/quiz/infrastucture/game.repository';
import { UserConfig } from '@modules/users-system/config/user.config';

@Module({
    imports: [
         TypeOrmModule.forFeature([Question, Game, AnsweredQuestion, PlayingUser, RoundQuestion]),
    ],
    controllers: [
        QuestionController,
        GameController,
    ],
    providers: [
        ...CommandHandlers,
        ...QueryHandlers,
        QuestionRepository,
        QuestionQueryRepository,
        GameRepository,
        GameQueryRepository,
        UserConfig,
    ],
    exports:[
    ]
})
export class QuizSystemModule {}
