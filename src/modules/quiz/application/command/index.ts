import { CreateQuestionHandler } from '@modules/quiz/application/command/create.question.usecase';
import { EditQuestionHandler } from '@modules/quiz/application/command/edit.question.usecase';
import { DeleteQuestionHandler } from '@modules/quiz/application/command/delete.question.usecase';
import { PublishedHandler } from '@modules/quiz/application/command/published.usecase';
import { RegistrationPlayerHandler } from '@modules/quiz/application/command/registration.player.usecase';
import { CheckAnswerHandler } from '@modules/quiz/application/command/check.answer.usecase';

export const CommandHandlers = [
    CreateQuestionHandler,
    EditQuestionHandler,
    DeleteQuestionHandler,
    PublishedHandler,
    RegistrationPlayerHandler,
    CheckAnswerHandler,
];