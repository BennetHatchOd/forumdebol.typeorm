import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@modules/users-system/domain/user.entity';

@Entity()
export class StatisticsUser {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({default: 0})
    sumScore:	number;

    @Column({default: 0})
    gamesCount:	number;

    @Column({default: 0})
    winsCount:	number;

    @Column({default: 0})
    lossesCount:	number;

    @OneToOne(() => User, { nullable: false })
    @JoinColumn()
    user: User;

    public win(score: number) {
        this.winsCount++;
        this.gamesCount++;
        this.sumScore += score;
    }

    public loss(score: number) {
        this.lossesCount++;
        this.gamesCount++;
        this.sumScore += score;
    }

    public draw(score: number) {
        this.gamesCount++;
        this.sumScore += score;
    }

    static create(user: number){
        const statistic = new this();
        statistic.user = {id: user} as User;
        statistic.lossesCount = 0;
        statistic.winsCount = 0;
        statistic.gamesCount = 0;
        statistic.sumScore = 0;
        return statistic;
    }
}