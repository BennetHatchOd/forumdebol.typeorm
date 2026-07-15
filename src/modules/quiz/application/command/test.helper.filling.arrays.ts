import { Repository } from 'typeorm';
import { User } from '@modules/users-system/domain/user.entity';
import { Question } from '@modules/quiz/domain/question.entity';

export async function testHelperFillingArrays(
    questions: { body: string, correctAnswers: string[], published: boolean}[],
    users: { id: number, login: string, email: string, passwordHash: string}[],
) {
    questions.push({
        body: 'say 7, 8, 9',
        correctAnswers: ['7', '8', '9'],

        published: true
    },{
        body: 'say 5',
        correctAnswers: ['5'],
        published: true
    },{
        body: 'say 6, 7',
        published: true,
        correctAnswers: ['6', '7'],
    },{
        body: '2 + 2?',
        correctAnswers: ['four','4'],
        published: true
    },{
        body: 'one',
        correctAnswers: ['two'],
        published: true
    },{
        body: 'two',
        correctAnswers: ['three'],
        published: true
    },{
        body: 'three',
        correctAnswers: ['four'],
        published: true
    },{
        body: 'four?',
        correctAnswers: ['five'],
        published: true
    });

    users.push(
    {
        id: 0,
        login: 'u1',
        email: 'u1@test.local',
        passwordHash: 'hash',
    },
    {
        id: 0,
        login: 'u2',
        email: 'u2@test.local',
        passwordHash: 'hash',
    },{
        id: 0,
        login: 'u3',
        email: 'u3@test.local',
        passwordHash: 'hash',
        });
};