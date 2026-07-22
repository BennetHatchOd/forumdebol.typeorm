import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isDbId } from '@core/is.db.id';
import { Game } from '@modules/quiz/domain/game.entity';
import { StatusGame } from '@modules/quiz/dto/type/status.game.enum';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { AnsweredQuestion } from '@modules/quiz/domain/answered.question.entity';
import { GameViewDto } from '@modules/quiz/dto/view/game.view.dto';
import { AnswerViewDto } from '@modules/quiz/dto/view/answer.view.dto';

@Injectable()
export class GameQueryRepository {
    constructor(
        @InjectRepository(Game) private quizORMRepo: Repository<Game>,
        @InjectRepository(AnsweredQuestion) private answerORMRepo: Repository<AnsweredQuestion>,
    ) {}

    async findUnFinished(userId: string): Promise<GameViewDto|null> {
        const idDB = isDbId(userId);
        if (!idDB) return null;

        const game = await this.quizORMRepo
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.answeredQuestion', 'answeredQuestion')
            .leftJoinAndSelect('answeredQuestion.game', 'answeredQuestionGame')
            .leftJoinAndSelect('answeredQuestion.user', 'answeredQuestionUser')
            .leftJoinAndSelect('answeredQuestion.question', 'answeredQuestionQuestion')
            .leftJoinAndSelect('game.roundQuestion', 'roundQuestion')
            .leftJoinAndSelect('roundQuestion.question', 'roundQuestionQuestion')
            .leftJoinAndSelect('game.playingUsers', 'playingUsers')
            .leftJoinAndSelect('playingUsers.user', 'user')
            .where('game.status != :status', { status: StatusGame.Finished })
            .andWhere(qb => {
                const subQuery = qb
                    .subQuery()
                    .select('g.id')
                    .from(Game, 'g')
                    .leftJoin('g.playingUsers', 'pu')
                    .leftJoin('pu.user', 'u')
                    .where('g.status != :status', { status: StatusGame.Finished })
                    .andWhere('u.id = :idDB', { idDB })
                    .getQuery();
                return 'game.id IN ' + subQuery;
            })
            .getOne();

        if (!game)
            return null;
        return GameViewDto.MapGameToView(game);
    }

    async findById(id: number): Promise<GameViewDto> {

        const game: Game | null = await this.quizORMRepo.findOne({
            where: {
                id: id,
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
if (!game)
    throw  new DomainException({
        message: 'game not found',
        code: DomainExceptionCode.NotFound,
    });
    return GameViewDto.MapGameToView(game);
    }

    async findAnswerById(id: string): Promise<AnswerViewDto|null> {
        const idDB = isDbId(id);
        if (!idDB) return null;

        const answers = await this.answerORMRepo.findOne({where:{id: idDB},relations: {question:true}});
        if (!answers) return null;

        return AnswerViewDto.MapToView(answers);
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
