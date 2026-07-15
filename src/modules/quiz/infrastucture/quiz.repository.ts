import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isDbId } from '@core/is.db.id';
import { Game } from '@modules/quiz/domain/game.entity';
import { StatusGame } from '@modules/quiz/dto/type/status.game.type';

@Injectable()
export class QuizRepository {
    constructor(
        @InjectRepository(Game) private quizORMRepo: Repository<Game>,
    ) {}

    async findActive(userId: string): Promise<Game | null> {
        const idDB = isDbId(userId);
        if (!idDB) return null;

        return await this.quizORMRepo
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.answeredQuestion', 'answeredQuestion')
            .leftJoinAndSelect('answeredQuestion.game', 'answeredQuestionGame')
            .leftJoinAndSelect('answeredQuestion.user', 'answeredQuestionUser')
            .leftJoinAndSelect('answeredQuestion.question', 'answeredQuestionQuestion')
            .leftJoinAndSelect('game.roundQuestion', 'roundQuestion')
            .leftJoinAndSelect('roundQuestion.question', 'roundQuestionQuestion')
            .leftJoinAndSelect('game.playingUsers', 'playingUsers')
            .leftJoinAndSelect('playingUsers.user', 'user')
            .where('game.status = :status', { status: StatusGame.Active })
            .andWhere(qb => {
                const subQuery = qb
                    .subQuery()
                    .select('g.id')
                    .from(Game, 'g')
                    .leftJoin('g.playingUsers', 'pu')
                    .leftJoin('pu.user', 'u')
                    .where('g.status = :status', { status: StatusGame.Active })
                    .andWhere('u.id = :idDB', { idDB })
                    .getQuery();
                return 'game.id IN ' + subQuery;
            })
            .getOne();
    }

    async findPending(): Promise<Game | null> {

        const game: Game | null = await this.quizORMRepo.findOne({
            where: {
                status: StatusGame.PendingSecondPlayer,
            },
            relations: {
                answeredQuestion: {
                    game: true,
                    user: true,
                    question: true,
                },
                roundQuestion: {
                    question: true,
                },
                playingUsers: {
                    user: true,
                },
            },
        });

        return game;
    }

    // async existsById(id: string): Promise<boolean> {
    //     const idDB = isDbId(id);
    //     if (!idDB) return false;
    //
    //     const result = await this.questionORMRepo.existsBy({ id: idDB });
    //
    //     return result;
    // }
    //

    //
    // async delete(question: Question): Promise<void> {
    //     await this.questionORMRepo.softRemove(question);
    //     return;
    // }
    async save(game: Game) {

        await this.quizORMRepo.save(game);

        return;
    }
}
