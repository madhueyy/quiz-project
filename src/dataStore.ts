// @ts-nocheck
// @ts-ignore

import fs from 'fs';
import path from 'path';
import { sleepSync } from './tests/test-helper';
import { get } from 'http';

let timers = [
];

export function clearAllTimers() {
  for (const timerId of timers) {
    console.log(`clearing timer ${timerId}`);
    clearTimeout(timerId);
  }

  timers = [];
}

export function addTimer(timerId) {
  timers.push(timerId);
}

function setData(data:any): any {
  fs.writeFileSync(path.resolve(__dirname, './db.json'), JSON.stringify(data));
}

function getData(): any {
  return JSON.parse(String(fs.readFileSync(path.resolve(__dirname, './db.json'))));
}

export { setData, getData };

// This is what db.json is supposed to look like
// const data = {
//   tokens: [
//     {
//       token: "1230932",
//       userId: 5
//     },
//     {
//       token: "994433",
//       userId: 4
//     }
//   ],
//   users: [
//     {
//       nameFirst: "Jack",
//       nameLast: "Rao",
//       email: "jack@gmail.com",
//       password: "password",
//       numSuccessfulLogins: 5,
//       numFailedPasswordsSinceLastLogin: 1,
//       authUserId: 5,
//       isLoggedIn: true,
//       quizzesCreated: []
//     },
//     {
//       nameFirst: "Devam",
//       nameLast: "Jain",
//       email: "devam@gmail.com",
//       password: "iLoveUsmaan",
//       numSuccessfulLogins: 5,
//       numFailedPasswordsSinceLastLogin: 0,
//       authUserId: 3,
//       isLoggedIn: true,
//       quizzesCreated: []
//     },
//     {
//       nameFirst: "Fay",
//       nameLast: "Liang",
//       email: "fay@gmail.com",
//       password: "im_fayded#coolkid",
//       numSuccessfulLogins: 99,
//       numFailedPasswordsSinceLastLogin: 0,
//       authUserId: 1,
//       isLoggedIn: false,
//       quizzesCreated: [1]
//     }
//   ],

//   quizzes: [
//     {
//       creatorId: 5,
//       quizId: 5546,
//       name: "This is the name of the quiz",
//       timeCreated: 1683019484,
//       timeLastEdited: 1683019484,
//       description: "This quiz is so we can have a lot of fun",
//       numQuestions: 1,
//       questions: [
//         {
//           questionId: 5547,
//           question: "Who is the Monarch of England?",
//           duration: 4,
//           points: 5,
//           answers: [
//             {
//               answerId: 2384,
//               answer: "Prince Charles",
//               colour: "red",
//               correct: true
//             },
//             {
//               answerId: 3453,
//               answer: "rock johnson",
//               colour: "blue",
//               correct: false
//             },
//             {
//               answerId: 1231,
//               answer: "leonardo dicaprico",
//               colour: "yellow",
//               correct: false
//             }
//           ]
//         }
//       ],
//       thumbnailUrl: "https://website/image.png",
//       thumbnailPath: "localhost:8080/images/image.png",
//       duration: 44,
//       isTrash: false
//     }
//   ],

//   sessions: [
//     {
//       sessionId: 5,
//       quiz: {
//         creatorId: 5,
//         quizId: 5546,
//         name: "This is the name of the quiz",
//         timeCreated: 1683019484,
//         timeLastEdited: 1683019484,
//         description: "This quiz is so we can have a lot of fun",
//         numQuestions: 1,
//         questions: [
//           {
//             questionId: 5547,
//             question: "Who is the Monarch of England?",
//             duration: 4,
//             thumbnailUrl: "http://google.com/some/image/path.jpg",
//             points: 5,
//             answers: [
//               {
//                 answerId: 2384,
//                 answer: "Prince Charles",
//                 colour: "red",
//                 correct: true
//               },
//               {
//                 answerId: 3453,
//                 answer: "rock johnson",
//                 colour: "blue",
//                 correct: false
//               },
//               {
//                 answerId: 1231,
//                 answer: "leonardo dicaprico",
//                 colour: "yellow",
//                 correct: false
//               }
//             ]
//           }
//         ],
//         duration: 44,
//         thumbnailUrl: "http://google.com/some/image/path.jpg",
//         thumbnailPath: "localhost:8080/images/image.png",
//         isTrash: false
//       },
//       state: "LOBBY",
//       startTime: 4940494958393,
//       atQuestion: 3,
//       questionNumber: 3,
//       autoStartNum : 5,
//       players: [
//         {
//           name: "mikey153",
//           playerId: 1532,
//         },
//         {
//           name: "valid123",
//           playerId: 1522,
//         }
//       ],
//      questionsGoneThrough: [5547, 5548],
//       questionResponses: [
//         {
//           questionId: 5547,
//           playerResponses: [
//             {
//               playerId: 2384,
//               answerId: 123123
//               timesubmitted: 123,
//               score: 22
//             }
//           ]
//         },
///         {
//           questionId: 5548,
//           playerResponses: [
//             {
//               playerId: 123,
//               answerId: 234235
//               timesubmitted: 35432,
//               score: 9
//             }
//           ]
//         },
//       ],
//       chat: [
//         {
//           messageBody: "bro u suck",
//           playerId: 1353,
//           playerName: "mikey153",
//           timeSent: 53253
//         },
//         {
//           messageBody: "kys",
//           playerId: 1353,
//           playerName: "valid123",
//           timeSent: 53254
//         }
//       ]
//     }
//   ],
//   imagePaths: [
//     "localhost:8080/my_image.png",
//     "localhost:8080/another_image.jpg"
//   ]
// };
