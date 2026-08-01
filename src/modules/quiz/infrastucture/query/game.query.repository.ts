import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isDbId } from '@core/is.db.id';
import { Game } from '@modules/quiz/domain/game.entity';
import { StatusGame } from '@modules/quiz/dto/type/status.game.enum';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { AnsweredQuestion } from '@modules/quiz/domain/answered.question.entity';
import { GamePairViewDto } from '@modules/quiz/dto/view/game.pair.view.dto';
import { AnswerViewDto } from '@modules/quiz/dto/view/answer.view.dto';
import { gamesSortByToDb, GetGamesQueryParams } from '@modules/quiz/dto/input/get.games.query.params';
import { sortDirectionToDb } from '@core/dto/base.query.params.input.dto';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { EmptyPaginator } from '@core/dto/empty.paginator';

@Injectable()
export class GameQueryRepository {
    constructor(
        @InjectRepository(Game) private gameORMRepo: Repository<Game>,
        @InjectRepository(AnsweredQuestion)
            private answerORMRepo: Repository<AnsweredQuestion>,
    ) {}

    async findUnfinished(userId: string): Promise<GamePairViewDto | null> {
        const idDB = isDbId(userId);
        if (!idDB) return null;

        const game = await this.gameORMRepo
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.answeredQuestion', 'answeredQuestion')
            .leftJoinAndSelect('answeredQuestion.game', 'answeredQuestionGame')
            .leftJoinAndSelect('answeredQuestion.user', 'answeredQuestionUser')
            .leftJoinAndSelect(
                'answeredQuestion.question',
                'answeredQuestionQuestion',
            )
            .leftJoinAndSelect('game.roundQuestion', 'roundQuestion')
            .leftJoinAndSelect(
                'roundQuestion.question',
                'roundQuestionQuestion',
            )
            .leftJoinAndSelect('game.playingUsers', 'playingUsers')
            .leftJoinAndSelect('playingUsers.user', 'user')
            .where('game.status != :status', { status: StatusGame.Finished })
            .andWhere((qb) => {
                const subQuery = qb
                    .subQuery()
                    .select('g.id')
                    .from(Game, 'g')
                    .leftJoin('g.playingUsers', 'pu')
                    .leftJoin('pu.user', 'u')
                    .where('g.status != :status', {
                        status: StatusGame.Finished,
                    })
                    .andWhere('u.id = :idDB', { idDB })
                    .getQuery();
                return 'game.id IN ' + subQuery;
            })
            .getOne();

        if (!game) return null;
        return GamePairViewDto.MapGameToView(game);
    }

    async findAllMyGames(userId: string, query: GetGamesQueryParams): Promise<PaginatedViewDto<GamePairViewDto>> {
        const idDB = isDbId(userId);
        if (!idDB)
            return new EmptyPaginator<GamePairViewDto>;


        const count
            = await this.gameORMRepo
            .createQueryBuilder("g")
            .leftJoin('g.playingUsers', 'pu')
            .leftJoin('pu.user', 'u')
            .select('g.id','id')
            .addSelect('pu.user', 'user')
            .where('u.id = :idDB', { idDB })
            .getCount();

        if (count == 0)
            return new EmptyPaginator<GamePairViewDto>;

        query.calculateSkip(count);

        const gameIds
            = await this.gameORMRepo
            .createQueryBuilder("g")
            .leftJoin('g.playingUsers', 'pu')
            .leftJoin('pu.user', 'u')
            .select('g.id','id')
            .addSelect('pu.user', 'user')
            .where('u.id = :idDB', { idDB })
            .orderBy(`g."${gamesSortByToDb[query.sortBy]}"`, sortDirectionToDb[query.sortDirection])
            .addOrderBy('g."pairCreatedAt"', 'DESC')
            .limit(query.pageSize)
            .offset(query.skip)
            .getRawMany();

        const ids = gameIds.map(g => g.id);
        const games = await this.gameORMRepo
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.answeredQuestion', 'answeredQuestion')
            .leftJoinAndSelect('answeredQuestion.game', 'answeredQuestionGame')
            .leftJoinAndSelect('answeredQuestion.user', 'answeredQuestionUser')
            .leftJoinAndSelect('answeredQuestion.question', 'answeredQuestionQuestion' )
            .leftJoinAndSelect('game.roundQuestion', 'roundQuestion')
            .leftJoinAndSelect('roundQuestion.question', 'roundQuestionQuestion')
            .leftJoinAndSelect('game.playingUsers', 'playingUsers')
            .leftJoinAndSelect('playingUsers.user', 'user')
            .whereInIds(ids)
            .getMany();

            const orderMap = new Map(ids.map((id, index) => [id, index]));

            games.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

        return  PaginatedViewDto.mapToView({
            items: games.map((game) => {return GamePairViewDto.MapGameToView(game)}),
            page: query.pageNumber,
            size: query.pageSize,
            totalCount: count
        })
    }

    async findById(id: number): Promise<GamePairViewDto> {
        const game: Game | null = await this.gameORMRepo.findOne({
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
            throw new DomainException({
                message: 'game not found',
                code: DomainExceptionCode.NotFound,
            });
        return GamePairViewDto.MapGameToView(game);
    }

    async findAnswerById(id: string): Promise<AnswerViewDto | null> {
        const idDB = isDbId(id);
        if (!idDB) return null;

        const answers = await this.answerORMRepo.findOne({
            where: { id: idDB },
            relations: { question: true },
        });
        if (!answers) return null;

        return AnswerViewDto.MapToView(answers);
    }
}
