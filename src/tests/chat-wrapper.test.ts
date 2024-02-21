import { getMethod, postMethod, putMethod, deleteMethod, requestMethod } from './test-helper';
import HTTPError from 'http-errors';
import request from 'sync-request';
import { ChatBody, MessageBody } from '.././types';

const OK = 200;
const INPUT_ERROR = 400;
const TOKEN_STRUCTURE_ERROR = 401;
const TOKEN_SESSION_ERROR = 403;
const ERROR_STRING = { error: expect.any(String) };
const ANY_STRING = expect.any(String);
const ANY_NUMBER = expect.any(Number);
const LEBRONJAMES_JPG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/LeBron_James_%2851959977144%29_%28cropped2%29.jpg/640px-LeBron_James_%2851959977144%29_%28cropped2%29.jpg';

function sleepSync(ms: number) {
  const startTime = new Date().getTime();
  while (new Date().getTime() - startTime < ms) {
    // zzzZZ - comment needed so eslint doesn't complain
  }
}

beforeEach(() => {
  requestMethod('delete', '/v1/clear', {}, {});
});

describe('HTTP chatSendMessage', () => {
  let token1:any;
  let token2:any;
  let quizId1:any;
  let quizId2:any;
  let questionId1:any;
  let questionId2:any;
  let questionId3:any;
  let sessionId1:any;
  let sessionId2:any;
  let playerId1:any;
  let playerId2:any;
  let playerId3:any;
  let playerId4:any;
  beforeEach(() => {
    token1 = requestMethod('post', '/v1/admin/auth/register',
      {
        email: 'jack.rao@unsw.edu.au',
        password: 'polarbear135',
        nameFirst: 'Jack',
        nameLast: 'Rao'
      }).token;

    token2 = requestMethod('post', '/v1/admin/auth/register',
      {
        email: 'vacheron.constantin@unsw.edu.au',
        password: 'brownbear531',
        nameFirst: 'vacheron',
        nameLast: 'constantin'
      }).token;

    quizId1 = requestMethod('post', '/v1/admin/quiz', { token: token1, name: 'Quiz One', description: 'first user quiz' }).quizId;
    quizId2 = requestMethod('post', '/v1/admin/quiz', { token: token2, name: 'Two Quiz Two', description: 'second user quiz' }).quizId;

    // quizId1 has 3 questions, owned by token1
    // quizId2 has 0 questions, owned by token2

    // Adding a first question
    questionId1 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {

        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Will',
              correct: true
            },
            {
              answer: 'samson',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      }, { token: token1 }).questionId;

    // Adding a second question
    questionId2 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {

        questionBody: {
          question: 'whats obamas last name',
          duration: 15,
          points: 6,
          answers: [
            {
              answer: 'asdfsa',
              correct: false
            },
            {
              answer: 'dsaasdf',
              correct: true
            },
            {
              answer: 'wefaefwa',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      }, { token: token1 }).questionId;

    // Adding a third question
    questionId3 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {

        questionBody: {
          question: 'yo wassup',
          duration: 3,
          points: 7,
          answers: [
            {
              answer: '23g32g',
              correct: false
            },
            {
              answer: '234423',
              correct: false
            },
            {
              answer: 'e=mc squared',
              correct: true
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      }, { token: token1 }).questionId;

    // Start our sessions (both of these are for quiz1, owned by token1)
    sessionId1 = requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: token1 }).sessionId;
    sessionId2 = requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: token1 }).sessionId;

    playerId1 = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'robotone' }, {}).playerId;
    playerId2 = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'robottwo' }, {}).playerId;
    playerId3 = requestMethod('post', '/v1/player/join', { sessionId: sessionId2, name: 'robotthree' }, {}).playerId;
    playerId4 = requestMethod('post', '/v1/player/join', { sessionId: sessionId2, name: 'robotfour' }, {}).playerId;
  });

  test('Player ID does not exist', () => {
    expect(() => requestMethod('post', `/v1/player/${playerId1 - 500}/chat`, { message: { messageBody: 'wassup' } }, {})).toThrow(HTTPError[400]);
  });

  test('message body less than 1 char or more than 100 char', () => {
    expect(() => requestMethod('post', `/v1/player/${playerId1}/chat`, { message: { messageBody: '' } }, {})).toThrow(HTTPError[400]);
    const longMsg = '0123456789' +
        '0123456789' +
        '0123456789' +
        '0123456789' +
        '0123456789' +
        '0123456789' +
        '0123456789' +
        '0123456789' +
        '0123456789' +
        '0123456789' + 'a';
    expect(() => requestMethod('post', `/v1/player/${playerId1}/chat`, { message: { messageBody: longMsg } }, {})).toThrow(HTTPError[400]);
  });

  test('successfully sending a message', () => {
    expect(() => requestMethod('post', `/v1/player/${playerId1}/chat`, { message: { messageBody: 'hey bro' } }, {})).not.toThrow(HTTPError[400]);
  });

  test('successfully sending messages - 4 ppl, 2 diff sessions', () => {
    // p1, p2 are in session 1
    // p3, p4 are in session 2
    expect(() => requestMethod('post', `/v1/player/${playerId1}/chat`, { message: { messageBody: 'im in game one' } }, {})).not.toThrow(HTTPError[400]);
    expect(() => requestMethod('post', `/v1/player/${playerId2}/chat`, { message: { messageBody: 'im in game one as well' } }, {})).not.toThrow(HTTPError[400]);
    expect(() => requestMethod('post', `/v1/player/${playerId1}/chat`, { message: { messageBody: 'im in game two' } }, {})).not.toThrow(HTTPError[400]);
    expect(() => requestMethod('post', `/v1/player/${playerId3}/chat`, { message: { messageBody: 'im in game two as well' } }, {})).not.toThrow(HTTPError[400]);
  });
});

