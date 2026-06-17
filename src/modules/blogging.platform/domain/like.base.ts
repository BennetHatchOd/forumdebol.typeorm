import {
    Column,
    CreateDateColumn,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@modules/users-system/domain/user.entity';
import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';
import { LikeCreateDto } from '@modules/blogging.platform/dto/create/like.create.dto';

export abstract class LikeBase{
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: number;
    @Column({enum: Rating, type: 'enum', enumName: 'rating_enum' })
    status: Rating;

    protected static createBase<T extends LikeBase>(
        this: new () => T,
        dto: LikeCreateDto,
    ): T {
        const like = new this();
        like.user = { id: +dto.userId } as User;
        like.status = dto.status;
        return like;
    }
}