import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GameViewDto } from '@modules/quiz/dto/view/game.view.dto';
import { Game } from '@modules/quiz/domain/game.entity';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { GameQueryRepository } from '@modules/quiz/infrastucture/query/game.query.repository';
import { MyStatisticViewDto } from '@modules/quiz/dto/view/my.statistic.view.dto';
import { MyStatisticRawDto } from '@modules/quiz/dto/my.statistic.raw.dto';

export class GetMyStatisticQuery extends Query<MyStatisticViewDto> {
    constructor(
        public readonly userId: string,
    ) {
        super();
    }
}
@QueryHandler(GetMyStatisticQuery)
export class GetMyStatisticHandler implements IQueryHandler<GetMyStatisticQuery> {
    constructor(
        private gameQueryRepository: GameQueryRepository,
    ) {}

    async execute({userId}: GetMyStatisticQuery):Promise<MyStatisticViewDto> {

        const statistic: MyStatisticRawDto[]
            = await this.gameQueryRepository.getMyStatistic(userId);

        let winsCount = 0;
        let lossesCount = 0;
        let drawsCount = 0;
        let score = 0;


        const dict = new Map<number,number>;

        for(let game of statistic) {
            let scoreUser: number;
            let scoreEnemy: number;
            const f = dict.get(game.gameId);
            if(f !== undefined) {
                if(game.userId == +userId){
                    score += game.score;
                    scoreUser = game.score;
                    scoreEnemy = f;
                } else {
                    scoreUser = f;
                    scoreEnemy = game.score;
                }
                if(scoreUser < scoreEnemy)
                    lossesCount++;
                else if(scoreEnemy == scoreUser)
                    drawsCount++;
                else winsCount++;
            }
            else {
                if(game.userId == +userId)
                    score += game.score;
                dict.set(game.gameId, game.score);
            }
        }
        const view = new MyStatisticViewDto();
        view.drawsCount = drawsCount;
        view.lossesCount = lossesCount;
        view.winsCount = winsCount;
        view.gamesCount = drawsCount + winsCount + lossesCount;
        view.sumScore = score;
        view.avgScores = Math.round(score / view.gamesCount * 100) / 100  ;

        return view;

    }
}