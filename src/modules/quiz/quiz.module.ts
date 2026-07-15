import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandHandlers } from '@modules/quiz/application/command';
import { QueryHandlers } from '@modules/quiz/application/query';
import { Question } from '@modules/quiz/domain/question.entity';
import { QuestionRepository } from '@modules/quiz/infrastucture/question.repository';
import { QuestionController } from '@modules/quiz/api/question.controller';
import { QuestionQueryRepository } from '@modules/quiz/infrastucture/query/question.query.repository';

@Module({
    imports: [
         TypeOrmModule.forFeature([Question]),
    ],
    controllers: [
        QuestionController,
    ],
    providers: [
        ...CommandHandlers,
        ...QueryHandlers,
        QuestionRepository,
        QuestionQueryRepository,
    ],
    exports:[
    ]
})
export class QuizSystemModule {}
