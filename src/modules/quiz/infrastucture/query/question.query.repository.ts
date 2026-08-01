import { Injectable } from '@nestjs/common';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { EmptyPaginator } from '@core/dto/empty.paginator';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isDbId } from '@core/is.db.id';
import { sortDirectionToDb } from '@core/dto/base.query.params.input.dto';
import { Question } from '@modules/quiz/domain/question.entity';
import { QuestionViewDto } from '@modules/quiz/dto/view/question.view.dto';
import { GetQuestionQueryParams } from '@modules/quiz/dto/input/get.question.query.params';
import { PublishedStatus } from '@modules/quiz/dto/type/published.status.type';


@Injectable()
export class QuestionQueryRepository {

    constructor(
        @InjectRepository(Question) private questionORMRepo: Repository<Question>
    ) {}

    async  findById(id: string): Promise<QuestionViewDto> {
        const idDB = isDbId(id);
        if (!idDB)
        throw new DomainException({
                message: 'question not found',
                code: DomainExceptionCode.NotFound});

        const question: Question|null =  await this.questionORMRepo.findOneBy({id:idDB});

        if(!question)
            throw  new DomainException({
                message: 'question not found',
                code: DomainExceptionCode.NotFound,
            });

        return QuestionViewDto.MapToView(question);
    }

    async find(queryReq: GetQuestionQueryParams): Promise<PaginatedViewDto<QuestionViewDto>> {

        const req = this.questionORMRepo.createQueryBuilder('q');
        if(queryReq.publishedStatus !== PublishedStatus.All) {
            const publ: boolean =  queryReq.publishedStatus === PublishedStatus.Published;
            req.andWhere(`q.published = :publish`, { publish: publ });
        }
        if (queryReq.bodySearchTerm) {
            req.andWhere(`body ILIKE :body`, {body: `%${queryReq.bodySearchTerm}%`})
        }

        req.orderBy(`q.${queryReq.sortBy}`, sortDirectionToDb[queryReq.sortDirection])

        const totalCount: number = await req.getCount();
        if(totalCount === 0)
            return new EmptyPaginator<QuestionViewDto>();

        queryReq.calculateSkip(+totalCount);

        const questions: Question[] = await req.take(queryReq.pageSize).skip(queryReq.skip).getMany();

        const items = questions.map(QuestionViewDto.MapToView);

        return PaginatedViewDto.mapToView({
            items: items,
            page: queryReq.pageNumber,
            size: queryReq.pageSize,
            totalCount: totalCount
        })
    }
}