import { CodeBaseDBEntity } from '@modules/users-system/domain/code.base';
import { Entity } from 'typeorm';

@Entity()
export class ConfirmEmail extends CodeBaseDBEntity {}