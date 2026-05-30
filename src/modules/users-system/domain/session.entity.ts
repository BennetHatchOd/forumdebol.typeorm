import ShortUniqueId from 'short-unique-id';
import { SessionInputDto } from '@modules/users-system/dto/input/session.input.dto';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from 'typeorm';
import { User } from '@modules/users-system/domain/user.entity';

@Entity()
export class Session {

    @PrimaryGeneratedColumn('uuid')
    deviceId:   string;

    @ManyToOne(()=> User, { nullable: false })
    user: User;

    @RelationId((session: Session) => session.user)
    userId: number;

    @Column({ type: 'varchar', length: 10 })
    version:    string;

    @Column({ type: 'varchar' })
    deviceName: string;

    @Column({type: 'varchar'})
    ip: string;

    @UpdateDateColumn()
    updatedAt:  Date;

    update(){
        const uid = new ShortUniqueId({ length: 7 });

        this.version = uid.rnd();
    }

    static createInstance(dto: SessionInputDto,
    ): Session {
        const uuid = new ShortUniqueId({ length: 7 });
        const session = new this();

        session.user = {id: +dto.userId} as User;
        session.deviceName = dto.deviceName;
        session.ip = dto.ip;

        session.version = uuid.rnd();
        return session;
    }

}
