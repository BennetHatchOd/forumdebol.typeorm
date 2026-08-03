import { GetQuestionHandler } from '@modules/quiz/application/query/get.question.query';
import { GetAllQuestionHandler } from '@modules/quiz/application/query/get.all.questions.query';
import { GetGameByIdHandler } from '@modules/quiz/application/query/get.game.by.id.query';
import { GetUserCurrentGameHandler } from '@modules/quiz/application/query/get.user.current.game.query';
import { GetAnswerHandler } from '@modules/quiz/application/query/get.answer.query';
import { GetMyStatisticHandler } from '@modules/quiz/application/query/get.my.statistic.query';
import { GetAllGameUserHandler } from '@modules/quiz/application/query/get.all.game.user.query';
import { GetAllStatisticHandler } from '@modules/quiz/application/query/get.all.statistic.query';

export const QueryHandlers = [
    GetQuestionHandler,
    GetAllQuestionHandler,
    GetGameByIdHandler,
    GetUserCurrentGameHandler,
    GetAllGameUserHandler,
    GetAnswerHandler,
    GetMyStatisticHandler,
    GetAllStatisticHandler
];