describe('HTTP chatViewMessages', () => {
  let token1:any;
  let token2:any;
  let quizId1:any;
  let quizId2:any;
  let questionId1:any;
  let questionId2:any;
  let questionId3:any;
  let sessionId1:any;
  let sessionId2:any;
  let playerId1:any;
  let playerId2:any;
  let playerId3:any;
  let playerId4:any;
  beforeEach(() => {
    token1 = requestMethod('post', '/v1/admin/auth/register',
      {
        email: 'jack.rao@unsw.edu.au',
        password: 'polarbear135',
        nameFirst: 'Jack',
        nameLast: 'Rao'
      }).token;

    token2 = requestMethod('post', '/v1/admin/auth/register',
      {
        email: 'vacheron.constantin@unsw.edu.au',
        password: 'brownbear531',
        nameFirst: 'vacheron',
        nameLast: 'constantin'
      }).token;

    quizId1 = requestMethod('post', '/v1/admin/quiz', { token: token1, name: 'Quiz One', description: 'first user quiz' }).quizId;
    quizId2 = requestMethod('post', '/v1/admin/quiz', { token: token2, name: 'Two Quiz Two', description: 'second user quiz' }).quizId;

    // quizId1 has 3 questions, owned by token1
    // quizId2 has 0 questions, owned by token2

    // Adding a first question
    questionId1 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {

        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Will',
              correct: true
            },
            {
              answer: 'samson',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      }, { token: token1 }).questionId;

    // Adding a second question
    questionId2 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {

        questionBody: {
          question: 'whats obamas last name',
          duration: 15,
          points: 6,
          answers: [
            {
              answer: 'asdfsa',
              correct: false
            },
            {
              answer: 'dsaasdf',
              correct: true
            },
            {
              answer: 'wefaefwa',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      }, { token: token1 }).questionId;

    // Adding a third question
    questionId3 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {

        questionBody: {
          question: 'yo wassup',
          duration: 3,
          points: 7,
          answers: [
            {
              answer: '23g32g',
              correct: false
            },
            {
              answer: '234423',
              correct: false
            },
            {
              answer: 'e=mc squared',
              correct: true
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      }, { token: token1 }).questionId;

    // Start our sessions (both of these are for quiz1, owned by token1)
    sessionId1 = requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: token1 }).sessionId;
    sessionId2 = requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: token1 }).sessionId;

    playerId1 = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'robotone' }, {}).playerId;
    playerId2 = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'robottwo' }, {}).playerId;
    playerId3 = requestMethod('post', '/v1/player/join', { sessionId: sessionId2, name: 'robotthree' }, {}).playerId;
    playerId4 = requestMethod('post', '/v1/player/join', { sessionId: sessionId2, name: 'robotfour' }, {}).playerId;
  });

  test('Player ID does not exist', () => {
    expect(() => requestMethod('get', `/v1/player/${playerId1 - 500}/chat`, {}, {})).toThrow(HTTPError[400]);
  });

  test('sending mutiple mesages from one person and having them be in the correct order that was sent', () => {
    expect(() => requestMethod('post', `/v1/player/${playerId1}/chat`, { message: { messageBody: 'first msg' } }, {})).not.toThrow(HTTPError[400]);
    expect(() => requestMethod('post', `/v1/player/${playerId1}/chat`, { message: { messageBody: 'second msg' } }, {})).not.toThrow(HTTPError[400]);
    expect(() => requestMethod('post', `/v1/player/${playerId1}/chat`, { message: { messageBody: 'third msg' } }, {})).not.toThrow(HTTPError[400]);

    // retrieve
    const msgLog = requestMethod('get', `/v1/player/${playerId1}/chat`, {}, {}).messages;
    expect(() => msgLog).not.toThrow(HTTPError[400]);
    expect(msgLog[0].messageBody).toStrictEqual('first msg');
    expect(msgLog[1].messageBody).toStrictEqual('second msg');
    expect(msgLog[2].messageBody).toStrictEqual('third msg');

    expect(msgLog[0].playerId).toStrictEqual(playerId1);
    expect(msgLog[1].playerId).toStrictEqual(playerId1);
    expect(msgLog[2].playerId).toStrictEqual(playerId1);
  });

  test('sending messages from 2 people, each to a different game', () => {
    expect(() => requestMethod('post', `/v1/player/${playerId1}/chat`, { message: { messageBody: 'im in game 1' } }, {})).not.toThrow(HTTPError[400]);
    expect(() => requestMethod('post', `/v1/player/${playerId3}/chat`, { message: { messageBody: 'im in game 2' } }, {})).not.toThrow(HTTPError[400]);

    // retrieve
    const msgLog1 = requestMethod('get', `/v1/player/${playerId1}/chat`, {}, {}).messages;
    expect(() => msgLog1).not.toThrow(HTTPError[400]);
    expect(msgLog1[0].messageBody).toStrictEqual('im in game 1');
    expect(msgLog1[0].playerId).toStrictEqual(playerId1);
    expect(msgLog1.length).toStrictEqual(1);

    const msgLog2 = requestMethod('get', `/v1/player/${playerId3}/chat`, {}, {}).messages;
    expect(() => msgLog2).not.toThrow(HTTPError[400]);
    expect(msgLog2[0].messageBody).toStrictEqual('im in game 2');
    expect(msgLog2[0].playerId).toStrictEqual(playerId3);
    expect(msgLog2.length).toStrictEqual(1);
  });

  test('mega unit test, 4 people, two different games', () => {
    const msgs = [
      [playerId1, 'g1m1'],
      [playerId1, 'g1m2'],
      [playerId2, 'g1m3'],
      [playerId1, 'g1m4'],
      [playerId3, 'g2m1'],
      [playerId4, 'g2m2'],
      [playerId2, 'g1m5'],
      [playerId3, 'g2m3']
    ];
    for (const item of msgs) {
      expect(() => requestMethod('post', `/v1/player/${item[0]}/chat`, { message: { messageBody: item[1] } }, {})).not.toThrow(HTTPError[400]);
    }

    // retrieve
    const msgLog1 = requestMethod('get', `/v1/player/${playerId1}/chat`, {}, {}).messages; // msglog of game 1
    expect(() => msgLog1).not.toThrow(HTTPError[400]);
    expect(JSON.stringify(msgLog1.map((ele : ChatBody) => ele.messageBody))).toStrictEqual(JSON.stringify(msgs.filter(ele => ele[0] == playerId1 || ele[0] == playerId2).map(ele => ele[1])));
    expect(JSON.stringify(msgLog1.map((ele : ChatBody) => ele.playerId))).toStrictEqual(JSON.stringify(msgs.filter(ele => ele[0] == playerId1 || ele[0] == playerId2).map(ele => ele[0])));

    const msgLog2 = requestMethod('get', `/v1/player/${playerId3}/chat`, {}, {}).messages; // msglog of game 2
    expect(() => msgLog2).not.toThrow(HTTPError[400]);
    expect(JSON.stringify(msgLog2.map((ele : ChatBody) => ele.messageBody))).toStrictEqual(JSON.stringify(msgs.filter(ele => ele[0] == playerId3 || ele[0] == playerId4).map(ele => ele[1])));
    expect(JSON.stringify(msgLog2.map((ele : ChatBody) => ele.playerId))).toStrictEqual(JSON.stringify(msgs.filter(ele => ele[0] == playerId3 || ele[0] == playerId4).map(ele => ele[0])));
  });
});
