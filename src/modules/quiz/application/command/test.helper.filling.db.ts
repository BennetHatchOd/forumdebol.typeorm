import { Repository } from 'typeorm';
import { User } from '@modules/users-system/domain/user.entity';
import { Question } from '@modules/quiz/domain/question.entity';

export async function testHelperFillingDb(
    questions: { body: string, correctAnswers: string[], published: boolean}[],
    users: { id: number, login: string, email: string, passwordHash: string}[],
    userRepo: Repository<User>,
    questionRepo: Repository<Question>
) {
    
    for (let user of users) {
        const result = await userRepo.save(
            userRepo.create(user));
        user.id = result.id;
    }
    for (let question of questions) {
        await questionRepo.save(
            questionRepo.create(question));
    }
}