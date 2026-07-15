import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { StatusGame } from '@modules/quiz/dto/type/status.game.type';
import { AnsweredQuestion } from '@modules/quiz/domain/answered.question.entity';
import { PlayingUser } from '@modules/quiz/domain/playing.user.entity';
import { RoundQuestion } from '@modules/quiz/domain/round.question.entity';
import { Question } from '@modules/quiz/domain/question.entity';

@Entity()
export class Game {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        nullable: false,
        type: 'enum',
        default: StatusGame.PendingSecondPlayer,
        enum: StatusGame,
        enumName: 'status_game',
    })
    status: StatusGame;

    @OneToMany(() => AnsweredQuestion, (usingQuestion) => usingQuestion.game, {nullable: true, cascade: ['insert', 'update'],})
    answeredQuestion: AnsweredQuestion[];

    @OneToMany(() => RoundQuestion, (roundQuestion) => roundQuestion.game, {nullable: false, cascade: ['insert', 'update']})
    roundQuestion: RoundQuestion[];


    @OneToMany(() => PlayingUser, (playingUser) => playingUser.game, {nullable: false, cascade: ['insert', 'update'],})
    playingUsers: PlayingUser[];

    static create(questions: Question[], userId:string): Game {
        const game: Game = new this();
        game.status = StatusGame.PendingSecondPlayer;
        const playingUser = PlayingUser.create(+userId, game);
        game.playingUsers = [playingUser];
        game.answeredQuestion = [];
        game.roundQuestion = [];
        for (const question of questions) {
            game.roundQuestion.push(RoundQuestion.create(question, game));
        }
        return game;
    }
}