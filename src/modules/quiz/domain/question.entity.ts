import { RealObjectBaseDBEntity } from '@core/domain/real.object.base';
import { Column, Entity } from 'typeorm';
import { QuestionInputDto } from '@modules/quiz/dto/input/question.input.dto';
import { QuestionFieldRestrict } from '@modules/quiz/dto/field.restrictions';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';

@Entity()
export class Question extends RealObjectBaseDBEntity {
    @Column({default: null})
    updatedAt: Date;

    @Column({
        type: 'varchar',
        length: QuestionFieldRestrict.bodyMax, unique: true
    })
    body: string;

    @Column({
        type: 'jsonb',
        array: false,
        default: () => "'[]'",
        nullable: false,
    })
    correctAnswers: string[];

    @Column({
        type: 'boolean',
        default: false,
        nullable: false })
    published: boolean;


    static create(dto: QuestionInputDto): Question {
        const question = new this();
        question.body = dto.body;
        question.correctAnswers = dto.correctAnswers;

        return question;
    }

    update(dto: QuestionInputDto) {
        if(this.published && dto.correctAnswers.length == 0)
            throw new DomainException({
                message:
                    'property correctAnswers are not passed but property published is true',
                code: DomainExceptionCode.BadRequest,
                extension: [
                    {
                        message:
                            'property correctAnswers are not passed but property published is true',
                        field: 'correctAnswers',
                    },
                ],
            });

        this.body = dto.body;
        this.correctAnswers = dto.correctAnswers;
        this.updatedAt = new Date();
    }

    publish(isPublished: boolean) {
        if(isPublished && this.correctAnswers.length == 0)
            throw new DomainException({
                message:
                    'specified question doesn\'t have correct answers',
                code: DomainExceptionCode.BadRequest,
                extension: [
                    {
                        message:
                            'specified question doesn\'t have correct answers',
                        field: 'published',
                    },
                ],
            });
        this.published = isPublished;
    }
}