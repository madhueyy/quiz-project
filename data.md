```javascript
let data = {
    
    // users is an array of user objects, with each user uniquely identified
    // by their authUserId.
    users: [
        {  
            nameFirst: 'Jack',
            nameLast: 'Rao',
            email: 'jack@gmail.com',
            password: 'password',
            numSuccessfulLogins: 5,
            numFailedPasswordsSinceLastLogin: 1,
            authUserId: 5,
            isAdmin: false,
        },
        {
            nameFirst: 'Devam',
            nameLast: 'Jain',
            email: 'devam@gmail.com',
            password: 'iLoveUsmaan',
            numSuccessfulLogins: 5,
            numFailedPasswordsSinceLastLogin: 0,
            authUserId: 3,
            isAdmin: true,
        },
        {
            nameFirst: 'Fay',
            nameLast: 'Liang',
            email: 'fay@gmail.com',
            password: 'im_fayded#coolkid',
            numSuccessfulLogins: 99,
            numFailedPasswordsSinceLastLogin: 0,
            authUserId: 1,
            isAdmin: false,
        },
    ],

    // quizzes is an array of quiz objects, with each quiz object uniquely
    // identified by its quizId. Each quiz object further has a quizQuestions
    // key, which maps to an array of question objects. Each question object is
    // uniquely identified by its questionId.
    quizzes: [
        {
            quizName: 'math1141 quiz',
            description: 'math1141 questions from 2022',
            quizId: 1,
            timeCreated: 1683125870,
            timeLastEdited: 1683125890,
            quizQuestions: [
                {
                    questionId: 1,
                    question: 'whats capital of usa',
                    imagePath: 'C:/jack/Documents/usa.png',
                    answerChoices: [
                        {'china': false},
                        {'washington dc': true},
                        {'texas': false},
                    ],
                    timeLimit: 50,
                    maxPoints: 1000,
                },

                {
                    questionId: 2,
                    question: 'why came first the chicken or the egg',
                    imagePath: 'https://www.google.com/url=verycoolimage',
                    answerChoices: [
                        {'chicken': false},
                        {'egg': false},
                        {'to be or not to be': true},
                    ],
                    timeLimit: 80,
                    maxPoints: 500,
                },
            ]
        },
    ],
}
```

 