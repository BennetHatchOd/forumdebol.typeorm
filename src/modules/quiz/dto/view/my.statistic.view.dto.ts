import { StatisticsUser } from '@modules/quiz/domain/statistics.user.entity';

export class MyStatisticViewDto{
    sumScore:	number;
    avgScores:	number;
    gamesCount:	number;
    winsCount:	number;
    lossesCount: number;
    drawsCount:	number;

    static mapMyStatisticsToView(statistics: StatisticsUser): MyStatisticViewDto{
        const view = new MyStatisticViewDto();

        view.gamesCount = statistics.gamesCount;
        view.lossesCount = statistics.lossesCount;
        view.winsCount = statistics.winsCount;
        view.drawsCount = view.gamesCount - view.winsCount - view.lossesCount;
        view.sumScore = statistics.sumScore;
        view.avgScores = Math.round(view.sumScore / view.gamesCount * 100) / 100;
        return view;

    }

    static mapEmptyStatisticsToView(): MyStatisticViewDto{
        const view = new MyStatisticViewDto();

        view.gamesCount = 0;
        view.lossesCount = 0;
        view.winsCount = 0;
        view.drawsCount = 0;
        view.sumScore = 0;
        view.avgScores = 0;
        return view;

    }
}