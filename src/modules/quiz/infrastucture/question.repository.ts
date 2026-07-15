import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isDbId } from '@core/is.db.id';
import { Question } from '@modules/quiz/domain/question.entity';
import { UserConfig } from '@modules/users-system/config/user.config';

@Injectable()
export class QuestionRepository {

    constructor(
        @InjectRepository(Question) private questionORMRepo: Repository<Question>,
        private readonly userConfig: UserConfig,
        ) {}
    
    async findById(id: string): Promise<Question | null> {
        const idDB = isDbId(id);
        if (!idDB) return null;

        const question: Question | null = await this.questionORMRepo.findOneBy({id:idDB});

        return question;
    }

    async getQuestionForRound(): Promise<Question[]|null> {

        const questions = await this.questionORMRepo
            .createQueryBuilder('question')
            .orderBy('RANDOM()')
            .where({published: true})
            .take(this.userConfig.quizQuestion)
            .getMany();
        if (questions.length < this.userConfig.quizQuestion)
            return null;
        return questions;
    }

    async existsById(id: string): Promise<boolean> {
        const idDB = isDbId(id);
        if (!idDB) return false;

        const result = await this.questionORMRepo.existsBy({id:idDB});

        return result;
    }

    async save(savedItem: Question): Promise<void> {

        await this.questionORMRepo.save(savedItem);

        return ;
    }

    async delete(question: Question): Promise<void> {
        await this.questionORMRepo.softRemove(question);
        return ;
    }
}
