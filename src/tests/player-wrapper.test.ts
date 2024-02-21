
import { getMethod, postMethod, putMethod, deleteMethod, requestMethod, sleepSync } from './test-helper';
import HTTPError from 'http-errors';
import request from 'sync-request';
const OK = 200;
const INPUT_ERROR = 400;
const TOKEN_STRUCTURE_ERROR = 401;
const TOKEN_SESSION_ERROR = 403;
const ERROR_STRING = { error: expect.any(String) };
const ANY_STRING = expect.any(String);
const ANY_NUMBER = expect.any(Number);
const LEBRONJAMES_JPG = 'https://clipart-library.com/img/2046271.jpg';
import { FINISH_COUNTDOWN } from '../helper';

beforeEach(() => {
  requestMethod('delete', '/v1/clear', {}, {});
});

describe('HTTP sessionStart', () => {
  let token1:any;
  let token2:any;
  let quizId1:any;
  let quizId2:any;
  let questionId1:any;
  let questionId2:any;
  let questionId3:any;

  beforeEach(() => {
    requestMethod('delete', '/v1/clear', {}, {});
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

    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'Quiz One', description: 'first user quiz' }, { token: token1 }).quizId;
    quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Two Quiz Two', description: 'second user quiz' }, { token: token2 }).quizId;

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
        token: token1,
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
  });

  // Token tests
  test('401 403', () => {
    expect(() => requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: '0' })).toThrow(HTTPError[401]);
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });
    expect(() => requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: token1 })).toThrow(HTTPError[403]);
  });

  // Error tests
  test('Quiz ID does not refer to a valid quiz', () => {
    expect(() => requestMethod('post', `/v1/admin/quiz/${quizId1 + 1}/session/start`, { autoStartNum: 3 }, { token: token1 })).toThrow(HTTPError[400]);
    expect(() => requestMethod('post', `/v1/admin/quiz/${quizId2}/session/start`, { autoStartNum: 3 }, { token: token1 })).toThrow(HTTPError[400]);
    expect(() => requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 51 }, { token: token1 })).toThrow(HTTPError[400]);
    expect(() => requestMethod('post', `/v1/admin/quiz/${quizId2}/session/start`, { autoStartNum: 3 }, { token: token2 })).toThrow(HTTPError[400]);

    // start 10 sessions
    for (let i = 0; i < 10; i++) {
      expect(() => requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 1 }, { token: token1 })).not.toThrow(HTTPError[400]);
    }

    expect(() => requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: token1 })).toThrow(HTTPError[400]);
  });

  test('>=10 sessions exist, but some are ended', () => {
    const sessionIds: number[] = [];
    // start 10 sessions
    for (let i = 0; i < 10; i++) {
      expect(() => sessionIds.push(requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 1 }, { token: token1 }).sessionId)).not.toThrow(HTTPError[400]);
    }

    console.log(`sessionIds = ${JSON.stringify(sessionIds)}`);
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionIds[0]}`, { token: token1, action: 'END' }, { token: token1 })).not.toThrow(HTTPError[400]);
    // now theres 9

    expect(() => requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 1 }, { token: token1 })).not.toThrow(HTTPError[400]);
    // now theres 10

    expect(() => requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 1 }, { token: token1 })).toThrow(HTTPError[400]);
    // this one will bring it to 11 (error)
  });

  test('Successfully starting a session', () => {
    let sessionId = -1;
    expect(() => sessionId = (requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 1 }, { token: token1 })).sessionId).not.toThrow(HTTPError[400]);

    sleepSync(FINISH_COUNTDOWN);
    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId}`, {}, { token: token1 }).state;
    expect(sessionState).toStrictEqual('LOBBY');
  });

  test('testing autoStartNum doesnt start if =0', () => {
    const sessionId3 = requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 0 }, { token: token1 }).sessionId;
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId3}`, {}, { token: token1 }).state).toStrictEqual('LOBBY');

    expect(() => requestMethod('post', '/v1/player/join', { sessionId: sessionId3, name: 'valid123' }, {})).not.toThrow(HTTPError[400]);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId3}`, {}, { token: token1 }).state).toStrictEqual('LOBBY');

    expect(() => requestMethod('post', '/v1/player/join', { sessionId: sessionId3, name: 'fdasj351' }, {})).not.toThrow(HTTPError[400]);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId3}`, {}, { token: token1 }).state).toStrictEqual('LOBBY');

    expect(() => requestMethod('post', '/v1/player/join', { sessionId: sessionId3, name: 'poasd513' }, {})).not.toThrow(HTTPError[400]);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId3}`, {}, { token: token1 }).state).toStrictEqual('LOBBY');
  });

  test('testing autoStartNum starts when reaching a number of ppl', () => {
    const sessionId3 = requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: token1 }).sessionId;
    expect(() => requestMethod('post', '/v1/player/join', { sessionId: sessionId3, name: 'valid123' }, {})).not.toThrow(HTTPError[400]);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId3}`, {}, { token: token1 }).state).toStrictEqual('LOBBY');

    expect(() => requestMethod('post', '/v1/player/join', { sessionId: sessionId3, name: 'fdasj351' }, {})).not.toThrow(HTTPError[400]);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId3}`, {}, { token: token1 }).state).toStrictEqual('LOBBY');

    expect(() => requestMethod('post', '/v1/player/join', { sessionId: sessionId3, name: 'poasd513' }, {})).not.toThrow(HTTPError[400]);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId3}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_COUNTDOWN');
  });
});

