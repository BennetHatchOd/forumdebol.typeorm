import {
    Column, JoinColumn, OneToOne,
    PrimaryGeneratedColumn, RelationId,
} from 'typeorm';
import { User } from '@modules/users-system/domain/user.entity';
import { add } from 'date-fns';

export class CodeBaseDBEntity {
    @PrimaryGeneratedColumn('uuid')
    code: string;

    @Column()
    expirationTime: Date;

    @OneToOne(() => User, { nullable: false })
    @JoinColumn()
    user: User;

    @RelationId((code: CodeBaseDBEntity) => code.user)
    userId: number;

    static create(userId: number, timeLifeCode: number): CodeBaseDBEntity {
        const code = new this();
        code.user = { id: userId } as User;
        code.expirationTime = add(new Date(), { hours: timeLifeCode });

        return code;
    }

}