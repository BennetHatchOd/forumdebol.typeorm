export async function testHelperFillingArrays(
    questions: { id: number,  body: string, correctAnswers: string[], published: boolean}[],
    users: { id: number, login: string, email: string, passwordHash: string}[],
) {
    questions.push({
        id: 0,
        body: 'say 7, 8, 9',
        correctAnswers: ['7', '8', '9'],

        published: true
    },{
        id: 0,
        body: 'say 5',
        correctAnswers: ['5'],
        published: true
    },{
        id: 0,
        body: 'say 6, 7',
        published: true,
        correctAnswers: ['6', '7'],
    },{
        id: 0,
        body: '2 + 2?',
        correctAnswers: ['four','4'],
        published: true
    },{
        id: 0,
        body: 'one',
        correctAnswers: ['two'],
        published: true
    },{
        id: 0,
        body: 'two',
        correctAnswers: ['three'],
        published: true
    },{
        id: 0,
        body: 'three',
        correctAnswers: ['four'],
        published: true
    },{
        id: 0,
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
    },
    {
        id: 0,
        login: 'u4',
        email: 'u4@test.local',
        passwordHash: 'hash',
    },{
        id: 0,
        login: 'u5',
        email: 'u5@test.local',
        passwordHash: 'hash',
    },{
        id: 0,
        login: 'u6',
        email: 'u6@test.local',
        passwordHash: 'hash',
    });
}