describe('HTTP updateSessionState', () => {
  let token1:any;
  let token2:any;
  let quizId1:any;
  let quizId2:any;
  let questionId1:any;
  let questionId2:any;
  let questionId3:any;
  let sessionId1:any;
  let sessionId2:any;

  let playerId1: number;
  let playerId2: number;

  // IMPORTANT -
  // ALL QUESTION DURATIONS ARE SET TO 2 SECONDS
  beforeEach(() => {
    requestMethod('delete', '/v1/clear', {}, {});
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

    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'Quiz One', description: 'first user quiz' }, { token: token1 }).quizId;
    quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Two Quiz Two', description: 'second user quiz' }, { token: token2 }).quizId;

    // quizId1 has 3 questions, owned by token1
    // quizId2 has 0 questions, owned by token2

    // Adding a first question
    questionId1 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {
        questionBody: {
          question: 'Who is the Monarch of England?',

          duration: 1,
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
          duration: 1,
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
        token: token1,
        questionBody: {
          question: 'yo wassup',
          duration: 1,
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
    expect(sessionId1 = requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: token1 }).sessionId).not.toStrictEqual(ERROR_STRING);
    expect(sessionId2 = requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: token1 }).sessionId).not.toStrictEqual(ERROR_STRING);
  });

  test('coverage 1', () => {
    playerId1 = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'valid123' }, {});
    playerId2 = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'beans693' }, {});

    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('LOBBY');
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'fdasfdsa' }, { token: token1 })).toThrow(HTTPError[400]);

    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 });
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_COUNTDOWN');
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'END' }, { token: token1 })).not.toThrow(HTTPError[400]);
  });

  test('coverage 2', () => {
    playerId1 = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'valid123' }, {});
    playerId2 = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'beans693' }, {});

    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('LOBBY');

    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 });
    sleepSync(FINISH_COUNTDOWN + 30);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_OPEN');
    sleepSync(1000 + 30);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_CLOSE');
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 });
    sleepSync(FINISH_COUNTDOWN + 30);
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'END' }, { token: token1 })).not.toThrow(HTTPError[400]);
    // using enum on end.
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 })).toThrow(HTTPError[400]);
  });

  // Token tests
  test('401 403', () => {
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: '0' })).toThrow(HTTPError[401]);
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 })).toThrow(HTTPError[403]);
  });

  // THIS ONE
  test('successfully get session status QUESTION_CLOSE after going through 1 loop', () => {
    // changes state from lobby to question_countdown then to question_open finally to question_close
    (requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 }));
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_COUNTDOWN');

    sleepSync(FINISH_COUNTDOWN);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_OPEN');
    sleepSync(1000);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_CLOSE');

    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 });
    sleepSync(1000);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_CLOSE');
  });

  // Error tests
  test('err tests', () => {
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1 + 1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 })).toThrow(HTTPError[400]);

    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId2}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 })).toThrow(HTTPError[400]);

    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1 + 1000}`, { action: 'NEXT_QUESTION' }, { token: token1 })).toThrow(HTTPError[400]);

    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'OSAS' }, { token: token1 })).toThrow(HTTPError[400]);

    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_ANSWER' }, { token: token1 })).toThrow(HTTPError[400]);
  });

  // We don't have the route to check session state yet
  test('successfully get session status QUESTION_CLOSE', () => {
    // changes state from lobby to question_countdown then to question_open finally to question_close
    (requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 }));
    sleepSync(1000);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_CLOSE');
  });

  // We don't have the route to check session state yet
  test('successfully get session status to go to  QUESTION_OPEN -> ANSWER_SHOW', () => {
    // changes state from lobby to question_countdown then to question_open finally to question_close
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 });
    sleepSync(FINISH_COUNTDOWN);
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_ANSWER' }, { token: token1 });
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('ANSWER_SHOW');
  });

  // We don't have the route to check session state yet
  test('successfully get session status to go to  QUESTION_OPEN -> ANSWER_SHOW -> END', () => {
    // changes state from lobby to question_countdown then to question_open finally to question_close
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 });
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_COUNTDOWN');
    sleepSync(FINISH_COUNTDOWN);
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'END' }, { token: token1 });
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('END');
  });

  // ?

  // We don't have the route to check session state yet
  test('successfully get session status FINAL_RESULTS after going through 1 entire loop', () => {
    // changes state from lobby to question_countdown then to question_open finally to question_close
    (requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 }));
    sleepSync(1000);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_CLOSE');
    (requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_FINAL_RESULTS' }, { token: token1 }));
    sleepSync(1000);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('FINAL_RESULTS');
  });

  // We don't have the route to check session state yet
  test('successfully get session status END after going through 1 entire loop', () => {
    // changes state from lobby to question_countdown then to question_open finally to question_close
    (requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 }));
    sleepSync(FINISH_COUNTDOWN);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_OPEN');
    sleepSync(1000);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_CLOSE');

    (requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_FINAL_RESULTS' }, { token: token1 }));
    sleepSync(FINISH_COUNTDOWN);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('FINAL_RESULTS');
    (requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'END' }, { token: token1 }));
    sleepSync(FINISH_COUNTDOWN);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('END');
  });

  // THHIS ONE
  test('successfully get session status END after going through 1 entire loop Q_C TO ANS TO QC TO END', () => {
    // changes state from lobby to question_countdown then to question_open finally to question_close
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('LOBBY');
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 });
    sleepSync(FINISH_COUNTDOWN);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_OPEN');
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_ANSWER' }, { token: token1 });
    sleepSync(FINISH_COUNTDOWN);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('ANSWER_SHOW');
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 });
    // sleepSync(0);
    sleepSync(1000);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_CLOSE');
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_FINAL_RESULTS' }, { token: token1 });
    sleepSync(FINISH_COUNTDOWN);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('FINAL_RESULTS');
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'END' }, { token: token1 });
    sleepSync(FINISH_COUNTDOWN);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('END');
  });
});

describe('HTTP getSessionStatus', () => {
  let token1:any;
  let token2:any;
  let quizId1:any;
  let quizId2:any;
  let questionId1:any;
  let questionId2:any;
  let questionId3:any;
  let sessionId1:any;
  let sessionId2:any;
  let player1: any;

  beforeEach(() => {
    requestMethod('delete', '/v1/clear', {}, {});
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

    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'Quiz One', description: 'first user quiz' }, { token: token1 }).quizId;
    quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Two Quiz Two', description: 'second user quiz' }, { token: token2 }).quizId;

    // quizId1 has 3 questions, owned by token1
    // quizId2 has 0 questions, owned by token2

    // Adding a first question
    questionId1 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {
        questionBody: {
          question: 'Who is the Monarch of England?',

          duration: 1,
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
          duration: 1,
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
        token: token1,
        questionBody: {
          question: 'yo wassup',
          duration: 1,
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

    // adds a player session
    player1 = expect(() => requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'valid123' }, {})).not.toThrow(HTTPError[400]);
  });

  // Token tests
  test('401 403', () => {
    expect(() => requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: '0' })).toThrow(HTTPError[401]);

    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });
    expect(() => requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 })).toThrow(HTTPError[403]);
  });

  // Error tests
  test('Quiz ID does not refer to a valid quiz', () => {
    // expect(()=> requestMethod('post',`/v1/admin/quiz/${quizId1+1}/session/start`, {autoStartNum : 3},  { token: token1})).toThrow(HTTPError[400]);
    expect(() => requestMethod('get', `/v1/admin/quiz/${quizId1 + 1}/session/${sessionId1}`, {}, { token: token1 })).toThrow(HTTPError[400]);

    expect(() => requestMethod('get', `/v1/admin/quiz/${quizId2}/session/${sessionId1}`, {}, { token: token1 })).toThrow(HTTPError[400]);

    expect(() => requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1 + 1}`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });

  // We don't have the route to check session state yet
  test('successfully get session status QUESTION_CLOSE', () => {
    // changes state from lobby to question_countdown then to question_open finally to question_close
    (requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 }));
    sleepSync(1000);
    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state;
    expect(sessionState).toStrictEqual('QUESTION_CLOSE');
  });

  test('Successfully get session status', () => {
    requestMethod('delete', '/v1/clear', {}, {});
    token1 = requestMethod('post', '/v1/admin/auth/register',
      {
        email: 'jack.rao@unsw.edu.au',
        password: 'polarbear135',
        nameFirst: 'Jack',
        nameLast: 'Rao'
      }).token;
    quizId1 = requestMethod('post', '/v1/admin/quiz', { token: token1, name: 'Quiz One', description: 'first user quiz' }).quizId;
    // Adding a first question
    questionId1 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {

        questionBody: {
          questionId: questionId1,
          question: 'Who is the Monarch of England?',
          duration: 4,
          thumbnailUrl: LEBRONJAMES_JPG,
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
          ]
        }
      }, { token: token1 }).questionId;

    sessionId1 = requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: token1 }).sessionId;
    player1 = expect(() => requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'valid123' }, {})).not.toThrow(HTTPError[400]);

    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 });
    expect(sessionState).toStrictEqual({
      state: 'LOBBY',
      atQuestion: ANY_NUMBER,
      players: [
        'valid123'
      ],
      metadata: {
        quizId: ANY_NUMBER,
        name: 'Quiz One',
        timeCreated: ANY_NUMBER,
        timeLastEdited: ANY_NUMBER,
        description: 'first user quiz',
        numQuestions: ANY_NUMBER,
        questions: [
          {
            questionId: ANY_NUMBER,
            question: 'Who is the Monarch of England?',
            duration: 4,
            thumbnailUrl: ANY_STRING,
            points: 5,
            answers: [
              {
                answer: 'Will',
                answerId: ANY_NUMBER,
                colour: ANY_STRING,
                correct: true
              },
              {
                answer: 'samson',
                answerId: ANY_NUMBER,
                colour: ANY_STRING,
                correct: false
              },
              {
                answer: 'Ur mum',
                answerId: ANY_NUMBER,
                colour: ANY_STRING,
                correct: false
              }
            ]
          }
        ],
        duration: 4,
        thumbnailUrl: ANY_STRING
      }
    });
  });
});

