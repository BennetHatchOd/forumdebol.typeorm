import { User } from '@modules/users-system/domain/user.entity';
import { NewPassword } from '@modules/users-system/domain/new.password.entity';
import { ConfirmEmail } from '@modules/users-system/domain/confirm.email.entity';

export type EntityForRepo = User | NewPassword | ConfirmEmail;