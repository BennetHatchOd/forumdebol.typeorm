import { TopStatisticsRawDto } from '@modules/quiz/dto/top.statistics.raw.dto';

export class TopGamePlayerViewDto{
    sumScore:	number;
    avgScores:	number;
    gamesCount:	number;
    winsCount:	number;
    lossesCount: number;
    drawsCount:	number;
    player:{
        id: string;
        login: string;
    }

    static mapTopGamePlayerToView(statistics: TopStatisticsRawDto): TopGamePlayerViewDto{
        const view = new TopGamePlayerViewDto();

        view.gamesCount = statistics.gamesCount;
        view.lossesCount = statistics.lossesCount;
        view.winsCount = statistics.winsCount;
        view.drawsCount = view.gamesCount - view.winsCount - view.lossesCount;
        view.sumScore = statistics.sumScore;
        view.avgScores = Math.round(statistics.avgScores * 100) / 100;
        view.player = {
            login: statistics.login,
            id: statistics.userId.toString()}
        return view;

    }
}