describe('HTTP playerJoin', () => {
  let token1:any;
  let token2:any;
  let quizId1:any;
  let quizId2:any;
  let questionId1:any;
  let questionId2:any;
  let questionId3:any;
  let sessionId1:any;
  let sessionId2:any;
  beforeEach(() => {
    requestMethod('delete', '/v1/clear', {}, {});
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

    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'Quiz One', description: 'first user quiz' }, { token: token1 }).quizId;
    quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Two Quiz Two', description: 'second user quiz' }, { token: token2 }).quizId;

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
        token: token1,
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
  });

  test('Name of user entered is not unique in this session', () => {
    expect(() => requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'valid123' }, {})).not.toThrow(HTTPError[400]);
    expect(() => requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'valid123' }, {})).toThrow(HTTPError[400]);
  });

  test('Session not in lobby state', () => {
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { token: token1.toString(), action: 'NEXT_QUESTION' }, { token: token1 })).not.toThrow(HTTPError[400]);
    expect(() => requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'valid123' }, {})).toThrow(HTTPError[400]);
  });

  test('1 guy Successfully joining the game', () => {
    expect(() => requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'valid123' }, {})).not.toThrow(HTTPError[400]);
  });

  test('name given is empty string, set to random and satisfies [5c3d](unique)', () => {
    let playerId = -1;
    expect(() => playerId = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: '' }, {})).not.toThrow(HTTPError[400]);
    // can't really check if it satisfies the format, without implementing chat, and checking name in chat logs after this guy sends a message
  });
});

