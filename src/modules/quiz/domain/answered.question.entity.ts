import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Question } from '@modules/quiz/domain/question.entity';
import { Game } from '@modules/quiz/domain/game.entity';
import { User } from '@modules/users-system/domain/user.entity';

@Entity()
export class AnsweredQuestion {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Question, {nullable: false } )
    question: Question;

    @ManyToOne(() => Game,(game) => game.answeredQuestion, {nullable: false } )
    game: Game;

    @ManyToOne(() => User, {nullable: false } )
    user: User;

    @Column({nullable: false})
    answer: string;

    @Column({ type: 'boolean', nullable: false })
    isCorrect: boolean;

    @CreateDateColumn()
    addedAt: Date;
}