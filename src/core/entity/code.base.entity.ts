import {
    Column,
    PrimaryGeneratedColumn,
} from 'typeorm';

export class CodeBaseDBEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'varchar',
        nullable: false,
    })
    code: string;

    @Column()
    expirationTime: Date;

    @Column({
        type: 'int',
        nullable: false,
    })
    userId: number;
}