describe('HTTP playerStatus', () => {
  let token1:any;
  let token2:any;
  let quizId1:any;
  let quizId2:any;
  let questionId1:any;
  let questionId2:any;
  let questionId3:any;
  let sessionId1:any;
  let sessionId2:any;
  beforeEach(() => {
    requestMethod('delete', '/v1/clear', {}, {});
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

    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'Quiz One', description: 'first user quiz' }, { token: token1 }).quizId;
    quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Two Quiz Two', description: 'second user quiz' }, { token: token2 }).quizId;

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
        token: token1,
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
  });

  // success case
  test('Player joins quiz session -> valid playerId', () => {
    const playerId = 0;
    expect(() => requestMethod('get', `/v1/player/${playerId}`, {}, {})).toThrow(HTTPError[400]);
    const playerId1 = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'valid123' }, {}).playerId;
    expect(requestMethod('get', `/v1/player/${playerId1}`, {}, {})).toStrictEqual({
      state: 'LOBBY',
      numQuestions: ANY_NUMBER,
      atQuestion: ANY_NUMBER,
    });
  });
});

describe('HTTP updateThumbnail', () => {
  let token1:any;
  let token2:any;
  let quizId1:any;
  let quizId2:any;
  let questionId1:any;
  let questionId2:any;
  let questionId3:any;

  const LEBRONJAMES_PNG = 'https://w7.pngwing.com/pngs/173/86/png-transparent-lebron-james-cleveland-cavaliers-miami-heat-2017-18-nba-season-los-angeles-lakers-lebron-james-jersey-arm-sports.png';
  const LEBRONJAMES_GIF = 'https://media.tenor.com/0qx7C3sRmfAAAAAC/lebron-james-lebron-lakers.gif';
  const LEBRONJAMES_MP4 = 'https://videos.ctfassets.net/8pi8z3xqpwj9/2Gqrw26hlDZzqmcUX3VQqA/246b080bb899b2f59541b82244fce018/play_TASC_Steph_C_Handles_2015_03_08_5_the_anthology_steph_curry_anthology_capture_Animated_1080_1080_Texture__1_.mp4';
  const LEBRONJAMES_WEBM = 'https://is2.4chan.org/a/1690765228868975.webm';
  const IMG_DOWNLOAD_TIMEOUT = 20000; // 20s
  beforeEach(() => {
    requestMethod('delete', '/v1/clear', {}, {});
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

    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'Quiz One', description: 'first user quiz' }, { token: token1 }).quizId;
    quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Two Quiz Two', description: 'second user quiz' }, { token: token2 }).quizId;

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
        token: token1,
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
  });

  // Token tests
  test('401 403', () => {
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/thumbnail`, { imgUrl: LEBRONJAMES_JPG }, { token: '0' })).toThrow(HTTPError[401]);

    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/thumbnail`, { imgUrl: LEBRONJAMES_JPG }, { token: token1 })).toThrow(HTTPError[403]);
  });

  // Err tests
  test('errtests', () => {
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1 + 1}/thumbnail`, { imgUrl: LEBRONJAMES_JPG }, { token: token1 })).toThrow(HTTPError[400]);

    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId2}/thumbnail`, { imgUrl: LEBRONJAMES_JPG }, { token: token1 })).toThrow(HTTPError[400]);

    const urls = [
      'dsaffsd', 'png', '.png', 'fdasfdsa.png', 'fjsdaijo.jpg', 'jpg', '.jpg', '4932932',
      'https://www.news.com.au/travel/have-snow-fear-these-are-australia8217s-steepest-ski-runs/news-story/a18510608ebda5c3fb4c722fa854022d',
      'https://my.unsw.edu.au/active/studentClassEnrol/timetable.xml', '', LEBRONJAMES_GIF, LEBRONJAMES_MP4, LEBRONJAMES_WEBM
    ];

    for (const url of urls) {
      expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/thumbnail`, { imgUrl: url }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT)).toThrow(HTTPError[400]);
    }
  });

  // success
  test('successfully updating url (jpg)', () => {
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/thumbnail`, { imgUrl: 'https://cdn.images.express.co.uk/img/dynamic/4/590x/945242_1.jpg?r=1686998680160' }, { token: token1 })).not.toThrow(HTTPError[400]);

    // this just for coverage
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/thumbnail`, { imgUrl: LEBRONJAMES_JPG }, { token: token1 })).not.toThrow(HTTPError[400]);

    // Adding a fourth question (v2 question)
    const ret = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {
        questionBody: {
          question: 'hi guys',
          duration: 2,
          points: 5,
          answers: [
            {
              answer: '321g23g',
              correct: false
            },
            {
              answer: '2g33g223g',
              correct: false
            },
            {
              answer: 'agaga3g23g2',
              correct: true
            }
          ],
          thumbnailUrl: LEBRONJAMES_PNG
        }
      }
      , { token: token1 }
    );
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {
        questionBody: {
          question: 'hi guys',
          duration: 2,
          points: 5,
          answers: [
            {
              answer: '321g23g',
              correct: false
            },
            {
              answer: '2g33g223g',
              correct: false
            },
            {
              answer: 'agaga3g23g2',
              correct: true
            }
          ],
          thumbnailUrl: LEBRONJAMES_PNG
        }
      }
      , { token: token1 }
    )).not.toThrow(HTTPError[400]);
    const questionId4 = ret.questionId;

    const res = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });
    expect(res.thumbnailUrl).toStrictEqual(ANY_STRING);
  });

  test('successfully updating url (png)', () => {
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/thumbnail`, { imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Middle_Eastern_Cold_War_map_%28Iran-Saudi_proxy%29.png/640px-Middle_Eastern_Cold_War_map_%28Iran-Saudi_proxy%29.png' }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT)).not.toThrow(HTTPError[400]);

    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId1}/thumbnail`, { imgUrl: LEBRONJAMES_PNG }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT)).not.toThrow(HTTPError[400]);
    // Adding a fourth question (v2 question)
    const ret = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {
        questionBody: {
          question: 'hi guys',
          duration: 2,
          points: 5,
          answers: [
            {
              answer: '321g23g',
              correct: false
            },
            {
              answer: '2g33g223g',
              correct: false
            },
            {
              answer: 'agaga3g23g2',
              correct: true
            }
          ],
          thumbnailUrl: LEBRONJAMES_PNG
        }
      }
      , { token: token1 }
    );

    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {
        questionBody: {
          question: 'hi guys',
          duration: 2,
          points: 5,
          answers: [
            {
              answer: '321g23g',
              correct: false
            },
            {
              answer: '2g33g223g',
              correct: false
            },
            {
              answer: 'agaga3g23g2',
              correct: true
            }
          ],
          thumbnailUrl: LEBRONJAMES_PNG
        }
      }
      , { token: token1 }
    )).not.toThrow(HTTPError[400]);
    const questionId4 = ret.questionId;

    const res = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });
    expect(res.thumbnailUrl).toStrictEqual(ANY_STRING);
  });
});

describe('HTTP test for sessionPlayerQuestionInfo', () => {
  let token1:any;
  let token2:any;
  let quizId1:any;
  let quizId2:any;
  let questionId1:any;
  let questionId2:any;
  let questionId3:any;
  let sessionId1:any;
  let sessionId2:any;
  let playerId1: number;
  let playerId2: number;
  const testNum = 0;
  beforeEach(() => {
    requestMethod('delete', '/v1/clear', {}, {});
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

    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'Quiz One', description: 'first user quiz' }, { token: token1 }).quizId;
    quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Two Quiz Two', description: 'second user quiz' }, { token: token2 }).quizId;

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
        token: token1,
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
    playerId1 = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'valid123' }, {}).playerId;
    playerId2 = requestMethod('post', '/v1/player/join', { sessionId: sessionId2, name: 'valid321' }, {}).playerId;
  });

  // If player ID does not exist
  test('If player ID does not exist - 400', () => {
    expect(() => requestMethod('get', `/v1/player/${playerId1 - 9999}/question/${1}`, {}, { token: token1 })).toThrow(HTTPError[400]);
    expect(() => requestMethod('get', `/v1/player/${playerId2 - 9999}/question/${1}`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });
  // If question position is not valid for the session this player is in

  test('If question position is not valid for the session this player is in - 400', () => {
    expect(requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 })).toStrictEqual({});
    sleepSync(FINISH_COUNTDOWN + 50);
    expect(requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_ANSWER' }, { token: token1 })).toStrictEqual({});
    expect(() => requestMethod('get', `/v1/player/${playerId1}/question/${9000}`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });

  // session is not currently on this question
  test('session is not currently on this question - 400', () => {
    expect(requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 })).toStrictEqual({});
    sleepSync(FINISH_COUNTDOWN);

    expect(requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_ANSWER' }, { token: token1 })).toStrictEqual({});

    expect(requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 })).toStrictEqual({});
    sleepSync(FINISH_COUNTDOWN);

    expect(() => requestMethod('get', `/v1/player/${playerId1}/question/${1}`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });

  // Session is in LOBBY or END state
  test('session is in lobby state - 400', () => {
    expect(() => requestMethod('get', `/v1/player/${playerId1}/question/${1}`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });
  test('session is in end state - 400', () => {
    expect(requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 })).toStrictEqual({});
    sleepSync(FINISH_COUNTDOWN);
    expect(requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'END' }, { token: token1 })).toStrictEqual({});
    expect(() => requestMethod('get', `/v1/player/${playerId1}/question/${0}`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });
  test('successfully retrieves q info for player', () => {
    expect(requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 })).toStrictEqual({});

    sleepSync(FINISH_COUNTDOWN);
    expect(requestMethod('get', `/v1/player/${playerId1}/question/${1}`, {}, {})).toStrictEqual({
      questionId: questionId1,
      question: 'Who is the Monarch of England?',
      duration: 4,
      thumbnailUrl: ANY_STRING,
      points: 5,
      answers: [{
        answerId: expect.any(Number),
        answer: 'Will',
        colour: expect.any(String),
      },
      {
        answerId: expect.any(Number),
        answer: 'samson',
        colour: expect.any(String),
      },
      {
        answerId: expect.any(Number),
        answer: 'Ur mum',
        colour: expect.any(String),
      }]
    });

    expect(requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_ANSWER' }, { token: token1 })).toStrictEqual({});
    expect(requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 })).toStrictEqual({});
    sleepSync(FINISH_COUNTDOWN);
    expect(requestMethod('get', `/v1/player/${playerId1}/question/${2}`, {}, { token: token1 })).toStrictEqual({
      questionId: ANY_NUMBER,
      question: 'whats obamas last name',
      duration: 15,
      thumbnailUrl:
            ANY_STRING,
      points: 6,
      answers: [
        {
          answerId: ANY_NUMBER,
          answer:	'asdfsa',
          colour:	ANY_STRING
        },
        {
          answerId: ANY_NUMBER,
          answer:	'dsaasdf',
          colour:	ANY_STRING
        },
        {
          answerId: ANY_NUMBER,
          answer:	'wefaefwa',
          colour:	ANY_STRING
        }

      ]

    });
  });
});

// -------------- HTTP wrapper tests for sessionPlayerAnswerSubmit ------------------
describe('HTTP sessionPlayerAnswerSubmit', () => {
  let token1:any;
  let token2:any;
  let quizId1:any;
  let quizId2:any;
  let questionId1:any;
  let questionId2:any;
  let questionId3:any;
  let sessionId1:any;
  let sessionId2:any;
  let playerId1: number;
  let answerId1: number;
  beforeEach(() => {
    requestMethod('delete', '/v1/clear', {}, {});
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

    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'Quiz One', description: 'first user quiz' }, { token: token1 }).quizId;
    quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Two Quiz Two', description: 'second user quiz' }, { token: token2 }).quizId;

    // quizId1 has 3 questions, owned by token1
    // quizId2 has 0 questions, owned by token2

    // Adding a first question
    questionId1 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {
        questionBody: {
          question: 'Who is the Monarch of England?',

          duration: 1,
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
          duration: 1,
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
        token: token1,
        questionBody: {
          question: 'yo wassup',
          duration: 1,
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

    // Allowing player to join
    playerId1 = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'valid123' }, {}).playerId;

    // Getting answer ID of first answer of first question of quiz 1 (is correct)
    const resOfAdminQuizInfo = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });
    answerId1 = resOfAdminQuizInfo.questions[0].answers[0].answerId;

    // Call update status to start questions
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 });

    // Delay to keep in QUESTION_OPEN state
 		sleepSync(FINISH_COUNTDOWN);
  });

  // Success 200, player submits 1 answer to currently active question
  test('successful submission of 1 answer to active question', () => {
    // Checking session is still in QUESTION_OPEN state
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_OPEN');

    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    // Submit answer 1
    expect(() => requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId1] }, {})).not.toThrow(HTTPError[400]);

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(1000);
    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state;
    expect(sessionState).toStrictEqual('QUESTION_CLOSE');
  });

  // Error 400, player id does not exist
  test('player id does not exist', () => {
    // Checking session is still in QUESTION_OPEN state
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_OPEN');

    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    expect(() => requestMethod('put', `/v1/player/${0}/question/${currentPosition}/answer`, { answerIds: [answerId1] }, {})).toThrow(HTTPError[400]);

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(1000 + 100);
    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state;
    expect(sessionState).toStrictEqual('QUESTION_CLOSE');
  });

  // Error 400, question position is not valid for the session player is in
  test('question position is not valid for the session player is in', () => {
    // Checking session is still in QUESTION_OPEN state
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_OPEN');

    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    expect(() => requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition - 99999}/answer`, { answerIds: [answerId1] }, {})).toThrow(HTTPError[400]);

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(1000 + 100);
    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state;
    expect(sessionState).toStrictEqual('QUESTION_CLOSE');
  });

  // Error 400, session is not in QUESTION_OPEN state
  test('session is not in QUESTION_OPEN state', () => {
    // Checking session is still in QUESTION_OPEN state
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_OPEN');

    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    // Move to ANSWER_SHOW state
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_ANSWER' }, { token: token1 });

    expect(() => requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId1] }, {})).toThrow(HTTPError[400]);
  });

  // Error 400, session is not yet up to this question
  test('session is not yet up to this question', () => {
    // Checking session is still in QUESTION_OPEN state
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_OPEN');

    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    expect(() => requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition + 1}/answer`, { answerIds: [answerId1] }, {})).toThrow(HTTPError[400]);

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(1000 + 100);
    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state;
    expect(sessionState).toStrictEqual('QUESTION_CLOSE');
  });

  // Error 400, answer ids are not valid for this particular question
  test('answer ids are not valid for this particular question', () => {
    // Checking session is still in QUESTION_OPEN state
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_OPEN');

    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    expect(() => requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId1 - 99999] }, {})).toThrow(HTTPError[400]);

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(1000 + 100);
    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state;
    expect(sessionState).toStrictEqual('QUESTION_CLOSE');
  });

  // Error 400, there are duplicate answer ids provided
  test('there are duplicate answer ids provided', () => {
    // Checking session is still in QUESTION_OPEN state
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_OPEN');

    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    expect(() => requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId1, answerId1] }, {})).toThrow(HTTPError[400]);

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(1000 + 100);
    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state;
    expect(sessionState).toStrictEqual('QUESTION_CLOSE');
  });

  // Error 400, less than 1 answer id was submitted
  test('less than 1 answer id was submitted', () => {
    // Checking session is still in QUESTION_OPEN state
    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state).toStrictEqual('QUESTION_OPEN');

    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    expect(() => requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [] }, {})).toThrow(HTTPError[400]);

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(1000 + 100);
    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state;
    expect(sessionState).toStrictEqual('QUESTION_CLOSE');
  });
});

// -------------- HTTP wrapper tests for sessionPlayerQuestionResults ---------------
describe('HTTP sessionPlayerQuestionResults', () => {
  let token1:any;
  let token2:any;
  let quizId1:any;
  let quizId2:any;
  let questionId1:any;
  let questionId2:any;
  let questionId3:any;
  let sessionId1:any;
  let sessionId2:any;
  let playerId1: number;
  let answerId1: number;
  let answerId2: number;

  beforeEach(() => {
    requestMethod('delete', '/v1/clear', {}, {});
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

    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'Quiz One', description: 'first user quiz' }, { token: token1 }).quizId;
    quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Two Quiz Two', description: 'second user quiz' }, { token: token2 }).quizId;

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

              correct: true
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
        token: token1,
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

    // Allowing player to join
    playerId1 = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'valid123' }, {}).playerId;

    // Getting answer ID of first answer of first question of quiz 1 (is correct)
    const resOfAdminQuizInfo = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });
    answerId1 = resOfAdminQuizInfo.questions[0].answers[0].answerId;
    answerId2 = resOfAdminQuizInfo.questions[0].answers[1].answerId;

    // Call update status to start questions
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 });

    // Delay to keep in QUESTION_OPEN state
 		sleepSync(FINISH_COUNTDOWN);
  });

  // Success 200, no answer submission
  test('successful in getting final results (no answer submission)', () => {
    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(FINISH_COUNTDOWN);

    // Call update status to SHOW_ANSWER status
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_ANSWER' }, { token: token1 });

    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    // Make sure session is in ANSWER_SHOW state
    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state;
    expect(sessionState).toStrictEqual('ANSWER_SHOW');

    const res = requestMethod('get', `/v1/player/${playerId1}/question/${currentPosition}/results`, {}, {});

    expect(() => res).not.toThrow(HTTPError[400]);
    expect(res).toStrictEqual({
      questionId: questionId1,
      questionCorrectBreakdown: [
        {
          answerId: answerId1,
          playersCorrect: [
          ]
        },
        {
          answerId: answerId2,
          playersCorrect: [
          ]
        },
      ],
      averageAnswerTime: expect.any(Number),
      percentCorrect: 0,
    });
  });

  // Success 200, successful in getting question results (2 correct answers)
  test('successful in getting question results (2 correct answers)', () => {
    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    // Submit answer 1 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId1] }, {});
    // Submit answer 2 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId2] }, {});

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(FINISH_COUNTDOWN);

    // Call update status to SHOW_ANSWER status
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_ANSWER' }, { token: token1 });

    // Make sure session is in ANSWER_SHOW state
    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state;
    expect(sessionState).toStrictEqual('ANSWER_SHOW');

    const res = requestMethod('get', `/v1/player/${playerId1}/question/${currentPosition}/results`, {}, {});

    expect(() => res).not.toThrow(HTTPError[400]);
    expect(res).toStrictEqual({
      questionId: questionId1,
      questionCorrectBreakdown: [
        {
          answerId: answerId1,
          playersCorrect: [
            'valid123',
          ]
        },
        {
          answerId: answerId2,
          playersCorrect: [
            'valid123',
          ]
        },
      ],
      averageAnswerTime: expect.any(Number),
      percentCorrect: 100,
    });
  });

  // Error 400, player id does not exist
  test('player id does not exist', () => {
    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    // Submit answer 1 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId1] }, {});
    // Submit answer 2 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId2] }, {});

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(FINISH_COUNTDOWN);

    // Call update status to SHOW_ANSWER status
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_ANSWER' }, { token: token1 });

    expect(() => requestMethod('get', `/v1/player/${0}/question/${currentPosition}/results`, {}, {})).toThrow(HTTPError[400]);
  });

  // Error 400, question position is not valid for the session player is in
  test('question position is not valid for the session player is in', () => {
    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    // Submit answer 1 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId1] }, {});
    // Submit answer 2 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId2] }, {});

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(FINISH_COUNTDOWN);

    // Call update status to SHOW_ANSWER status
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_ANSWER' }, { token: token1 });

    expect(() => requestMethod('get', `/v1/player/${playerId1}/question/${currentPosition - 99999}/results`, {}, {})).toThrow(HTTPError[400]);
  });

  // Error 400, session is not in ANSWER_SHOW state
  test('session is not in ANSWER_SHOW state', () => {
    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    // Submit answer 1 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId1] }, {});
    // Submit answer 2 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId2] }, {});

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(FINISH_COUNTDOWN);

    // Call update status to SHOW_ANSWER status
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_ANSWER' }, { token: token1 });

    // Move to FINAL_RESULTS state
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_FINAL_RESULTS' }, { token: token1 });

    expect(() => requestMethod('get', `/v1/player/${playerId1}/question/${currentPosition}/results`, {}, {})).toThrow(HTTPError[400]);
  });

  // Error 400, session is not yet up to this question
  test('session is not yet up to this question', () => {
    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    // Submit answer 1 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId1] }, {});
    // Submit answer 2 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId2] }, {});

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(FINISH_COUNTDOWN);

    // Call update status to SHOW_ANSWER status
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_ANSWER' }, { token: token1 });

    expect(() => requestMethod('get', `/v1/player/${playerId1}/question/${currentPosition + 1}/results`, {}, {})).toThrow(HTTPError[400]);
  });
});

// -------------- HTTP wrapper tests for sessionFinalResults ------------------
describe('HTTP sessionFinalResults', () => {
  let token1:any;
  let token2:any;
  let quizId1:any;
  let quizId2:any;
  let questionId1:any;
  let questionId2:any;
  let questionId3:any;
  let sessionId1:any;
  let sessionId2:any;
  let playerId1: number;
  let answerId1: number;
  let answerId2: number;
  beforeEach(() => {
    requestMethod('delete', '/v1/clear', {}, {});
    token1 = requestMethod('post', '/v1/admin/auth/register',
      {
        email: 'jack.rao@unsw.edu.au',
        password: 'polarbear135',
        nameFirst: 'Jack',
        nameLast: 'Rao'
      }).token;

    quizId1 = requestMethod('post', '/v1/admin/quiz', { token: token1, name: 'Quiz One', description: 'first user quiz' }).quizId;

    // Adding a first question
    questionId1 = requestMethod('post', `/v1/admin/quiz/${quizId1}/question`,
      {

        token: token1,
        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 1,
          thumbnailUrl: 'http://google.com/some/image/path.jpg',
          points: 5,
          answers: [
            {
              answer: 'Will',
              correct: true
            },
            {
              answer: 'samson',
              correct: true
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]
        }
      }).questionId;

    // Start our sessions (both of these are for quiz1, owned by token1)
    sessionId1 = requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: token1 }).sessionId;

    // Allowing player to join
    playerId1 = requestMethod('post', '/v1/player/join', { sessionId: sessionId1, name: 'valid123' }, {}).playerId;

    // Getting answer ID of first answer of first question of quiz 1 (is correct)
    const resOfAdminQuizInfo = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });
    answerId1 = resOfAdminQuizInfo.questions[0].answers[0].answerId;
    answerId2 = resOfAdminQuizInfo.questions[0].answers[1].answerId;

    // Call update status to start questions
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 });

    // Delay to keep in QUESTION_OPEN state
 		sleepSync(FINISH_COUNTDOWN);
  });

  // Success 200, no answer submission
  test('successful in getting final results (no answer submission)', () => {
    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(FINISH_COUNTDOWN);

    // Call update status to FINAL_RESULTS state
    sleepSync(1000 + 100);
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_FINAL_RESULTS' }, { token: token1 });

    // Make sure session is in FINAL_RESULTS state
    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state;
    expect(sessionState).toStrictEqual('FINAL_RESULTS');

    const res = requestMethod('get', `/v1/player/${playerId1}/results`, {}, {});

    expect(() => res).not.toThrow(HTTPError[400]);
    expect(res).toStrictEqual({
      usersRankedByScore: [
        {
          name: 'valid123',
          score: 0,
        }
      ],
      questionResults: [
        {
          questionId: questionId1,
          questionCorrectBreakdown: [
            {
              answerId: answerId1,
              playersCorrect: [
              ]
            },
            {
              answerId: answerId2,
              playersCorrect: [
              ]
            },
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 0,
        }
      ]
    });
  });

  // Success 200, successful in getting final results (2 correct answers)
  test('successful in getting final results (2 correct answers)', () => {
    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    // Submit answer 1 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId1] }, {});
    // Submit answer 2 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId2] }, {});

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(FINISH_COUNTDOWN);

    // Call update status to FINAL_RESULTS state
    sleepSync(1000 + 100);
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_FINAL_RESULTS' }, { token: token1 });

    // Make sure session is in FINAL_RESULTS state
    const sessionState = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).state;
    expect(sessionState).toStrictEqual('FINAL_RESULTS');

    const res = requestMethod('get', `/v1/player/${playerId1}/results`, {}, {});

    expect(() => res).not.toThrow(HTTPError[400]);
    expect(res).toStrictEqual({
      usersRankedByScore: [
        {
          name: 'valid123',
          score: expect.any(Number)
        }
      ],
      questionResults: [
        {
          questionId: questionId1,
          questionCorrectBreakdown: [
            {
              answerId: answerId1,
              playersCorrect: [
                'valid123',
              ]
            },
            {
              answerId: answerId2,
              playersCorrect: [
                'valid123',
              ]
            },
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 100,
        }
      ]
    });
  });

  // Error 400, player id does not exist
  test('player id does not exist', () => {
    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    // Submit answer 1 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId1] }, {});
    // Submit answer 2 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId2] }, {});

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(FINISH_COUNTDOWN);

    // Call update status to FINAL_RESULTS state
    sleepSync(1000 + 100);
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'GO_TO_FINAL_RESULTS' }, { token: token1 });

    expect(() => requestMethod('get', `/v1/player/${0}/results`, {}, {})).toThrow(HTTPError[400]);
  });

  // Error 400, session is not in FINAL_RESULTS state
  test('session is not in FINAL_RESULTS state', () => {
    // Get position of question in current session
    const currentPosition = requestMethod('get', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, {}, { token: token1 }).atQuestion;

    // Submit answer 1 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId1] }, {});
    // Submit answer 2 - is correct
    requestMethod('put', `/v1/player/${playerId1}/question/${currentPosition}/answer`, { answerIds: [answerId2] }, {});

    // Checking at the end the session state is QUESTION_CLOSE
    sleepSync(FINISH_COUNTDOWN);

    // Call update status to END state
    sleepSync(1000 + 100);
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'END' }, { token: token1 });

    expect(() => requestMethod('get', `/v1/player/${playerId1}/results`, {}, {})).toThrow(HTTPError[400]);
  });
});

describe('HTTP viewActiveInactive sessions', () => {
  let token1:any;
  let token2:any;
  let quizId1:any;
  let quizId2:any;
  let questionId1:any;
  let questionId2:any;
  let questionId3:any;
  let sessionId1:any;
  let sessionId2:any;
  let sessionId3:any;
  let sessionId4:any;

  beforeEach(() => {
    requestMethod('delete', '/v1/clear', {}, {});
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

    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'Quiz One', description: 'first user quiz' }, { token: token1 }).quizId;
    quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Two Quiz Two', description: 'second user quiz' }, { token: token2 }).quizId;

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
        token: token1,
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
    sessionId3 = requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: token1 }).sessionId;
    sessionId4 = requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 3 }, { token: token1 }).sessionId;
  });

  // success tests
  test('Successfully gets session statuses. all 4 active', () => {
    const res = requestMethod('get', `/v1/admin/quiz/${quizId1}/sessions`, {}, { token: token1 });

    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/sessions`, {}, { token: token1 })).toStrictEqual({
      activeSessions: [sessionId1, sessionId2, sessionId3, sessionId4].sort((a, b) => a - b),
      inactiveSessions: []
    });
  });

  test('Successfully gets session statuses. 2 active 2 inactive', () => {
    // deactive s3, s4
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId3}`, { action: 'END' }, { token: token1 });
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId4}`, { action: 'END' }, { token: token1 });

    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/sessions`, {}, { token: token1 })).toStrictEqual({
      activeSessions: [sessionId1, sessionId2].sort((a, b) => a - b),
      inactiveSessions: [sessionId3, sessionId4].sort((a, b) => a - b)
    });
  });

  test('Successfully gets session statuses. 4 inactive', () => {
    // deactive s1-s4
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'END' }, { token: token1 });
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId2}`, { action: 'END' }, { token: token1 });
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId3}`, { action: 'END' }, { token: token1 });
    requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId4}`, { action: 'END' }, { token: token1 });

    const res = requestMethod('get', `/v1/admin/quiz/${quizId1}/sessions`, {}, { token: token1 });

    expect(requestMethod('get', `/v1/admin/quiz/${quizId1}/sessions`, {}, { token: token1 })).toStrictEqual({
      activeSessions: [],
      inactiveSessions: [sessionId1, sessionId2, sessionId3, sessionId4].sort((a, b) => a - b)
    });
  });
});
