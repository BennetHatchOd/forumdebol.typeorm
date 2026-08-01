import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Game } from '@modules/quiz/domain/game.entity';
import { User } from '@modules/users-system/domain/user.entity';

@Entity()
export class PlayingUser {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Game, (game) => game.playingUsers, {nullable: false } )
    game: Game;

    @ManyToOne(() => User, {nullable: false } )
    user: User;

    @Column({nullable: false, default: 0 } )
    numberQuestion: number;

    @Column({nullable: false, default: 0 } )
    score: number;

    static create(userId:number, game: Game): PlayingUser {
        const playingUser = new this();
        playingUser.user = {id: userId} as User;
        playingUser.game = game;
        playingUser.score = 0;
        playingUser.numberQuestion = 0;
        return playingUser;
    }

}