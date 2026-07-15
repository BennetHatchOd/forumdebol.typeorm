import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Game } from '@modules/quiz/domain/game.entity';
import { Question } from '@modules/quiz/domain/question.entity';

@Entity()
export class RoundQuestion {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Game, (game) => game.roundQuestion, { nullable: false })
    game: Game;

    @ManyToOne(() => Question, { nullable: false })
    question: Question;

    static create(question: Question, game: Game):RoundQuestion {
        const roundQuestion: RoundQuestion = new this();
        roundQuestion.game = game;
        roundQuestion.question = question;
        return roundQuestion;
    }

}
