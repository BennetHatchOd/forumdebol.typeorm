import {
    Column,
    CreateDateColumn,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';

export class LikeBaseDBEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'int',
        nullable: false,
    })
    userId: number;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    status: Rating;

}