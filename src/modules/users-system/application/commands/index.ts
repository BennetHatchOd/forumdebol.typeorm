import { CreateUserHandler } from '@modules/users-system/application/commands/create.user.usecase';
import { CreateSessionHandler } from '@modules/users-system/application/commands/create.session.usecase';
import { UpdateSessionHandler } from '@modules/users-system/application/commands/update.session.usecase';
import { DeleteOneSessionHandler } from '@modules/users-system/application/commands/delete.one.session.usecase';
import { DeleteOthersSessionHandler } from '@modules/users-system/application/commands/delete.others.sessions.usecase';
import { DeleteMySessionHandler } from '@modules/users-system/application/commands/delete.my.session.usecase';
import { ConfirmationEmailHandler } from '@modules/users-system/application/commands/confirmation.email.usecase';
import {
    CreateCodeConfirmationEmailHandler
} from '@modules/users-system/application/commands/create.code.confirmation.email.usecase';
import { DeleteUserHandler } from '@modules/users-system/application/commands/delete.user.usecase';
import { AskNewPasswordHandler } from '@modules/users-system/application/commands/ask.new.password.usecase';

export const CommandHandlers = [
    CreateUserHandler,
    DeleteUserHandler,
    ConfirmationEmailHandler,
    CreateCodeConfirmationEmailHandler,
    CreateSessionHandler,
    UpdateSessionHandler,
    DeleteOneSessionHandler,
    DeleteMySessionHandler,
    DeleteOthersSessionHandler,
    AskNewPasswordHandler,
];