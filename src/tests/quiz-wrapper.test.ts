// @ts-nocheck
// @ts-ignore
import { getMethod, postMethod, putMethod, deleteMethod, requestMethod, sleepSync } from './test-helper';
import HTTPError from 'http-errors';
import { UserType, TokenObject } from './../types';
import { FINISH_COUNTDOWN } from '../helper';
const OK = 200;
const INPUT_ERROR = 400;
const TOKEN_STRUCTURE_ERROR = 401;
const TOKEN_SESSION_ERROR = 403;
const ERROR_STRING = { error: expect.any(String) };
const ANY_STRING = expect.any(String);
const ANY_NUMBER = expect.any(Number);

const LEBRONJAMES_JPG = 'https://clipart-library.com/img/2046271.jpg';
const LEBRONJAMES_PNG = 'https://w7.pngwing.com/pngs/173/86/png-transparent-lebron-james-cleveland-cavaliers-miami-heat-2017-18-nba-season-los-angeles-lakers-lebron-james-jersey-arm-sports.png';
const LEBRONJAMES_GIF = 'https://media.tenor.com/0qx7C3sRmfAAAAAC/lebron-james-lebron-lakers.gif';
const LEBRONJAMES_MP4 = 'https://videos.ctfassets.net/8pi8z3xqpwj9/2Gqrw26hlDZzqmcUX3VQqA/246b080bb899b2f59541b82244fce018/play_TASC_Steph_C_Handles_2015_03_08_5_the_anthology_steph_curry_anthology_capture_Animated_1080_1080_Texture__1_.mp4';
const LEBRONJAMES_WEBM = 'https://is2.4chan.org/a/1690765228868975.webm';
const IMG_DOWNLOAD_TIMEOUT = 20000; // 20s

interface quizType {
  token: string;
  name: string;
  description: string;
}

interface answerType {
  answer: string;
  correct: boolean;
}

interface questionType {
  question: string;
  duration: number;
  points: number;
  answers: answerType[];
}

interface userType {
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string,
}

beforeEach(() => {
  requestMethod('delete', '/v1/clear', {}, {});
});

// ===================== ITERATION 1 FUNCTION TESTS =====================

// --------------- HTTP wrapper tests for adminQuizCreate ---------------
describe('v1 HTTP adminQuizCreate', () => {
  let token: string, user: userType;
  beforeEach(() => {
    // clear all

    user = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    // create token for registered user
    token = JSON.parse(String(postMethod('/v1/admin/auth/register', user).body)).token;
  });

  // name is empty (input error)
  test('unsuccessful quiz create with code 400', () => {
    const quiz: quizType = { token, name: '', description: 'my quiz description' };

    const res = postMethod('/v1/admin/quiz', quiz);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // token not in structure (token structure error)
  test('unsuccessful quiz create with code 401', () => {
    const quiz = { token: 'NotaNumber', name: 'Successful Quiz', description: 'my quiz description' };

    const res = postMethod('/v1/admin/quiz', quiz);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  // token session not active (session not logged in error)
  test('unsuccessful quiz create with code 403', () => {
    // log the user out first
    postMethod('/v1/admin/auth/logout', { token });
    // quiz should not be created since token does not exist anymore
    const quiz = { token, name: 'UNSuccessful Quiz', description: 'my quiz description' };
    const res = postMethod('/v1/admin/quiz', quiz);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
  });

  // successfully create quiz
  test('successful quiz create with code 200', () => {
    const quiz = { token, name: 'Successful Quiz', description: 'my quiz description' };

    const res = postMethod('/v1/admin/quiz', quiz);

    expect(JSON.parse(String(res.body)).quizId).toStrictEqual(expect.any(Number));
    expect(res.statusCode).toBe(OK);
  });

  test('Name is already used by the user for another quiz', () => {
    const quiz = { token, name: 'Successful Quiz', description: 'my quiz description' };

    postMethod('/v1/admin/quiz', quiz);

    const res = postMethod('/v1/admin/quiz', quiz);
    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // token not in structure (token structure error)
  test('length description  > 100', () => {
    const badDesc = 'A test for the allowed length of a quiz' +
    'description. This string is definitely longer than 100' +
    'characters and hence should give an error.';

    const res = postMethod('/v1/admin/quiz', { token: token, name: 'fasdfa f', description: badDesc });
    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
});

// done
describe('v2 HTTP adminQuizCreate', () => {
  let token1: string, user: UserType;
  beforeEach(() => {
    // clear all

    user = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    // create token for registered user
    token1 = requestMethod('post', '/v1/admin/auth/register', user).token;
  });

  // name is empty (input error)
  test('unsuccessful quiz create with code 400', () => {
    const quiz: quizType = { token1, name: '', description: 'my quiz description' };

    expect(() => requestMethod('post', '/v2/admin/quiz', { name: '', description: 'my quiz description' }, { token: token1 })).toThrow(HTTPError[400]);
  });

  // token not in structure (token structure error)
  test('unsuccessful quizCreate with code 401', () => {
    expect(() => requestMethod('post', '/v2/admin/quiz', { name: 'Successful Quiz', description: 'my quiz description' }, { token: 'notanumber' })).toThrow(HTTPError[401]);
  });

  // token not in structure (token structure error)
  test('Name is already used by the user for another quiz', () => {
    expect(requestMethod('post', '/v2/admin/quiz', { name: 'yeah ok', description: 'my quiz description' }, { token: token1 }).quizId).toStrictEqual(ANY_NUMBER);

    expect(() => requestMethod('post', '/v2/admin/quiz', { name: 'yeah ok', description: 'my quiz description' }, { token: token1 })).toThrow(HTTPError[400]);
  });

  // token not in structure (token structure error)
  test('length description  > 100', () => {
    const badDesc = 'A test for the allowed length of a quiz' +
    'description. This string is definitely longer than 100' +
    'characters and hence should give an error.';

    expect(() => requestMethod('post', '/v2/admin/quiz', { name: 'yeah ok', description: badDesc }, { token: token1 })).toThrow(HTTPError[400]);
  });

  // token session not active (session not logged in error)
  test('unsuccessful quiz create with code 403', () => {
    // log the user out first
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });
    expect(() => requestMethod('post', '/v2/admin/quiz', { name: 'unsuccessfull Quiz', description: 'my quiz description' }, { token: token1 })).toThrow(HTTPError[403]);
  });

  // successfully create quiz
  test('successful quiz create with code 200', () => {
    expect(requestMethod('post', '/v2/admin/quiz', { name: 'successfull Quiz', description: 'my quiz description' }, { token: token1 }).quizId).toStrictEqual(ANY_NUMBER);
  });
});

// --------------- HTTP wrapper tests for adminQuizRemove ---------------
describe('v1 HTTP adminQuizRemove', () => {
  let token: string, user: userType, quiz: quizType, quizid: number;
  beforeEach(() => {
    // clear all

    user = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    // create token for registered user
    token = JSON.parse(String(postMethod('/v1/admin/auth/register', user).body)).token;
    quiz = { token, name: 'good', description: 'my quiz description' };
    // quizid = postMethod('/v1/admin/quiz', quiz).quizId;
    quizid = JSON.parse(String(postMethod('/v1/admin/quiz', quiz).body)).quizId;
  });

  // name is empty (input error)
  test('unsuccessful quiz removal with code 400', () => {
    const res = deleteMethod(`/v1/admin/quiz/${quizid + 1}`, { token });

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('unsuccessful quiz removal with code 401', () => {
    const res = deleteMethod(`/v1/admin/quiz/${quizid}`, { token: 'NotaNumber' });

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  test('unsuccessful quiz removal with code 403', () => {
    // log the user out first
    postMethod('/v1/admin/auth/logout', { token });

    const res = deleteMethod(`/v1/admin/quiz/${quizid}`, { token });

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
  });

  test('successful quiz removal with code 200', () => {
    const res = deleteMethod(`/v1/admin/quiz/${quizid}`, { token });
    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);
  });

  test('someone else onwns this quiz', () => {
    const user2 = {
      email: 'hafsdsafh@unsw.edu.au',
      password: 'haysafaeh123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    // create token for registered user
    const token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', user2).body)).token;
    const quiz2 = { token: token2, name: 'goodfwef', description: 'my quiz description' };
    const quizid2 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz2).body)).quizId;

    const res = deleteMethod(`/v1/admin/quiz/${quizid2}`, { token: token });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
});

// --------------- HTTP wrapper tests for adminQuizRemove ---------------
// done
describe('v2 HTTP adminQuizRemove', () => {
  let token1: string, user1: UserType, quiz1, quizId1;
  beforeEach(() => {
    // clear all

    // Registering user 1
    user1 = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    token1 = requestMethod('post', '/v1/admin/auth/register', user1).token;

    // Creating quiz 1 - belongs to user 1
    quiz1 = {
      token: token1,
      name: 'Successful Quiz',
      description: 'my quiz description'
    };
    quizId1 = requestMethod('post', '/v1/admin/quiz', quiz1).quizId;
  });

  // name is empty (input error)
  test('unsuccessful quiz removal with code 400', () => {
    expect(() => requestMethod('delete', `/v2/admin/quiz/${quizId1 + 1}`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });

  // token not in structure (token structure error)
  test('unsuccessful quiz removal with code 401', () => {
    expect(() => requestMethod('delete', `/v2/admin/quiz/${quizId1}`, {}, { token: 'notanumber' })).toThrow(HTTPError[401]);
  });

  // token session not active (session not logged in error)
  test('unsuccessful quiz removal with code 403', () => {
    // log the user out first
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });

    expect(() => requestMethod('delete', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 })).toThrow(HTTPError[403]);
  });

  test('successful quiz removal with code 200', () => {
    expect(requestMethod('delete', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 })).toStrictEqual({});
  });

  test('someone else onwns this quiz', () => {
    const user2 = {
      email: 'hafsdsafh@unsw.edu.au',
      password: 'haysafaeh123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    // create token for registered user
    const token2 = requestMethod('post', '/v1/admin/auth/register', user2).token;
    const quiz2 = { name: 'goodfwef', description: 'my quiz description' };
    const quizid2 = requestMethod('post', '/v2/admin/quiz', quiz2, { token: token2 }).quizId;

    expect(() => requestMethod('delete', `/v2/admin/quiz/${quizid2}`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });
});

// --------------- HTTP wrapper tests for adminQuizList -----------------
describe('v1 HTTP adminQuizList', () => {
  let token: string, user: userType;
  beforeEach(() => {
    // clear all

    user = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    // create token for registered user
    token = JSON.parse(String(postMethod('/v1/admin/auth/register', user).body)).token;
  });

  // token not in structure (token structure error)
  test('unsuccessfully return adminQuizList with code 401', () => {
    const res = getMethod('/v1/admin/quiz/list', { token: 'kys' });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  // token session not active (session not logged in error)
  test('unsuccessfully return adminQuizList with code 403', () => {
    // log the user out
    postMethod('/v1/admin/auth/logout', { token: token });

    const res = getMethod('/v1/admin/quiz/list', { token: token });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
  });

  // successfully create quiz
  test('successfully return adminQuizList code 200', () => {
    const quiz = { token, name: 'Successful Quiz', description: 'my quiz description' };

    postMethod('/v1/admin/quiz', quiz);

    const res = getMethod('/v1/admin/quiz/list', { token });

    expect(JSON.parse(String(res.body))).toStrictEqual({
      quizzes: [
        {
          quizId: expect.any(Number),
          name: expect.any(String),
        }
      ]
    });
    expect(res.statusCode).toBe(OK);
  });

  // integration test
  test('Make a quiz then print it, delete it then print it', () => {
    const quiz = { token, name: 'Successful Quiz1', description: 'my quiz description' };
    const id = JSON.parse(String(postMethod('/v1/admin/quiz', quiz).body)).quizId;

    deleteMethod(`/v1/admin/quiz/${id}`, { token });
    const res = getMethod('/v1/admin/quiz/list', { token });
    expect(JSON.parse(String(res.body)).quizzes).toStrictEqual([]);
    expect(res.statusCode).toBe(OK);
  });
});

// --------------- HTTP wrapper tests for adminQuizList -----------------
// done
describe('v2 HTTP adminQuizList', () => {
  let token1: string, user: UserType;
  beforeEach(() => {
    // clear all

    user = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    // create token for registered user
    token1 = requestMethod('post', '/v1/admin/auth/register', user).token;
  });

  // token not in structure (token structure error)
  test('unsuccessfully return adminQuizList with code 401', () => {
    const token2 = token1 + '1212';
    expect(() => requestMethod('get', '/v2/admin/quiz/list', {}, { token: token2 })).toThrow(HTTPError[401]);
  });

  // token session not active (session not logged in error)
  test('unsuccessfully return adminQuizList with code 403', () => {
    // log the user out
    requestMethod('post', '/v1/admin/auth/logout', { token: token1 });
    expect(() => requestMethod('get', '/v2/admin/quiz/list', {}, { token: token1 })).toThrow(HTTPError[403]);
  });

  // successfully create quiz - change the route so that token is header for quizCreate route
  test('successfully return adminQuizList code 200', () => {
    const quiz = { name: 'Successful Quiz', description: 'my quiz description' };
    // postMethod('/v1/admin/quiz', quiz);

    requestMethod('post', '/v2/admin/quiz', quiz, { token: token1 });
    // const res = getMethod('/v1/admin/quiz/list', { token1 });

    // const quizListReturn = requestMethod('get', '/v2/admin/quiz/list', {}, {token: token1});

    expect(requestMethod('get', '/v2/admin/quiz/list', {}, { token: token1 })).toStrictEqual({
      quizzes: [
        {
          quizId: expect.any(Number),
          name: expect.any(String),
        }
      ]
    });
  });

  // integration test - TODO change the v1 routes
  test('Make a quiz then print it, delete it then print it', () => {
    const quiz = { token: token1, name: 'Successful Quiz1', description: 'my quiz description' };
    // const id = JSON.parse(String(postMethod('/v1/admin/quiz', quiz).body)).quizId;
    const id = requestMethod('post', '/v1/admin/quiz', quiz).quizId;

    deleteMethod(`/v1/admin/quiz/${id}`, { token: token1 });
    // const res = getMethod('/v1/admin/quiz/list', { token: token1 });

    // expect(JSON.parse(String(res.body)).quizzes).toStrictEqual([]);
    // expect(res.statusCode).toBe(OK);
    expect((requestMethod('get', '/v2/admin/quiz/list', {}, { token: token1 })).quizzes).toStrictEqual([]);
  });
});

// ------------- HTTP wrapper tests for adminQuizTransfer ---------------
describe('v1 HTTP adminQuizTransfer', () => {
  let token1:string;
  let token2:string;
  let quizId1: number;
  let quizId2: number;
  let res : any;
  beforeEach(() => {
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', {
      email: 'user1@gmail.com',
      password: '123456ABCdef$',
      nameFirst: 'Audemars',
      nameLast: 'Piguet'
    }).body)).token;

    token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', {
      email: 'user2@gmail.com',
      password: '123456789ABCdef$',
      nameFirst: 'Leon',
      nameLast: 'Breitling'
    }).body)).token;

    quizId1 = JSON.parse(String(postMethod('/v1/admin/quiz', {
      token: token1,
      name: 'Audemars quiz',
      description: 'Math quiz'
    }).body)).quizId;

    quizId2 = JSON.parse(String(postMethod('/v1/admin/quiz', {
      token: token2,
      name: 'Leons quiz',
      description: 'Science quiz'
    }).body)).quizId;
  });

  test('Token is not a valid structure', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1}/transfer`, {
      token: 'this aint a number',
      userEmail: 'user2@gmail.com'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  test('Provided token is valid structure, but is not for a currently logged in session', () => {
    // log out user1 first
    postMethod('/v1/admin/auth/logout', { token: token1 });

    res = postMethod(`/v1/admin/quiz/${quizId1}/transfer`, {
      token: token1,
      userEmail: 'user2@gmail.com'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
  });

  test('Quiz ID does not refer to a valid quiz', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1 + 1}/transfer`, {

      token: token1,
      userEmail: 'user2@gmail.com'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // User1 is trying to transfer user2's quiz to themselves, but user1 doesn't own it.
  test('Quiz ID does not refer to a quiz that this user owns', () => {
    res = postMethod(`/v1/admin/quiz/${quizId2}/transfer`, {
      token: token1,
      userEmail: 'user1@gmail.com'
    });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('userEmail is not a real user', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1}/transfer`, {
      token: token1,
      userEmail: 'user3@gmail.com'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('quiz recipient has existing quiz with same name as one being transferred', () => {
    requestMethod('post', '/v1/admin/quiz', {
      token: token2,
      name: 'Audemars quiz',
      description: 'Math quiz'
    });

    res = postMethod(`/v1/admin/quiz/${quizId1}/transfer`, {
      token: token1,
      userEmail: 'user2@gmail.com'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('userEmail is the current logged in user (Trying to transfer quiz to themselves)', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1}/transfer`, {
      token: token1,
      userEmail: 'user1@gmail.com'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Quiz ID refers to a quiz that has a name that is already used by the target user', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1}/transfer`, {
      token: token1,
      userEmail: 'user1@gmail.com'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Transferring a quiz from user1 to user2', () => {
    // Transferring a quiz from user1 to user2
    res = postMethod(`/v1/admin/quiz/${quizId1}/transfer`, {
      token: token1,
      userEmail: 'user2@gmail.com'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);

    // Checking user1's quizzes
    res = getMethod('/v1/admin/quiz/list', { token: token1 });
    expect(JSON.parse(String(res.body))).toStrictEqual({ quizzes: [] });
    expect(res.statusCode).toBe(OK);

    // Checking user2's quizzes
    res = getMethod('/v1/admin/quiz/list', { token: token2 });

    expect(JSON.parse(String(res.body))).toStrictEqual({
      quizzes: [
        {
          quizId: quizId2,
          name: 'Leons quiz'
        },
        {
          quizId: quizId1,
          name: 'Audemars quiz'
        }]
    });

    expect(res.statusCode).toBe(OK);
  });

  test('Transferring a specific quiz, when a user has multiple quizzes', () => {
    // const quizId3 = adminQuizCreate(token1, 'Audemars quiz2', 'English quiz').quizId;
    const quizId3 = JSON.parse(String(postMethod('/v1/admin/quiz', {
      token: token1,
      name: 'Audemars quiz2',
      description: 'English quiz'
    }).body)).quizId;

    // transfer english quiz to user2
    res = postMethod(`/v1/admin/quiz/${quizId3}/transfer`, {
      token: token1,
      userEmail: 'user2@gmail.com'
    }).body;

    res = getMethod('/v1/admin/quiz/list', { token: token1 });
    expect(JSON.parse(String(res.body))).toStrictEqual({
      quizzes: [{
        quizId: quizId1,
        name: 'Audemars quiz'
      }]

    });

    res = getMethod('/v1/admin/quiz/list', { token: token2 });
    expect(JSON.parse(String(res.body))).toStrictEqual({
      quizzes: [
        {
          quizId: quizId2,
          name: 'Leons quiz'
        },
        {
          quizId: quizId3,
          name: 'Audemars quiz2'
        }]
    });
  });
});

// ------------- HTTP wrapper tests for adminQuizTransfer ---------------
describe('v2 HTTP adminQuizTransfer', () => {
  let user1: userType, token1: string, quiz1: quizType, quizId1: number;
  let user2: userType, token2: string, quiz2: quizType, quizId2: number;
  beforeEach(() => {
    // Registering user 1
    user1 = {
      email: 'user1@gmail.com',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    token1 = requestMethod('post', '/v1/admin/auth/register', user1).token;

    // Creating quiz 1 - belongs to user 1
    quiz1 = {
      token: token1,
      name: 'Audemars quiz',
      description: 'Math quiz'
    };
    quizId1 = requestMethod('post', '/v1/admin/quiz', quiz1).quizId;

    // Registering user 2
    user2 = {
      email: 'user2@gmail.com',
      password: 'StrongPassword1',
      nameFirst: 'Madhu',
      nameLast: 'Shrestha'
    };
    token2 = requestMethod('post', '/v1/admin/auth/register', user2).token;

    // Creating quiz 2 - belongs to user 2 skfjlsfs
    quiz2 = {
      token: token2,
      name: 'Leons quiz',
      description: 'Science quiz'
    };
    quizId2 = requestMethod('post', '/v1/admin/quiz', quiz2).quizId;
  });

  test('Token is not a valid structure', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/transfer`, {
      userEmail: 'user2@gmail.com'
    }, { token: 'this aint a number' })).toThrow(HTTPError[401]);
  });

  test('Provided token is valid structure, but is not for a currently logged in session', () => {
    // log out user1 first
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });

    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/transfer`, {
      userEmail: 'user2@gmail.com'
    }, { token: token1 })).toThrow(HTTPError[403]);
  });

  test('Quiz ID does not refer to a valid quiz', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1 + 1}/transfer`, {
      userEmail: 'user2@gmail.com'
    }, { token: token1 })).toThrow(HTTPError[400]);
  });

  test('quiz recipient has existing quiz with same name as one being transferred', () => {
    quiz1 = {

      name: 'Audemars quiz',
      description: 'Math quiz'
    };
    requestMethod('post', '/v2/admin/quiz', quiz1, { token: token2 });

    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/transfer`, {
      userEmail: 'user2@gmail.com'
    }, { token: token1 })).toThrow(HTTPError[400]);
  });

  // User1 is trying to transfer user2's quiz to themselves, but user1 doesn't own it.
  test('Quiz ID does not refer to a quiz that this user owns', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId2}/transfer`, {
      userEmail: 'user1@gmail.com'
    }, { token: token1 })).toThrow(HTTPError[400]);
  });

  test('userEmail is not a real user', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/transfer`, {
      userEmail: 'user3@gmail.com'
    }, { token: token1 })).toThrow(HTTPError[400]);
  });

  test('userEmail is the current logged in user (Trying to transfer quiz to themselves)', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/transfer`, {
      userEmail: 'user1@gmail.com'
    }, { token: token1 })).toThrow(HTTPError[400]);
  });

  test('Transferring a quiz from user1 to user2', () => {
    console.log('quizId1: ' + quizId1);
    console.log('quizId1: ' + quizId2);
    // Transferring a quiz from user1 to user2
    // expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/transfer`, {
    //   userEmail: 'user2@gmail.com'
    // }, { token: token1 })).not.toThrow(HTTPError[400]);

    expect(requestMethod('post', `/v2/admin/quiz/${quizId1}/transfer`, {
      userEmail: 'user2@gmail.com'
    }, { token: token1 })).toStrictEqual({});

    // Checking user1's quizzes
    const res = requestMethod('get', '/v2/admin/quiz/list', {}, { token: token1 });
    expect(res).toStrictEqual({ quizzes: [] });

    // Checking user2's quizzes
    const res2 = requestMethod('get', '/v2/admin/quiz/list', {}, { token: token2 });

    expect(res2).toStrictEqual({
      quizzes: [
        {
          quizId: quizId2,
          name: 'Leons quiz'
        },
        {
          quizId: quizId1,
          name: 'Audemars quiz'
        }]
    });
  });

  test('Transferring a specific quiz, when a user has multiple quizzes', () => {
    // const quizId3 = adminQuizCreate(token1, 'Audemars quiz2', 'English quiz').quizId;
    const quizId3 = JSON.parse(String(postMethod('/v1/admin/quiz', {
      token: token1,
      name: 'Audemars quiz2',
      description: 'English quiz'
    }).body)).quizId;

    // transfer english quiz to user2
    // expect(() => res = requestMethod('post', `/v2/admin/quiz/${quizId3}/transfer`, {
    //   userEmail: 'user2@gmail.com'
    // }, { token: token1 })).not.toThrow(HTTPError[400]);
    // expect(res).toStrictEqual({});
    expect(requestMethod('post', `/v2/admin/quiz/${quizId3}/transfer`, {
      userEmail: 'user2@gmail.com'
    }, { token: token1 })).toStrictEqual({});

    expect(requestMethod('get', '/v2/admin/quiz/list', {}, { token: token1 })).toStrictEqual({
      quizzes: [{
        quizId: quizId1,
        name: 'Audemars quiz'
      }]

    });

    expect(requestMethod('get', '/v2/admin/quiz/list', {}, { token: token2 })).toStrictEqual({
      quizzes: [
        {
          quizId: quizId2,
          name: 'Leons quiz'
        },
        {
          quizId: quizId3,
          name: 'Audemars quiz2'
        }]
    });
  });

  describe('state', () => {
    let questionId1;
    let questionId2;
    let questionId3;
    let sessionId1;
    beforeEach(() => {
      questionId1 = requestMethod('post', `/v1/admin/quiz/${quizId1}/question`,
        {
          token: token1,
          questionBody: {
            question: 'Who is the Monarch of England?',
            duration: 4,
            thumbnailUrl: 'http://google.com/some/image/path.jpg',
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
        }).questionId;

      // Adding a second question
      questionId2 = requestMethod('post', `/v1/admin/quiz/${quizId1}/question`,
        {
          token: token1,
          questionBody: {
            question: 'whats obamas last name',
            duration: 15,
            thumbnailUrl: 'http://google.com/some/image/path.jpg',
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
            ]
          }
        }).questionId;

      // Adding a third question
      questionId3 = requestMethod('post', `/v1/admin/quiz/${quizId1}/question`,
        {
          token: token1,
          questionBody: {
            question: 'yo wassup',
            duration: 3,
            thumbnailUrl: 'http://google.com/some/image/path.jpg',
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
            ]
          }
        }).questionId;

      sessionId1 = requestMethod('post', `/v1/admin/quiz/${quizId1}/session/start`, { autoStartNum: 1 }, { token: token1 }).sessionId;
    });
    test('transferring a quiz, when it is attached to session, which is not in end state', () => {
      // create a session

      requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'NEXT_QUESTION' }, { token: token1 });
      expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/transfer`, {
        userEmail: 'user2@gmail.com'
      }, { token: token1 })).toThrow(HTTPError[400]);
    });

    test('transferring a quiz, when it is attached to session, but its in end state (succeed)', () => {
      // create a session

      requestMethod('put', `/v1/admin/quiz/${quizId1}/session/${sessionId1}`, { action: 'END' }, { token: token1 });
      sleepSync(2000);
      // expect(() => res = requestMethod('post', `/v2/admin/quiz/${quizId1}/transfer`, {
      //   userEmail: 'user2@gmail.com'
      // }, { token: token1 })).not.toThrow(HTTPError[400]);
      // expect(res).toStrictEqual({});
      expect(requestMethod('post', `/v2/admin/quiz/${quizId1}/transfer`, {
        userEmail: 'user2@gmail.com'
      }, { token: token1 })).toStrictEqual({});
    });
  });
});

// ---------- HTTP wrapper tests for adminQuizQuestionCreate ------------
describe('v1 HTTP adminQuizQuestionCreate', () => {
  let token1:string;
  let token2:string;
  let quizId1: number;
  let quizId2: number;
  let res : any;
  beforeEach(() => {
    // User1
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', {
      email: 'user1@gmail.com',
      password: '123456ABCdef$',
      nameFirst: 'Audemars',
      nameLast: 'Piguet'
    }).body)).token;

    // User2
    token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', {
      email: 'user2@gmail.com',
      password: '123456789ABCdef$',
      nameFirst: 'Leon',
      nameLast: 'Breitling'
    }).body)).token;

    // Quiz1
    quizId1 = JSON.parse(String(postMethod('/v1/admin/quiz', {
      token: token1,
      name: 'Audemars quiz',
      description: 'Math quiz'
    }).body)).quizId;

    // Quiz2
    quizId2 = JSON.parse(String(postMethod('/v1/admin/quiz', {
      token: token2,
      name: 'Leons quiz',
      description: 'Science quiz'
    }).body)).quizId;
  });

  test('Token is not a valid structure', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,
      {
        token: 'this is not a number',
        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {

              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]

        }
      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  test('Provided token is valid structure, but is not for a currently logged in session', () => {
    // log out user1 first
    postMethod('/v1/admin/auth/logout', { token: token1 });

    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,
      {
        token: token1,
        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]
        }
      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
  });

  test('Quiz ID does not refer to a valid quiz', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1 + 1}/question`,
      {
        token: token1,
        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]

        }
      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Quiz ID does not refer to a quiz that this user owns', () => {
    // User1 trying to modify quiz2 (which is owned by user2)
    res = postMethod(`/v1/admin/quiz/${quizId2}/question`,

      {
        token: token1,
        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]

        }
      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  describe('Question string is less than 5 characters in length or greater than 50 characters in length', () => {
    // lengths = 4, 51.
    test.each([
      ['abcd'],
      ['01234567890123456789012345678901234567890123456789A']
    ])('Create question with question: "%s"', (question) => {
      const requestBody = {
        token: token1,
        questionBody: {
          question,
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]
        }
      };

      res = postMethod(`/v1/admin/quiz/${quizId1}/question`, requestBody);
      expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
      expect(res.statusCode).toBe(INPUT_ERROR);
    });
  });

  describe('Question string is less than 5 characters in length or greater than 50 characters in length', () => {
    // lengths = 5,6,49,50.
    test.each([
      ['abcde'],
      ['abcdef'],
      ['0123456789012345678901234567890123456789012345678'],
      ['01234567890123456789012345678901234567890123456789']
    ])('Create question with question: "%s"', (question) => {
      const requestBody = {

        token: token1,
        questionBody: {
          question,
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]
        }
      };

      res = postMethod(`/v1/admin/quiz/${quizId1}/question`, requestBody);
      expect(JSON.parse(String(res.body))).toStrictEqual({ questionId: expect.any(Number) });
      expect(res.statusCode).toBe(OK);
    });
  });

  test('The question has more than 6 answers or less than 2 answers', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,

      {
        token: token1,
        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false

            },
            {
              answer: 'fdsafdsa33gum',
              correct: false
            },
            {
              answer: 'sadfsfd3232aum',
              correct: false
            },
            {
              answer: 'sadfas2323dfm',
              correct: false
            },
            {
              answer: 'asd2f3f f23dsa',
              correct: false

            }
          ]
        }
      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('The question has more than 6 answers or less than 2 answers', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,

      {
        token: token1,
        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true

            }
          ]
        }
      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('The question duration is not a positive number', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,
      {

        token: token1,
        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 0,

          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]
        }

      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);

    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,
      {
        token: token1,
        questionBody: {
          question: 'Who is the Monarch of England?',

          duration: -1,

          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false

            }
          ]
        }
      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('The sum of the question durations in the quiz exceeds 3 minutes from 1 question', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,
      {
        token: token1,
        questionBody: {
          question: 'Who is the Monarch of England?',

          duration: 181,

          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true

            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false

            }
          ]
        }
      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('The sum of the question durations in the quiz exceeds 3 minutes from multiple questions', () => {
    postMethod(`/v1/admin/quiz/${quizId1}/question`,
      {
        token: token1,
        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 180,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]
        }
      }
    );

    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,
      {
        token: token1,
        questionBody: {
          question: 'Whos joe?',
          duration: 1,
          points: 5,
          answers: [
            {
              answer: 'joe mama',
              correct: true
            },
            {
              answer: 'asdfsafd us',
              correct: false
            },
            {
              answer: '2h32h3',

              correct: false
            }
          ]
        }

      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  describe('The points awarded for the question are less than 1 or greater than 10', () => {
    test.each([
      0, 11
    ])('Create question with question: "%s"', (points) => {
      const requestBody = {
        token: token1,
        questionBody: {
          question: 'Whos king of england',
          duration: 4,
          points,

          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false

            }
          ]
        }
      };

      res = postMethod(`/v1/admin/quiz/${quizId1}/question`, requestBody);
      expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
      expect(res.statusCode).toBe(INPUT_ERROR);
    });

    test.each([
      1, 10
    ])('Create question with question: "%s"', (points) => {
      const requestBody = {
        token: token1,
        questionBody: {
          question: 'Whos king of england',
          duration: 4,
          points,

          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]
        }

      };

      res = postMethod(`/v1/admin/quiz/${quizId1}/question`, requestBody);
      expect(JSON.parse(String(res.body))).toStrictEqual({ questionId: expect.any(Number) });
      expect(res.statusCode).toBe(OK);
    });
  });

  describe('The length of any answer is shorter than 1 character long, or longer than 30 characters long', () => {
    test.each([
      '', '012345678901234567890123456789X'
    ])('Create question with question: "%s"', (specificAnswer) => {
      const requestBody = {
        token: token1,
        questionBody: {
          question: 'Whos king of england',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: specificAnswer,

              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]
        }

      };

      res = postMethod(`/v1/admin/quiz/${quizId1}/question`, requestBody);
      expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
      expect(res.statusCode).toBe(INPUT_ERROR);
    });
  });

  describe('The length of any answer is shorter than 1 character long, or longer than 30 characters long', () => {
    test.each([
      '1', '12', '01234567890123456789012345678', '012345678901234567890123456789'
    ])('Create question with question: "%s"', (specificAnswer) => {
      const requestBody = {
        token: token1,
        questionBody: {
          question: 'Whos king of england',
          duration: 4,

          points: 5,
          answers: [
            {
              answer: specificAnswer,

              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]
        }
      };

      res = postMethod(`/v1/admin/quiz/${quizId1}/question`, requestBody);

      expect(JSON.parse(String(res.body))).toStrictEqual({ questionId: expect.any(Number) });
      expect(res.statusCode).toBe(OK);
    });
  });

  test('Any answer strings are duplicates of one another (within the same question)', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,
      {
        token: token1,
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
              answer: 'Will',

              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]
        }

      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('There are no correct answers', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,
      {
        token: token1,
        questionBody: {
          question: 'Who is the Monarch of England?',

          duration: 4,
          points: 5,
          answers: [
            {

              answer: 'Will',
              correct: false
            },
            {
              answer: 'mike',

              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ]
        }

      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Correctly adding questions to a quiz', () => {
    // Adding question #1
    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,

      {
        token: token1,
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
          ]
        }

      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual({ questionId: expect.any(Number) });
    expect(res.statusCode).toBe(OK);

    // Adding question #2

    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,
      {
        token: token1,
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
          ]
        }
      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual({ questionId: expect.any(Number) });
    expect(res.statusCode).toBe(OK);

    // Adding question #3

    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,
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
          ]
        }
      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual({ questionId: expect.any(Number) });

    expect(res.statusCode).toBe(OK);
  });

  // Now we test that all these questions have been added correctly.
  test('Non Unit test, tests all questions are added correctly', () => {
    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,
      {
        token: token1,
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
          ]
        }

      }
    );
    expect(JSON.parse(String(res.body))).toStrictEqual({ questionId: expect.any(Number) });

    res = getMethod(`/v1/admin/quiz/${quizId1}`, {
      token: token1
    });

    expect(JSON.parse(String(res.body)).questions).toStrictEqual([

      {
        questionId: expect.any(Number),
        question: 'Who is the Monarch of England?',
        duration: 4,
        points: 5,
        answers: [
          {
            answerId: ANY_NUMBER,
            answer: 'Will',
            colour: ANY_STRING,
            correct: true
          },
          {
            answerId: ANY_NUMBER,
            answer: 'samson',
            colour: ANY_STRING,
            correct: false
          },
          {
            answerId: ANY_NUMBER,
            answer: 'Ur mum',
            colour: ANY_STRING,
            correct: false
          }
        ]
      }

    ]);

    expect(res.statusCode).toBe(OK);

    // Adding question #2
    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,
      {
        token: token1,
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
          ]
        }
      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual({ questionId: expect.any(Number) });
    expect(res.statusCode).toBe(OK);

    // Adding question #3
    res = postMethod(`/v1/admin/quiz/${quizId1}/question`,
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
          ]
        }
      }
    );

    expect(JSON.parse(String(res.body))).toStrictEqual({ questionId: expect.any(Number) });

    expect(res.statusCode).toBe(OK);

    res = getMethod(`/v1/admin/quiz/${quizId1}`, {
      token: token1
    });

    expect(JSON.parse(String(res.body)).questions).toStrictEqual([
      {
        questionId: ANY_NUMBER,
        question: 'Who is the Monarch of England?',
        duration: 4,
        points: 5,
        answers: [
          {
            answerId: ANY_NUMBER,
            answer: 'Will',
            colour: ANY_STRING,
            correct: true
          },
          {
            answerId: ANY_NUMBER,
            answer: 'samson',
            colour: ANY_STRING,
            correct: false
          },
          {
            answerId: ANY_NUMBER,
            answer: 'Ur mum',
            colour: ANY_STRING,
            correct: false
          }
        ]

      },
      {
        questionId: ANY_NUMBER,
        question: 'whats obamas last name',
        duration: 15,
        points: 6,
        answers: [
          {
            answerId: ANY_NUMBER,
            answer: 'asdfsa',
            colour: ANY_STRING,
            correct: false
          },
          {
            answerId: ANY_NUMBER,
            answer: 'dsaasdf',
            colour: ANY_STRING,
            correct: true
          },
          {
            answerId: ANY_NUMBER,
            answer: 'wefaefwa',
            colour: ANY_STRING,
            correct: false
          }
        ]

      },
      {
        questionId: ANY_NUMBER,
        question: 'yo wassup',
        duration: 3,
        points: 7,
        answers: [
          {
            answerId: ANY_NUMBER,
            answer: '23g32g',
            colour: ANY_STRING,
            correct: false
          },
          {
            answerId: ANY_NUMBER,
            answer: '234423',
            colour: ANY_STRING,
            correct: false
          },
          {
            answerId: ANY_NUMBER,
            answer: 'e=mc squared',
            colour: ANY_STRING,
            correct: true
          }
        ]
      }
    ]);
    expect(res.statusCode).toBe(OK);
    // Checking that the duration is calculated correctly

    res = JSON.parse(String(res.body));

    expect(res.duration).toStrictEqual(4 + 15 + 3);
    expect(res.numQuestions).toStrictEqual(3);

    // Checking that question ID's are unique
    expect(res.questions[0].questionId).not.toStrictEqual(res.questions[1].questionId);
    expect(res.questions[0].questionId).not.toStrictEqual(res.questions[2].questionId);
    expect(res.questions[2].questionId).not.toStrictEqual(res.questions[1].questionId);

    // Checking that answer IDs are unique (within a question)
    expect(res.questions[0].answers[0].answerId).not.toStrictEqual(res.questions[0].answers[1].answerId);
  });
});

// ---------- HTTP wrapper tests for adminQuizQuestionCreate ------------
describe('v2 HTTP adminQuizQuestionCreate', () => {
  let user1: userType;
  let user2: userType;
  let token1:string;
  let token2:string;
  let quiz1: quizType;
  let quiz2: quizType;
  let quizId1: number;
  let quizId2: number;
  let res : any;
  beforeEach(() => {
    // Registering user 1
    user1 = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    token1 = requestMethod('post', '/v1/admin/auth/register', user1).token;

    // Creating quiz 1 - belongs to user 1
    quiz1 = {
      token: token1,
      name: 'Successful Quiz',
      description: 'my quiz description'
    };
    quizId1 = requestMethod('post', '/v1/admin/quiz', quiz1).quizId;

    // Registering user 2
    user2 = {
      email: 'madhu@gmail.com',
      password: 'StrongPassword1',
      nameFirst: 'Madhu',
      nameLast: 'Shrestha'
    };
    token2 = requestMethod('post', '/v1/admin/auth/register', user2).token;

    // Creating quiz 2 - belongs to user 2 skfjlsfs
    quiz2 = {
      token: token2,
      name: 'Successful Quiz',
      description: 'my quiz description'
    };
    quizId2 = requestMethod('post', '/v1/admin/quiz', quiz2).quizId;
  });

  test('Token is not a valid structure', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {
        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {

              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG

        }
      },
      { token: 'this is not a number' }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[401]);
  });

  test('Provided token is valid structure, but is not for a currently logged in session', () => {
    // log out user1 first
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {
        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      },
      { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[403]);
  });

  test('Quiz ID does not refer to a valid quiz', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1 + 1}/question`,
      {
        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      },
      { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[400]);
  });

  test('Quiz ID does not refer to a quiz that this user owns', () => {
    // User1 trying to modify quiz2 (which is owned by user2)
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId2}/question`,
      {
        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      },
      { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[400]);
  });

  describe('Question string is less than 5 characters in length or greater than 50 characters in length', () => {
    // lengths = 4, 51.
    test.each([
      ['abcd'],
      ['01234567890123456789012345678901234567890123456789A']
    ])('Create question with question: "%s"', (question) => {
      const requestBody = {
        questionBody: {
          question,
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      };

      expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`, requestBody, { token: token1 }, IMG_DOWNLOAD_TIMEOUT)).toThrow(HTTPError[400]);
    });
  });

  describe('Question string is less than 5 characters in length or greater than 50 characters in length', () => {
    // lengths = 5,6,49,50.
    test.each([
      ['abcde'],
      ['abcdef'],
      ['0123456789012345678901234567890123456789012345678'],
      ['01234567890123456789012345678901234567890123456789']
    ])('Create question with question: "%s"', (question) => {
      const requestBody = {
        questionBody: {
          question,
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      };
      res = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`, requestBody, { token: token1 }, IMG_DOWNLOAD_TIMEOUT);
      expect(res.questionId).toStrictEqual(ANY_NUMBER);
    });
  });

  test('The question has more than 6 answers or less than 2 answers', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,

      {

        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false

            },
            {
              answer: 'fdsafdsa33gum',
              correct: false
            },
            {
              answer: 'sadfsfd3232aum',
              correct: false
            },
            {
              answer: 'sadfas2323dfm',
              correct: false
            },
            {
              answer: 'asd2f3f f23dsa',
              correct: false

            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      },
      { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[400]);
  });

  test('The question has more than 6 answers or less than 2 answers', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,

      {

        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true

            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      },
      { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[400]);
  });

  test('The question duration is not a positive number', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {

        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 0,

          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }

      }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[400]);

    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {

        questionBody: {
          question: 'Who is the Monarch of England?',

          duration: -1,

          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false

            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[400]);
  });

  test('The sum of the question durations in the quiz exceeds 3 minutes from 1 question', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {

        questionBody: {
          question: 'Who is the Monarch of England?',

          duration: 181,

          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true

            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false

            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      },
      { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[400]);
  });

  test('The sum of the question durations in the quiz exceeds 3 minutes from multiple questions', () => {
    requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {

        questionBody: {
          question: 'Who is the Monarch of England?',
          duration: 180,
          points: 5,
          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      },
      { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    );
    expect(res.questionId).toStrictEqual(ANY_NUMBER);

    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {

        questionBody: {
          question: 'Whos joe?',
          duration: 1,
          points: 5,
          answers: [
            {
              answer: 'joe mama',
              correct: true
            },
            {
              answer: 'asdfsafd us',
              correct: false
            },
            {
              answer: '2h32h3',

              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }

      },
      { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[400]);
  });

  describe('The points awarded for the question are less than 1 or greater than 10', () => {
    test.each([
      0, 11
    ])('Create question with question: "%s"', (points) => {
      const requestBody = {

        questionBody: {
          question: 'Whos king of england',
          duration: 4,
          points,

          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false

            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      };

      expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`, requestBody, { token: token1 }, IMG_DOWNLOAD_TIMEOUT)).toThrow(HTTPError[400]);
    });

    test.each([
      1, 10
    ])('Create question with question: "%s"', (points) => {
      const requestBody = {

        questionBody: {
          question: 'Whos king of england',
          duration: 4,
          points,

          answers: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }

      };

      res = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`, requestBody, { token: token1 }, IMG_DOWNLOAD_TIMEOUT);
      expect(res.questionId).toStrictEqual(ANY_NUMBER);
    });
  });

  describe('The length of any answer is shorter than 1 character long, or longer than 30 characters long', () => {
    test.each([
      '', '012345678901234567890123456789X'
    ])('Create question with question: "%s"', (specificAnswer) => {
      const requestBody = {

        questionBody: {
          question: 'Whos king of england',
          duration: 4,
          points: 5,
          answers: [
            {
              answer: specificAnswer,

              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }

      };

      expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`, requestBody, { token: token1 }, IMG_DOWNLOAD_TIMEOUT)).toThrow(HTTPError[400]);
    });
  });

  describe('The length of any answer is shorter than 1 character long, or longer than 30 characters long', () => {
    test.each([
      '1', '12', '01234567890123456789012345678', '012345678901234567890123456789'
    ])('Create question with question: "%s"', (specificAnswer) => {
      const requestBody = {

        questionBody: {
          question: 'Whos king of england',
          duration: 4,

          points: 5,
          answers: [
            {
              answer: specificAnswer,

              correct: true
            },
            {
              answer: 'Among us',
              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      };

      res = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`, requestBody, { token: token1 }, IMG_DOWNLOAD_TIMEOUT);
      expect(res.questionId).toStrictEqual(ANY_NUMBER);
    });
  });

  test('Any answer strings are duplicates of one another (within the same question)', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
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
              answer: 'Will',

              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }

      }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[400]);
  });

  test('There are no correct answers', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
      {

        questionBody: {
          question: 'Who is the Monarch of England?',

          duration: 4,
          points: 5,
          answers: [
            {

              answer: 'Will',
              correct: false
            },
            {
              answer: 'mike',

              correct: false
            },
            {
              answer: 'Ur mum',
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }

      }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[400]);
  });

  test('Correctly adding questions to a quiz', () => {
    // Adding question #1
    res = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,

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

      }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    );
    expect(res.questionId).toStrictEqual(ANY_NUMBER);

    // Adding question #2

    res = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
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
      }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    );
    expect(res.questionId).toStrictEqual(ANY_NUMBER);

    // Adding question #3

    res = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
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
      }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    );
    expect(res.questionId).toStrictEqual(ANY_NUMBER);
  });

  // Now we test that all these questions have been added correctly.
  test('Non Unit test, tests all questions are added correctly', () => {
    res = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
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

      }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    );
    expect(res.questionId).toStrictEqual(ANY_NUMBER);

    res = getMethod(`/v1/admin/quiz/${quizId1}`, {
      token: token1
    });

    expect(JSON.parse(String(res.body)).questions).toStrictEqual([

      {
        questionId: expect.any(Number),
        question: 'Who is the Monarch of England?',
        duration: 4,
        points: 5,
        answers: [
          {
            answerId: ANY_NUMBER,
            answer: 'Will',
            colour: ANY_STRING,
            correct: true
          },
          {
            answerId: ANY_NUMBER,
            answer: 'samson',
            colour: ANY_STRING,
            correct: false
          },
          {
            answerId: ANY_NUMBER,
            answer: 'Ur mum',
            colour: ANY_STRING,
            correct: false
          }
        ]
      }

    ]);

    expect(res.statusCode).toBe(OK);

    // Adding question #2
    res = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
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
      }
      , { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    );
    expect(res.questionId).toStrictEqual(ANY_NUMBER);

    // Adding question #3
    res = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,
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
      }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    );
    expect(res.questionId).toStrictEqual(ANY_NUMBER);

    res = getMethod(`/v1/admin/quiz/${quizId1}`, {
      token: token1
    });

    expect(JSON.parse(String(res.body)).questions).toStrictEqual([
      {
        questionId: ANY_NUMBER,
        question: 'Who is the Monarch of England?',
        duration: 4,
        points: 5,
        answers: [
          {
            answerId: ANY_NUMBER,
            answer: 'Will',
            colour: ANY_STRING,
            correct: true
          },
          {
            answerId: ANY_NUMBER,
            answer: 'samson',
            colour: ANY_STRING,
            correct: false
          },
          {
            answerId: ANY_NUMBER,
            answer: 'Ur mum',
            colour: ANY_STRING,
            correct: false
          }
        ]

      },
      {
        questionId: ANY_NUMBER,
        question: 'whats obamas last name',
        duration: 15,
        points: 6,
        answers: [
          {
            answerId: ANY_NUMBER,
            answer: 'asdfsa',
            colour: ANY_STRING,
            correct: false
          },
          {
            answerId: ANY_NUMBER,
            answer: 'dsaasdf',
            colour: ANY_STRING,
            correct: true
          },
          {
            answerId: ANY_NUMBER,
            answer: 'wefaefwa',
            colour: ANY_STRING,
            correct: false
          }
        ]

      },
      {
        questionId: ANY_NUMBER,
        question: 'yo wassup',
        duration: 3,
        points: 7,
        answers: [
          {
            answerId: ANY_NUMBER,
            answer: '23g32g',
            colour: ANY_STRING,
            correct: false
          },
          {
            answerId: ANY_NUMBER,
            answer: '234423',
            colour: ANY_STRING,
            correct: false
          },
          {
            answerId: ANY_NUMBER,
            answer: 'e=mc squared',
            colour: ANY_STRING,
            correct: true
          }
        ]
      }
    ]);
    expect(res.statusCode).toBe(OK);
    // Checking that the duration is calculated correctly

    res = JSON.parse(String(res.body));

    expect(res.duration).toStrictEqual(4 + 15 + 3);
    expect(res.numQuestions).toStrictEqual(3);

    // Checking that question ID's are unique
    expect(res.questions[0].questionId).not.toStrictEqual(res.questions[1].questionId);
    expect(res.questions[0].questionId).not.toStrictEqual(res.questions[2].questionId);
    expect(res.questions[2].questionId).not.toStrictEqual(res.questions[1].questionId);

    // Checking that answer IDs are unique (within a question)
    expect(res.questions[0].answers[0].answerId).not.toStrictEqual(res.questions[0].answers[1].answerId);
  });

  test('thumbnail is an empty string', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,

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
          thumbnailUrl: ''
        }

      }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[400]);
  });

  test.each([
    'dsaffsd', 'png', '.png', 'fdasfdsa.png', 'fjsdaijo.jpg', 'jpg', '.jpg', '4932932',
    'https://www.news.com.au/travel/have-snow-fear-these-are-australia8217s-steepest-ski-runs/news-story/a18510608ebda5c3fb4c722fa854022d',
    'https://my.unsw.edu.au/active/studentClassEnrol/timetable.xml', ''
  ])('imgURL when fetched does not return a valid file', (url) => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,

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
          thumbnailUrl: url
        }

      }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[400]);
  });

  test.each([
    LEBRONJAMES_GIF, LEBRONJAMES_MP4, LEBRONJAMES_WEBM
  ])('imgURL when fetched is not a jpg or png', (url) => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,

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
          thumbnailUrl: url
        }

      }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    )).toThrow(HTTPError[400]);
  });
});

// -------------- HTTP wrapper tests for adminQuizInfo ------------------
describe('v1 HTTP adminQuizInfo', () => {
  let user1: userType, token1: string, quiz1: quizType, quizId1: number;
  let user2: userType, token2: string, quiz2: quizType, quizId2: number;
  beforeEach(() => {
    // Registering user 1
    user1 = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', user1).body)).token;

    // Creating quiz 1 - belongs to user 1
    quiz1 = {
      token: token1,
      name: 'Successful Quiz',
      description: 'my quiz description'
    };
    quizId1 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz1).body)).quizId;

    // Registering user 2
    user2 = {
      email: 'madhu@gmail.com',
      password: 'StrongPassword1',
      nameFirst: 'Madhu',
      nameLast: 'Shrestha'
    };
    token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', user2).body)).token;

    // Creating quiz 2 - belongs to user 2
    quiz2 = { token: token2, name: 'Successful Quiz', description: 'my quiz description' };
    quizId2 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz2).body)).quizId;
  });

  // 200, successful getting quiz details
  test('successful getting quiz details, no questions in quiz', () => {
    // Calling quiz info function
    const res = getMethod(`/v1/admin/quiz/${quizId1}`, { token: token1 });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(OK);
    expect(bodyObj).toStrictEqual({
      quizId: quizId1,
      name: 'Successful Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'my quiz description',
      numQuestions: 0,
      questions: [],
      duration: 0
    });
  });

  // 200, successful getting quiz details with question
  test('successful getting quiz details with question', () => {
    // Adding question #1
    const resOfQuestionCreate = postMethod(`/v1/admin/quiz/${quizId1}/question`,

      {
        token: token1,
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
          ]
        }
      }
    );
    const bodyOfQuestionCreate = JSON.parse(String(resOfQuestionCreate.body));
    const questionId1 = bodyOfQuestionCreate.questionId;

    expect(bodyOfQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });
    expect(resOfQuestionCreate.statusCode).toBe(OK);

    // Calling quiz info function
    const res = getMethod(`/v1/admin/quiz/${quizId1}`, { token: token1 });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(OK);
    expect(bodyObj).toStrictEqual({
      quizId: quizId1,
      name: 'Successful Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'my quiz description',
      numQuestions: 1,
      questions: [
        {
          questionId: questionId1,
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'Will',
              colour: expect.any(String),
              correct: true,
            },
            {
              answerId: expect.any(Number),
              answer: 'samson',
              colour: expect.any(String),
              correct: false,
            }
          ]
        }
      ],
      duration: expect.any(Number),
    });
  });

  // Error 400, invalid quizId parameters
  test('invalid quizId not owned by user', () => {
    const res = getMethod(`/v1/admin/quiz/${quizId2}`, { token: token1 });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  test('invalid quizId', () => {
    const res = getMethod(`/v1/admin/quiz/${quizId1 - 99999}`, { token: token1 });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 401, token is not in a valid structure
  test('token is not a valid structure, error', () => {
    const res = getMethod(`/v1/admin/quiz/${quizId1}`, { token: '0' });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 403, token is not for a currently logged in session
  test('token is valid structure, but is not for a currently logged in session', () => {
    // Log user 1 with token 1 out
    postMethod('/v1/admin/auth/logout', { token: token1 });

    const res = getMethod(`/v1/admin/quiz/${quizId1}`, { token: token1 });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });
});

// -------------- HTTP wrapper tests for adminQuizInfo ------------------
// have to update the v2 route for questionCreate - successful getting quiz details with question
describe('v2 HTTP adminQuizInfo', () => {
  let user1: userType, token1: string, quiz1: quizType, quizId1: number;
  let user2: userType, token2: string, quiz2: quizType, quizId2: number;
  const LEBRONJAMES_JPG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/LeBron_James_%2851959977144%29_%28cropped2%29.jpg/640px-LeBron_James_%2851959977144%29_%28cropped2%29.jpg';
  const IMG_DOWNLOAD_TIMEOUT = 20000; // 20s
  beforeEach(() => {
    // Registering user 1
    user1 = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    token1 = requestMethod('post', '/v1/admin/auth/register', user1).token;

    // Creating quiz 1 - belongs to user 1
    quiz1 = {
      token: token1,
      name: 'Successful Quiz',
      description: 'my quiz description'
    };
    quizId1 = requestMethod('post', '/v1/admin/quiz', quiz1).quizId;

    // Registering user 2
    user2 = {
      email: 'madhu@gmail.com',
      password: 'StrongPassword1',
      nameFirst: 'Madhu',
      nameLast: 'Shrestha'
    };
    token2 = requestMethod('post', '/v1/admin/auth/register', user2).token;

    // Creating quiz 2 - belongs to user 2 skfjlsfs
    quiz2 = {
      token: token2,
      name: 'Successful Quiz',
      description: 'my quiz description'
    };
    quizId2 = requestMethod('post', '/v1/admin/quiz', quiz2).quizId;
  });

  // 200, successful getting quiz details
  test('successful getting quiz details, no questions in quiz', () => {
    // Calling quiz info function
    const res = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });
    expect(() => res).not.toThrow(HTTPError[401]);
    expect(res).toStrictEqual({
      quizId: quizId1,
      name: 'Successful Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'my quiz description',
      numQuestions: 0,
      questions: [],
      duration: 0
    });
  });

  // 200, successful getting quiz details with question
  test('successful getting quiz details with question', () => {
    // Adding question #1
    const questionId1 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`,

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
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        }
      }, { token: token1 }, IMG_DOWNLOAD_TIMEOUT
    ).questionId;

    expect(questionId1).toStrictEqual(ANY_NUMBER);

    // Calling quiz info function
    const res = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });
    expect(() => res).not.toThrow(HTTPError[401]);
    expect(res).toStrictEqual({
      quizId: quizId1,
      name: 'Successful Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'my quiz description',
      numQuestions: 1,
      questions: [
        {
          questionId: questionId1,
          question: 'Who is the Monarch of England?',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'Will',
              colour: expect.any(String),
              correct: true,
            },
            {
              answerId: expect.any(Number),
              answer: 'samson',
              colour: expect.any(String),
              correct: false,
            }
          ],
          thumbnailUrl: ANY_STRING
        }
      ],
      duration: expect.any(Number),
    });
  });

  // Error 400, invalid quizId parameters
  test('invalid quizId not owned by user', () => {
    expect(() => requestMethod('get', `/v2/admin/quiz/${quizId2}`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });

  test('invalid quizId', () => {
    expect(() => requestMethod('get', `/v2/admin/quiz/${quizId1 - 99999}`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });

  // Error 401, token is not in a valid structure
  test('token is not a valid structure, error', () => {
    expect(() => requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: '0' })).toThrow(HTTPError[401]);
  });

  // Error 403, token is not for a currently logged in session
  test('token is valid structure, but is not for a currently logged in session', () => {
    // Log user 1 with token 1 out
    // postMethod('/v1/admin/auth/logout', { token: token1 });
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });

    expect(() => requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 })).toThrow(HTTPError[403]);
  });
});

// -------------- HTTP wrapper tests for adminQuizNameUpdate ------------
describe('v1 HTTP adminQuizNameUpdate', () => {
  let user1: userType, token1: string, quiz1: quizType, quizId1: number;
  let user2: userType, token2: string, quiz2: quizType, quizId2: number;
  beforeEach(() => {
    // Registering user 1
    user1 = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', user1).body)).token;

    // Creating quiz 1 - belongs to user 1
    quiz1 = {
      token: token1,
      name: 'Successful Quiz',
      description: 'my quiz description'
    };
    quizId1 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz1).body)).quizId;

    // Registering user 2
    user2 = {
      email: 'madhu@gmail.com',
      password: 'StrongPassword1',
      nameFirst: 'Madhu',
      nameLast: 'Shrestha'
    };
    token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', user2).body)).token;

    // Creating quiz 2 - belongs to user 2
    quiz2 = { token: token2, name: 'Successful Quiz', description: 'my quiz description' };
    quizId2 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz2).body)).quizId;
  });

  // 200, successful updating name of quiz
  test('successful updating name of quiz', () => {
    // Calling quiz info function
    const res = putMethod(`/v1/admin/quiz/${quizId1}/name`, { token: token1, name: 'IChangedThis' });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(OK);
    expect(bodyObj).toStrictEqual({});

    // Expecting quiz list to have updated quiz name
    const bodyObjOfQuizList = JSON.parse(String(getMethod('/v1/admin/quiz/list', { token: token1 }).body));
    expect(bodyObjOfQuizList).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1,
          name: 'IChangedThis'
        }
      ]
    });
  });

  // Error 400, invalid quizId parameters
  test('invalid quizId not owned by user', () => {
    const res = putMethod(`/v1/admin/quiz/${quizId2}/name`, { token: token1 });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  test('invalid quizId', () => {
    const res = putMethod(`/v1/admin/quiz/${quizId1 - 99999}/name`, { token: token1 });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 400, quiz name already used'
  test('quiz name already used', () => {
    const res = putMethod(`/v1/admin/quiz/${quizId1}/name`, { token: token1, name: quiz2.name });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 400, 'quizname not accepted lenght
  test('quizname not accepted len ', () => {
    const res = putMethod(`/v1/admin/quiz/${quizId1}/name`, { token: token1, name: 'a' });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 401, token is not in a valid structure
  test('token is not a valid structure, error', () => {
    const res = putMethod(`/v1/admin/quiz/${quizId1}/name`, { token: 'safdiosfadoih3$', name: 'IChangedThis' });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 403, token is not for a currently logged in session
  test('token is valid structure, but is not for a currently logged in session', () => {
    // Log user 1 with token 1 out
    postMethod('/v1/admin/auth/logout', { token: token1 });

    const res = putMethod(`/v1/admin/quiz/${quizId1}/name`, { token: token1, name: 'IChangedThis' });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });
});

// -------------- HTTP wrapper tests for adminQuizNameUpdate ------------
describe('v2 HTTP adminQuizNameUpdate', () => {
  let user1: userType, token1: string, quiz1: quizType, quizId1: number;
  let user2: userType, token2: string, quiz2: quizType, quizId2: number;
  beforeEach(() => {
    // Registering user 1
    user1 = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    token1 = requestMethod('post', '/v1/admin/auth/register', user1).token;

    // Creating quiz 1 - belongs to user 1
    quiz1 = {
      token: token1,
      name: 'Successful Quiz',
      description: 'my quiz description'
    };
    quizId1 = requestMethod('post', '/v1/admin/quiz', quiz1).quizId;

    // Registering user 2
    user2 = {
      email: 'madhu@gmail.com',
      password: 'StrongPassword1',
      nameFirst: 'Madhu',
      nameLast: 'Shrestha'
    };
    token2 = requestMethod('post', '/v1/admin/auth/register', user2).token;

    // Creating quiz 2 - belongs to user 2 skfjlsfs
    quiz2 = {
      token: token2,
      name: 'Successful Quiz',
      description: 'my quiz description'
    };
    quizId2 = requestMethod('post', '/v1/admin/quiz', quiz2).quizId;
  });

  // 200, successful updating name of quiz
  test('successful updating name of quiz', () => {
    // Calling quiz info function
    const res = requestMethod('put', `/v2/admin/quiz/${quizId1}/name`, { name: 'IChangedThis' }, { token: token1 });
    expect(() => res).not.toThrow(HTTPError[401]);
    expect(res).toStrictEqual({});

    // Expecting quiz info to have updated quiz name
    const res2 = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });
    expect(() => res2).not.toThrow(HTTPError[401]);
    expect(res2).toStrictEqual({
      quizId: quizId1,
      name: 'IChangedThis',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: expect.any(String),
      numQuestions: 0,
      questions: [],
      duration: 0
    });
  });

  // Error 400, invalid quizId parameters
  test('invalid quizId not owned by user', () => {
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId2}/name`, { name: 'IChangedThis' }, { token: token1 })).toThrow(HTTPError[400]);
  });

  // Error 400, quiz name already used'
  test('quiz name already used', () => {
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId2}/name`, { name: quiz2.name }, { token: token1 })).toThrow(HTTPError[400]);
  });

  // Error 400, 'quizname not accepted lenght
  test('quizname not accepted len ', () => {
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId2}/name`, { name: 'a' }, { token: token1 })).toThrow(HTTPError[400]);
  });

  test('invalid quizId', () => {
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId1 - 99999}/name`, { name: 'IChangedThis' }, { token: token1 })).toThrow(HTTPError[400]);
  });

  // Error 401, token is not in a valid structure
  test('token is not a valid structure, error', () => {
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId1}/name`, { name: 'IChangedThis' }, { token: 'safdiosfadoih3$' })).toThrow(HTTPError[401]);
  });

  // Error 403, token is not for a currently logged in session
  test('token is valid structure, but is not for a currently logged in session', () => {
    // Log user 1 with token 1 out
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });

    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId1}/name`, { name: 'IChangedThis' }, { token: token1 })).toThrow(HTTPError[403]);
  });
});

// --------- HTTP wrapper tests for adminQuizDescriptionUpdate ----------
describe('v1 HTTP adminQuizDescriptionUpdate', () => {
  let token: string, quizId: number, quiz: quizType;
  beforeEach(() => {
    const user = {
      email: 'name123@gmail.com',
      password: 'password1',
      nameFirst: 'Firstname',
      nameLast: 'Lastname'
    };
    token = JSON.parse(String(postMethod('/v1/admin/auth/register', user).body)).token;
    quiz = { token, name: 'fay', description: 'my quiz description' };
    quizId = JSON.parse(String(postMethod('/v1/admin/quiz', quiz).body)).quizId;
  });

  // Quiz ID does not refer to a valid quiz
  test('Testing invalid quizID', () => {
    const quiz2 = { token, description: 'hahahahhahahahah' };
    const description = quiz2.description;
    const res = putMethod(`/v1/admin/quiz/${quizId - 999}/description`,
      { token, description: description });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // Quiz ID does not refer to a quiz that this user owns
  test('Testing quizid not owned by user', () => {
    const user2 = {
      email: 'fay123@gmail.com',
      password: 'fay123',
      nameFirst: 'fay',
      nameLast: 'liang'
    };
    const token2 = JSON.parse(String(postMethod('/v1/admin/auth/register',
      user2).body)).token;
    const quiz2 = { token: token2, description: 'my quiz description' };
    const quizID2 = JSON.parse(String(postMethod('/v1/admin/quiz',
      quiz2).body)).quizId;
    const res = putMethod(`/v1/admin/quiz/${quizID2}/description`, quiz);
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // desc longer than 100 characters
  test('Testing desc > 100 chars with code 400', () => {
    const invalidDesc = 'A test for the allowed length of a quiz' +
    'description. This string is definitely longer than 100' +
    'characters and hence should give an error.';
    const quiz3 = { token, description: invalidDesc };
    const res = putMethod(`/v1/admin/quiz/${quizId}/description`, quiz3);
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // invalid token structure
  test('Testing token is not a valid structure', () => {
    const quiz3 = { token: 'testing', description: 'Testing' };
    const res = putMethod(`/v1/admin/quiz/${quizId}/description`, quiz3);
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  // not logged in
  test('Testing valid token but not logged in', () => {
    postMethod('/v1/admin/auth/logout', { token });
    const quiz3 = { token, description: 'testing' };
    const res = putMethod(`/v1/admin/quiz/${quizId}/description`, quiz3);
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
  });

  // successfully updates quiz
  test('Successfully updates quiz', () => {
    const quiz2 = { token, description: 'hahahahhahahahah' };
    const res = putMethod(`/v1/admin/quiz/${quizId}/description`,
      quiz2);
    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);

    const resOfQuizInfo = getMethod(`/v1/admin/quiz/${quizId}`, { token });
    const bodyObjOfQuizInfo = JSON.parse(String(resOfQuizInfo.body));
    expect(resOfQuizInfo.statusCode).toBe(OK);
    expect(bodyObjOfQuizInfo).toStrictEqual({
      quizId: quizId,
      name: 'fay',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'hahahahhahahahah',
      numQuestions: 0,
      questions: [],
      duration: 0
    });
  });

  test('someone else onwns this quiz', () => {
    const user2 = {
      email: 'hafsdsafh@unsw.edu.au',
      password: 'haysafaeh123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    // create token for registered user
    const token2 = requestMethod('post', '/v1/admin/auth/register', user2).token;
    const quiz2 = { name: 'goodfwef', description: 'my quiz description' };
    const quizid2 = requestMethod('post', '/v2/admin/quiz', quiz2, { token: token2 }).quizId;

    const res = putMethod(`/v1/admin/quiz/${quizid2}/description`, { token: token, description: 'fdsaifoffeef' });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
});

// --------- HTTP wrapper tests for adminQuizDescriptionUpdate ----------
// done
describe('v2 HTTP adminQuizDescriptionUpdate', () => {
  let token1: string, quizId: number, quiz: quizType;
  beforeEach(() => {
    const user = {
      email: 'name123@gmail.com',
      password: 'password1',
      nameFirst: 'Firstname',
      nameLast: 'Lastname'
    };
    token1 = requestMethod('post', '/v1/admin/auth/register', user).token;
    quiz = { name: 'fay', description: 'my quiz description' };
    quizId = requestMethod('post', '/v2/admin/quiz', quiz, { token: token1 }).quizId;
  });
  // Quiz ID does not refer to a valid quiz
  test('Testing invalid quizID', () => {
    const quiz2 = { description: 'hahahahhahahahah' };
    const description = quiz2.description;
    // const res =
    // requestMethod('put',`/v2/admin/quiz/${quizId - 999}/description`,
    // {description:description}, {token: token});
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId - 999}/description`,
      { description: description }, { token: token1 })).toThrow(HTTPError[400]);
    // expect(res).toStrictEqual(ERROR_STRING);
    // expect(res.statusCode).toBe(INPUT_ERROR);
  });
  // Quiz ID does not refer to a quiz that this user owns
  test('Testing quizid not owned by user', () => {
    const user2 = {
      email: 'fay123@gmail.com',
      password: 'fay12345',
      nameFirst: 'fay',
      nameLast: 'liang'
    };
    const token2 = requestMethod('post', '/v1/admin/auth/register', user2).token;
    const quiz2 = { name: 'hello', description: 'my quiz description' };
    const quizID2 = requestMethod('post', '/v2/admin/quiz', quiz2, { token: token2 }).quizId;
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizID2}/description`,
      quiz, { token: token1 })).toThrow(HTTPError[400]);
    // expect(res).toStrictEqual(ERROR_STRING);
    // expect(res.statusCode).toBe(INPUT_ERROR);
  });
  // desc longer than 100 characters
  test('Testing desc > 100 chars with code 400', () => {
    const invalidDesc = 'A test for the allowed length of a quiz' +
    'description. This string is definitely longer than 100' +
    'characters and hence should give an error.';
    const quiz3 = { description: invalidDesc };
    // const res = requestMethod('put',`/v2/admin/quiz/${quizId}/description`,
    // quiz3, {token: token});
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/description`,
      quiz3, { token: token1 })).toThrow(HTTPError[400]);
  });
  // invalid token structure
  test('Testing token is not a valid structure', () => {
    const quiz3 = { description: 'Testing' };
    // const res = requestMethod('put',`/v2/admin/quiz/${quizId}/description`,
    // quiz3, {token: 'testing'});
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/description`,
      quiz3, { token: 'testing' })).toThrow(HTTPError[401]);
    // expect(res).toStrictEqual(ERROR_STRING);
    // expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });
  // not logged in
  test('Testing valid token but not logged in', () => {
    console.log('token', token1);
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });
    const quiz3 = { description: 'testing' };
    // const res = requestMethod('put',`/v2/admin/quiz/${quizId}/description`,
    // quiz3, {token: token});
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/description`,
      quiz3, { token: token1 })).toThrow(HTTPError[403]);
  //   expect(res).toStrictEqual(ERROR_STRING);
  //   expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
  });
  // successfully updates quiz
  // TODO - ADD THUMBNAIL IN STRICTEQUAL
  test('Successfully updates quiz', () => {
    const quiz2 = { description: 'hahahahhahahahah' };
    // const res = requestMethod('put',`/v2/admin/quiz/${quizId}/description`,
    // quiz2, {token: token});
    expect(requestMethod('put', `/v2/admin/quiz/${quizId}/description`,
      quiz2, { token: token1 })).toStrictEqual({});
    const resOfQuizInfo = requestMethod('get', `/v1/admin/quiz/${quizId}`, { token: token1 }, {});
    expect(resOfQuizInfo).toStrictEqual({
      quizId: quizId,
      name: 'fay',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'hahahahhahahahah',
      numQuestions: 0,
      questions: [],
      duration: 0,
      // thumbnailUrl: expect.any(String)
    });
  });
});

// ----------- HTTP wrapper tests for adminQuizQuestionDelete -----------
describe('v1 HTTP adminQuizQuestionDelete', () => {
  let token: string, quizId:number, questionId: number,
    questionBody: questionType;

  beforeEach(() => {
    const user = {
      email: 'user1@gmail.com',
      password: '123456ABCdef$',
      nameFirst: 'Audemars',
      nameLast: 'Piguet'
    };
    token = JSON.parse(String(postMethod('/v1/admin/auth/register', user).body)).token;
    const quiz = { token: token, name: 'quizname', description: 'my quiz description' };
    quizId = JSON.parse(String(postMethod('/v1/admin/quiz', quiz).body)).quizId;

    questionBody = {
      question: 'Yes or no?',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      },
      {
        answer: 'No',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      }]
    };

    questionId = JSON.parse(String(
      postMethod(`/v1/admin/quiz/${quizId}/question`,
        { token: token, questionBody: questionBody }).body)).questionId;
  });

  // Question Id does not refer to a valid question within this quiz - 400
  test('Testing questionid not referring to valid question', () => {
    const res = deleteMethod(`/v1/admin/quiz/${quizId}/question/${questionId - 999}`,
      { token: token });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // Quiz ID does not refer to a valid quiz - 400
  test('Testing invalid quizID', () => {
    const res = deleteMethod(`/v1/admin/quiz/${quizId - 999}/question/${questionId}`,
      { token: token });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // Quiz ID does not refer to a quiz that this user owns - 400
  test('Testing quizid not owned by user', () => {
    const user2 = {
      email: 'user2@gmail.com',
      password: '123456789ABCdef$',
      nameFirst: 'Leon',
      nameLast: 'Breitling'
    };
    const token2 = JSON.parse(String(postMethod('/v1/admin/auth/register',
      user2).body)).token;
    const quiz2 = { token: token2, description: 'HAHAHHAHAH' };
    const quizID2 = JSON.parse(String(postMethod('/v1/admin/quiz',
      quiz2).body)).quizId;
    const questionBody2 = {
      question: 'yay or nay?',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'yay',
        correct: true
      },
      {
        answer: 'nay',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      }]
    };
    const questionID2 = JSON.parse(String(postMethod(`/v1/admin/quiz/${quizID2}/question`, { token: token, questionBody: questionBody2 }).body)).questionId;
    const res = deleteMethod(`/v1/admin/quiz/${quizID2}/question/${questionID2}`,
      { token: token });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // successfully deletes quiz - 200
  test('Successfully deletes quiz question', () => {
    // Checking question exists before in quiz info
    const resOfQuizInfo1 = getMethod(`/v1/admin/quiz/${quizId}`, { token });
    const bodyObjOfQuizInfo1 = JSON.parse(String(resOfQuizInfo1.body));
    expect(resOfQuizInfo1.statusCode).toBe(OK);
    expect(bodyObjOfQuizInfo1).toStrictEqual({
      quizId: quizId,
      name: 'quizname',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'my quiz description',
      numQuestions: 1,
      questions: [
        {
          questionId: questionId,
          question: 'Yes or no?',
          duration: 4,
          points: 5,
          answers: [{
            answerId: expect.any(Number),
            answer: 'Yes',
            colour: expect.any(String),
            correct: true
          },
          {
            answerId: expect.any(Number),
            answer: 'No',
            colour: expect.any(String),
            correct: false
          },
          {
            answerId: expect.any(Number),
            answer: 'Maybe',
            colour: expect.any(String),
            correct: false
          }]
        }
      ],
      duration: expect.any(Number)
    });

    // Deleting quiz question
    const res = deleteMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token });
    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);

    // Checking question is deleted from quiz in quiz info
    const resOfQuizInfo2 = getMethod(`/v1/admin/quiz/${quizId}`, { token });
    const bodyObjOfQuizInfo2 = JSON.parse(String(resOfQuizInfo2.body));
    expect(resOfQuizInfo2.statusCode).toBe(OK);
    expect(bodyObjOfQuizInfo2).toStrictEqual({
      quizId: quizId,
      name: 'quizname',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'my quiz description',
      numQuestions: 0,
      questions: [],
      duration: expect.any(Number)
    });
  });

  test('Successfully deletes quiz question from middle', () => {
    questionBody = {
      question: 'Yfasf',
      duration: 7,
      points: 3,
      answers: [{
        answer: 'wgaeawg',
        correct: true
      },
      {
        answer: 'age3wegw',
        correct: false
      },
      {
        answer: 'gewacgew',
        correct: false
      }]
    };
    const questionId2 = JSON.parse(String(postMethod(`/v1/admin/quiz/${quizId}/question`, { token: token, questionBody: questionBody }).body)).questionId;

    questionBody = {
      question: '6543245',
      duration: 2,
      points: 8,
      answers: [{
        answer: '11vgg1',
        correct: true
      },
      {
        answer: '116gsdg43',
        correct: false
      },
      {
        answer: 'sggsggg',
        correct: false
      }]
    };
    const questionId3 = JSON.parse(String(postMethod(`/v1/admin/quiz/${quizId}/question`, { token: token, questionBody: questionBody }).body)).questionId;

    questionBody = {
      question: '32423',
      duration: 2,
      points: 8,
      answers: [{
        answer: 'fsafdsa',
        correct: true
      },
      {
        answer: 'sdafds',
        correct: false
      },
      {
        answer: 'sadfdsaf',
        correct: false
      }]
    };
    const questionId4 = JSON.parse(String(postMethod(`/v1/admin/quiz/${quizId}/question`, { token: token, questionBody: questionBody }).body)).questionId;

    questionBody = {
      question: 'fsfffff',
      duration: 2,
      points: 8,
      answers: [{
        answer: 'sdfafa',
        correct: true
      },
      {
        answer: 'sdafdfdffs',
        correct: false
      },
      {
        answer: 'sadfffffdsaf',
        correct: false
      }]
    };
    const questionId5 = JSON.parse(String(postMethod(`/v1/admin/quiz/${quizId}/question`, { token: token, questionBody: questionBody }).body)).questionId;

    // Deleting quiz question
    const res = deleteMethod(`/v1/admin/quiz/${quizId}/question/${questionId2}`,
      { token: token });
    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);
  });
  // invalid token structure - 401
  test('Testing token is not a valid structure', () => {
    const token3 = 'notanumber';
    const res = deleteMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token3 });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  // not logged in - 403
  test('Testing valid token but not logged in', () => {
    const response = postMethod('/v1/admin/auth/logout', { token });

    expect(JSON.parse(String(response.body))).toStrictEqual({});

    const res = deleteMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
  });
});
// ===================== ITERATION 2 FUNCTION TESTS =====================
// ----------- HTTP wrapper tests for adminQuizQuestionDelete -----------
describe('v2 HTTP adminQuizQuestionDelete', () => {
  let token: string, quizId:number, questionId: number,
    questionBody: questionType;
  beforeEach(() => {
    const user = {
      email: 'user1@gmail.com',
      password: '123456ABCdef$',
      nameFirst: 'Audemars',
      nameLast: 'Piguet'
    };
    token = requestMethod('post', '/v1/admin/auth/register', user).token;
    const quiz = { name: 'fay', description: 'my quiz description' };
    quizId = requestMethod('post', '/v2/admin/quiz', quiz, { token: token }).quizId;
    questionBody = {
      question: 'Yes or no?',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      },
      {
        answer: 'No',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    questionId = requestMethod('post', `/v2/admin/quiz/${quizId}/question`, { questionBody: questionBody }, { token: token }).questionId;
  });
  // Question Id does not refer to a valid question within this quiz - 400
  test('Testing questionid not referring to valid question', () => {
    console.log('token', token);
    expect(() => requestMethod('delete', `/v2/admin/quiz/${quizId}/question/${questionId - 999}`,
      {}, { token: token })).toThrow(HTTPError[400]);
    // expect(res.statusCode).toBe(INPUT_ERROR);
  });
  // Quiz ID does not refer to a valid quiz - 400
  test('Testing invalid quizID', () => {
    expect(() => requestMethod('delete',
      `/v2/admin/quiz/${quizId - 999}/question/${questionId}`, {},
      { token: token })).toThrow(HTTPError[400]);
    // expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    // expect(res.statusCode).toBe(INPUT_ERROR);
  });
  // Quiz ID does not refer to a quiz that this user owns - 400
  test('Testing quizid not owned by user', () => {
    const user2 = {
      email: 'user2@gmail.com',
      password: '123456789ABCdef$',
      nameFirst: 'Leon',
      nameLast: 'Breitling'
    };
    const token2 = requestMethod('post', '/v1/admin/auth/register', user2).token;

    const quiz2 = { name: 'jeremy', description: 'HAHAHHAHAH' };
    const quizID2 = requestMethod('post', '/v2/admin/quiz', quiz2, { token: token2 }).quizId;

    const questionBody2 = {
      question: 'yay or nay?',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'yay',
        correct: true
      },
      {
        answer: 'nay',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    requestMethod('get', `/v2/admin/quiz/${quizId}`, {}, { token: token });

    const questionID2 = requestMethod('post', `/v2/admin/quiz/${quizID2}/question`, { questionBody: questionBody2 }, { token: token2 }).questionId;
    expect(() => requestMethod('delete',
      `/v2/admin/quiz/${quizID2}/question/${questionID2}`, {},
      { token: token })).toThrow(HTTPError[400]);
    // expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    // expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('sessions not in end state - 400', () => {
    for (let i = 0; i < 1; i++) {
      expect(() => requestMethod('post',
      `/v1/admin/quiz/${quizId}/session/start`, { autoStartNum: 1 },
      { token: token })).not.toThrow(HTTPError[400]);
    }
    // timeSleepMs(2000);
    expect(() => requestMethod('delete',
      `/v2/admin/quiz/${quizId}/question/${questionId}`, {},
      { token: token })).toThrow(HTTPError[400]);
  });
  // successfully deletes quiz - 200
  // quizinfo needs to be updated - skip
  // adminquizquestiondelete successfully deletes
  test('Successfully deletes quiz question', () => {
    // Checking question exists before in quiz info
    const resOfQuizInfo1 = requestMethod('get', `/v2/admin/quiz/${quizId}`, {}, { token: token });

    // expect(resOfQuizInfo1.statusCode).toBe(OK);
    expect(resOfQuizInfo1).toStrictEqual({
      quizId: quizId,
      name: 'fay',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'my quiz description',
      numQuestions: 1,
      questions: [
        {
          questionId: questionId,
          question: 'Yes or no?',
          duration: 4,
          // thumbnailUrl: expect.any(String),
          points: 5,
          answers: [{
            answerId: expect.any(Number),
            answer: 'Yes',
            colour: expect.any(String),
            correct: true
          },
          {
            answerId: expect.any(Number),
            answer: 'No',
            colour: expect.any(String),
            correct: false
          },
          {
            answerId: expect.any(Number),
            answer: 'Maybe',
            colour: expect.any(String),
            correct: false
          }],
          thumbnailUrl: ANY_STRING
        }
      ],
      duration: expect.any(Number),
      thumbnailUrl: expect.any(String)
    });
    // Deleting quiz question

    expect(requestMethod('delete', `/v2/admin/quiz/${quizId}/question/${questionId}`, {}, { token: token })).toStrictEqual({});
    // expect(JSON.parse(String(res.body))).toStrictEqual({});
    // expect(res.statusCode).toBe(OK);
    // Checking question is deleted from quiz in quiz info
    const resOfQuizInfo2 =
    requestMethod('get', `/v2/admin/quiz/${quizId}`, {}, { token: token });
    // expect(resOfQuizInfo2.statusCode).toBe(OK);
    expect(resOfQuizInfo2).toStrictEqual({
      quizId: quizId,
      name: 'fay',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'my quiz description',
      numQuestions: 0,
      questions: [],
      duration: expect.any(Number),
      thumbnailUrl: expect.any(String)
    });
  });

  test('Successfully deletes quiz question from middle', () => {
    questionBody = {
      question: 'Yfaasf',
      duration: 7,
      points: 3,
      answers: [{
        answer: 'wgaeawg',
        correct: true
      },
      {
        answer: 'age3wegw',
        correct: false
      },
      {
        answer: 'gewacgew',
        correct: false
      }],
      thumbnailUrl: LEBRONJAMES_JPG
    };
    const questionId2 = requestMethod('post', `/v2/admin/quiz/${quizId}/question`, { questionBody: questionBody }, { token: token }).questionId;

    questionBody = {
      question: '353fdfddfs',
      duration: 2,
      points: 8,
      answers: [{
        answer: '11vgg1',
        correct: true
      },
      {
        answer: '116gsdg43',
        correct: false
      },
      {
        answer: 'sggsggg',
        correct: false
      }],
      thumbnailUrl: LEBRONJAMES_JPG
    };
    const questionId3 = requestMethod('post', `/v2/admin/quiz/${quizId}/question`, { questionBody: questionBody }, { token: token }).questionId;

    // Deleting quiz question
    expect(requestMethod('delete', `/v2/admin/quiz/${quizId}/question/${questionId2}`, {}, { token: token })).toStrictEqual({});
  });
  // invalid token structure - 401
  test('Testing token is not a valid structure', () => {
    const token3 = 'notanumber';
    expect(() => requestMethod('delete',
      `/v2/admin/quiz/${quizId}/question/${questionId}`, {},
      { token: token3 })).toThrow(HTTPError[401]);
    // expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    // expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });
  // not logged in - 403
  test('Testing valid token but not logged in', () => {
    expect(requestMethod('post', '/v2/admin/auth/logout', {}, { token: token })).toStrictEqual({});

    expect(() => requestMethod('delete',
      `/v2/admin/quiz/${quizId}/question/${questionId}`, {},
      { token: token })).toThrow(HTTPError[403]);
    // expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    // expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
  });
});

// ---------- HTTP wrapper tests for adminQuizQuestionUpdate ------------
describe('v1 HTTP adminQuizQuestionUpdate', () => {
  let token: string, quizId: number, questionId: number,
    quiz: quizType, questionBody: questionType;

  beforeEach(() => {
    const user = {
      email: 'name123@gmail.com',
      password: 'password1',
      nameFirst: 'Firstname',
      nameLast: 'Lastname'
    };

    token = JSON.parse(String(postMethod('/v1/admin/auth/register', user).body)).token;

    questionBody = {
      question: 'Yes or no?',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      },
      {
        answer: 'No',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      }]
    };

    quiz = { token, name: 'fay', description: 'hahahaa' };
    quizId = JSON.parse(String(postMethod('/v1/admin/quiz',
      quiz).body)).quizId;
    const res = postMethod(`/v1/admin/quiz/${quizId}/question`, { token: token, questionBody: questionBody });

    questionId = JSON.parse(String(res.body)).questionId;
  });

  // Question string is less than 5 characters in length or greater than 50 characters in length
  test('testing question string < 5 char', () => {
    const invalidQuestion = {
      question: 'y',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      },
      {
        answer: 'No',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      }]
    };

    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: invalidQuestion });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('testing string > 50 char', () => {
    const invalidQuestion = {
      question: 'hahhhhahhhhahhhhahhhhahhhhahhhhahhhhahhhhahhhhahhhhahhh',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      },
      {
        answer: 'No',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      }]
    };

    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token, questionBody: invalidQuestion });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // The question has more than 6 answers or less than 2 answers
  test('testing question more than 6 answers', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      },
      {
        answer: 'No',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      },
      {
        answer: 'potentially',
        correct: false
      },
      {
        answer: 'perhaps',
        correct: false
      },
      {
        answer: 'yeah',
        correct: false
      },
      {
        answer: 'ye',
        correct: false
      }]
    };
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: invalidQuestion });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('testing question < 2  answers', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'N',
        correct: true
      }]
    };
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: invalidQuestion });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('testing question < 2  answers', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: -2,
      points: 5,
      answers: [{
        answer: 'N',
        correct: true
      },
      {
        answer: 'N32g2',
        correct: false
      }]
    };
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: invalidQuestion });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  test('no correct answesrs', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'N',
        correct: false
      },
      {
        answer: 'Nfwefa',
        correct: false
      }]
    };

    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: invalidQuestion });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
  // If this question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes
  test('testing sum of question duration > 3 minutes', () => {
    const questionBody3 = {
      question: 'whos joe joe mama',
      duration: 181,
      points: 5,
      answers: [{
        answer: 'hehehssehehe',
        correct: true
      },
      {
        answer: 'bbnbnssbnbn',
        correct: false
      },
      {
        answer: 'boooooooooo',
        correct: false
      }]
    };
    // this will make it go over 180
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: questionBody3 });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // The points awarded for the question are less than 1 or greater than 10
  test('testing points awarded less than 1', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 0,
      answers: [{
        answer: 'N',
        correct: true
      },
      {
        answer: 'Nfdsaf',
        correct: false
      }]
    };
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: invalidQuestion });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('testing points awarded greater than 10', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 11,
      answers: [{
        answer: 'N',
        correct: true
      },
      {
        answer: 'Nfdsaf',
        correct: false
      }]
    };
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: invalidQuestion });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // The length of any answer is shorter than 1 character long, or longer than 30 characters long
  test('testing answer length < 1 char', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 9,
      answers: [{
        answer: '',
        correct: true
      },
      {
        answer: 'potentially',
        correct: false
      },
      {
        answer: '',
        correct: false
      },
      {
        answer: 'Nfdsaf',
        correct: false
      }]
    };
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: invalidQuestion });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('testing ansswer length > 30 char', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 8,
      answers: [{
        answer: 'maybemaybemaybemaybemaybemaybemaybe',
        correct: true
      },
      {
        answer: 'yes',
        correct: false
      },
      {
        answer: 'Nfdsaf',
        correct: false
      }]
    };
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: invalidQuestion });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // Any answer strings are duplicates of one another (within the same question)
  test('testing duplicate answers', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 9,
      answers: [{
        answer: 'yes',
        correct: true
      },
      {
        answer: 'yes',
        correct: true
      },
      {
        answer: 'maybe',
        correct: false
      }]
    };
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: invalidQuestion });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // There are no correct answers
  test('testing answer length > 30 char', () => {
    const invalidQuestion = {
      question: 'No or yes?',
      duration: 4,
      points: 8,
      answers: [{
        answer: 'no',
        correct: false
      },
      {
        answer: 'yes',
        correct: false
      },
      {
        answer: 'maybe',
        correct: false
      }]
    };
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: invalidQuestion });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // Question Id does not refer to a valid question within this quiz
  test('testing questionid not referring to valid question', () => {
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId - 999}`,
      { token: token, questionBody: questionBody });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // Quiz ID does not refer to a valid quiz
  test('testing invalid quizID', () => {
    const res = putMethod(`/v1/admin/quiz/${quizId - 999}/question/${questionId}`,
      { token: token, questionBody: questionBody });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // Quiz ID does not refer to a quiz that this user owns
  test('testing quizid not owned by user', () => {
    const user2 = {
      email: 'fay123@gmail.com',
      password: 'fay123123fay',
      nameFirst: 'fay',
      nameLast: 'liang'
    };
    const token2 = JSON.parse(String(postMethod('/v1/admin/auth/register',
      user2).body)).token;

    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      {
        token: token2,
        questionBody: {
          question: 'yo wassup',
          duration: 53,
          points: 3,
          answers: [
            {
              answer: 'fage',
              correct: false
            },
            {
              answer: 'gewaewg',
              correct: false
            },
            {
              answer: 'ahwehawe',
              correct: true
            }
          ]
        }
      });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // duration is not a positive value
  test('testing token is not a valid structure', () => {
    const invalidQuestionBody = {
      question: 'Yes or no?',
      duration: -1,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      }]
    };
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: invalidQuestionBody });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // invalid token structure
  test('testing token is not a valid structure', () => {
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: 'ug3298h$89*#THg[d', questionBody: questionBody });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  // not logged in
  test('testing valid token but not logged in', () => {
    postMethod('/v1/admin/auth/logout', { token: token });
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: questionBody });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
  });

  // successfully updates quiz
  test('Successfully updates quiz', () => {
    const questionBody2 = {
      question: 'IChangedThis',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'Yes',
          correct: true
        },
        {
          answer: 'Cool',
          correct: false
        }
      ]
    };

    // Calling question update
    const res = putMethod(`/v1/admin/quiz/${quizId}/question/${questionId}`,
      { token: token, questionBody: questionBody2 });
    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);

    // Checking question is updated in quiz info
    const resOfQuizInfo = getMethod(`/v1/admin/quiz/${quizId}`, { token });
    const bodyObjOfQuizInfo = JSON.parse(String(resOfQuizInfo.body));
    expect(resOfQuizInfo.statusCode).toBe(OK);
    expect(bodyObjOfQuizInfo).toStrictEqual({
      quizId: quizId,
      name: 'fay',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'hahahaa',
      numQuestions: 1,
      questions: [
        {
          questionId: questionId,
          question: 'IChangedThis',
          duration: 4,
          points: 5,
          answers: [{
            answerId: expect.any(Number),
            answer: 'Yes',
            colour: expect.any(String),
            correct: true,
          },
          {
            answerId: expect.any(Number),
            answer: 'Cool',
            colour: expect.any(String),
            correct: false,
          }]
        }
      ],
      duration: expect.any(Number),
    });
  });
});

// ---------- HTTP wrapper tests for adminQuizQuestionUpdate ------------
describe('v2 HTTP adminQuizQuestionUpdate', () => {
  let token: string, quizId: number, questionId: number,
    quiz: quizType, questionBody: questionType;
  beforeEach(() => {
    const user = {
      email: 'name123@gmail.com',
      password: 'password1',
      nameFirst: 'Firstname',
      nameLast: 'Lastname'
    };
    token = requestMethod('post', '/v1/admin/auth/register', user).token;
    questionBody = {
      question: 'Yes or no?',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      },
      {
        answer: 'No',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      }],
      thumbnailUrl: LEBRONJAMES_JPG
    };
    quiz = { name: 'fay', description: 'hahahaa' };
    quizId = requestMethod('post', '/v2/admin/quiz', quiz, { token: token }).quizId;
    questionId = requestMethod('post', `/v2/admin/quiz/${quizId}/question`, { questionBody: questionBody }, { token: token }).questionId;
  });
  // Question string is less than 5 characters in length or greater than 50 characters in length
  test('testing question string < 5 char - 400', () => {
    const invalidQuestion = {
      question: 'y',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      },
      {
        answer: 'No',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestion }, { token: token })).toThrow(HTTPError[400]);
  });
  // q string > 50
  test('testing string > 50 char - 400', () => {
    const invalidQuestion = {
      question: 'hahhhhahhhhahhhhahhhhahhhhahhhhahhhhahhhhahhhhahhhhahhh',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      },
      {
        answer: 'No',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestion }, { token: token })).toThrow(HTTPError[400]);
  });
  // The question has more than 6 answers or less than 2 answers
  test('testing question more than 6 answers - 400', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      },
      {
        answer: 'No',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      },
      {
        answer: 'potentially',
        correct: false
      },
      {
        answer: 'perhaps',
        correct: false
      },
      {
        answer: 'yeah',
        correct: false
      },
      {
        answer: 'ye',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };

    //   { token: token, questionBody: invalidQuestion });
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestion }, { token: token })).toThrow(HTTPError[400]);
  });
  // less than 2 answers
  test('testing question < 2  answers - 400', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'N',
        correct: true
      }]
    };

    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestion }, { token: token })).toThrow(HTTPError[400]);
  });

  test('no correct answesrs', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'N',
        correct: false
      },
      {
        answer: 'Nfwefa',
        correct: false
      }]
    };

    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestion }, { token: token })).toThrow(HTTPError[400]);
  });
  // If this question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes
  test('testing sum of question duration > 3 minutes', () => {
    const questionBody3 = {
      question: 'whos joe joe mama',
      duration: 181,
      points: 5,
      answers: [{
        answer: 'hehehssehehe',
        correct: true
      },
      {
        answer: 'bbnbnssbnbn',
        correct: false
      },
      {
        answer: 'boooooooooo',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    // this will make it go over 180

    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: questionBody3 }, { token: token })).toThrow(HTTPError[400]);
  });
  // The points awarded for the question are less than 1
  test('testing points awarded less than 1', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 0,
      answers: [{
        answer: 'N',
        correct: true
      },
      {
        answer: 'Nfasdsa',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestion }, { token: token })).toThrow(HTTPError[400]);
  });
  test('q duration less than 0 ', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: -1,
      points: 5,
      answers: [{
        answer: 'N',
        correct: true
      },
      {
        answer: 'Nfasdsa',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestion }, { token: token })).toThrow(HTTPError[400]);
  });
  // The points awarded for the question are greater than 10
  test('testing points awarded greater than 10', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 11,
      answers: [{
        answer: 'N',
        correct: true
      },
      {
        answer: 'Nfasdsa',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestion }, { token: token })).toThrow(HTTPError[400]);
  });
  // The length of any answer is shorter than 1 character long, or longer than 30 characters long
  test('testing answer length < 1 char', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 8,
      answers: [{
        answer: '',
        correct: true
      },
      {
        answer: 'potentially',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestion }, { token: token })).toThrow(HTTPError[400]);
  });
  // ans length > 30
  test('testing ansswer length > 30 char', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 8,
      answers: [{
        answer: 'maybemaybemaybemaybemaybemaybemaybe',
        correct: true
      },
      {
        answer: 'yes',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    //   { token: token, questionBody: invalidQuestion });
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestion }, { token: token })).toThrow(HTTPError[400]);
  });
  // Any answer strings are duplicates of one another (within the same question)
  test('testing duplicate answers', () => {
    const invalidQuestion = {
      question: 'testing',
      duration: 4,
      points: 9,
      answers: [{
        answer: 'yes',
        correct: true
      },
      {
        answer: 'yes',
        correct: true
      },
      {
        answer: 'maybe',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestion }, { token: token })).toThrow(HTTPError[400]);
  });
  // There are no correct answers
  test('testing answer length > 30 char', () => {
    const invalidQuestion = {
      question: 'No or yes?',
      duration: 4,
      points: 8,
      answers: [{
        answer: 'no',
        correct: false
      },
      {
        answer: 'yes',
        correct: false
      },
      {
        answer: 'maybe',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestion }, { token: token })).toThrow(HTTPError[400]);
  });
  // Question Id does not refer to a valid question within this quiz
  test('testing questionid not referring to valid question', () => {
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId - 999}`,
      { questionBody: questionBody }, { token: token })).toThrow(HTTPError[400]);
  });
  // Quiz ID does not refer to a valid quiz
  test('testing invalid quizID', () => {
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId - 999}/question/${questionId}`,
      { questionBody: questionBody }, { token: token })).toThrow(HTTPError[400]);
  });

  // Quiz ID does not refer to a quiz that this user owns
  test('testing quizid not owned by user', () => {
    const user2 = {
      email: 'fay123@gmail.com',
      password: 'fay123123fay',
      nameFirst: 'fay',
      nameLast: 'liang'
    };
    const token2 = requestMethod('post', '/v1/admin/auth/register',
      user2).token;
    const questionBody = {
      question: 'yo wassup',
      duration: 53,
      points: 3,
      answers: [
        {
          answer: 'fage',
          correct: false
        },
        {
          answer: 'gewaewg',
          correct: false
        },
        {
          answer: 'ahwehawe',
          correct: true
        }
      ],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: questionBody }, { token: token2 })).toThrow(HTTPError[400]);
  });
  // duration is not a positive value
  test('testing token is not a valid structure', () => {
    const invalidQuestionBody = {
      question: 'Yes or no?',
      duration: -1,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestionBody }, { token: token })).toThrow(HTTPError[400]);
  });
  // invalid token structure
  test('testing token is not a valid structure', () => {
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: questionBody },
      { token: 'ug3298h$89*#THg[d' })).toThrow(HTTPError[401]);
  });
  // not logged in
  test('testing valid token but not logged in', () => {
    expect(requestMethod('post', '/v2/admin/auth/logout', {}, { token: token })).toStrictEqual({});

    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: questionBody },
      { token: token })).toThrow(HTTPError[403]);
  });
  // THumbnial url is empty string
  test('testing thumbnail url is empty string - 400', () => {
    const invalidQuestionBody = {
      question: 'Yes or no?',
      duration: 2,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      },
      {
        answer: 'fwea',
        correct: false
      }],
      thumbnailUrl: ''
    };
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestionBody }, { token: token })).toThrow(HTTPError[400]);
  });
  // The thumbnailUrl, when fetched, is not a JPG or PNg file type
  test('The thumbnailUrl, when fetched, is not a JPG or PNg file type - 400', () => {
    const invalidQuestionBody = {
      question: 'Yes or no?',
      duration: 2,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      }, {
        answer: 'fwea',
        correct: false
      }],
      thumbnailUrl:
      'https://www.taste.com.au/recipes/chocolate-chip-cookies-2/1bfaa0e6-13b4-489d-bbd8-1cc5caf1fa32'
    };
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestionBody }, { token: token })).toThrow(HTTPError[400]);
  });
  // TODO: The thumbnailUrl does not return to a valid file
  test('The thumbnailUrl does not return to a valid file - 400', () => {
    const invalidQuestionBody = {
      question: 'Yes or no?',
      duration: 2,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      }, {
        answer: 'fwea',
        correct: false
      }],
      thumbnailUrl: 'https://images.pexels.com/photos/145202983aslkdjqowij'
    };
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: invalidQuestionBody }, { token: token })).toThrow(HTTPError[400]);
  });
  // different thumbnail format testing
  test('thumbnail url w query passed in - 200', () => {
    const questionBody2 = {
      question: 'hi or bye?',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'hi',
        correct: true
      },
      {
        answer: 'bye',
        correct: false
      },
      {
        answer: 'go away',
        correct: false
      }],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    expect(requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: questionBody2 }, { token: token })).toStrictEqual({});
  });
  // successfully updates quiz - SKIP ADMINQUIZINFO NOT IMPLEMENTED
  test('Successfully updates quiz', () => {
    const questionBody2 = {
      question: 'IChangedThis',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'Yes',
          correct: true
        },
        {
          answer: 'Cool',
          correct: false
        }
      ],
      thumbnailUrl:
      LEBRONJAMES_JPG
    };
    // Calling question update

    expect(requestMethod('put', `/v2/admin/quiz/${quizId}/question/${questionId}`,
      { questionBody: questionBody2 },
      { token: token })).toStrictEqual({});
    // Checking question is updated in quiz info
    const resOfQuizInfo =
    requestMethod('get', `/v2/admin/quiz/${quizId}`, {}, { token: token });
    expect(resOfQuizInfo).toStrictEqual({
      quizId: quizId,
      name: 'fay',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'hahahaa',
      numQuestions: 1,
      questions: [
        {
          questionId: questionId,
          question: 'IChangedThis',
          duration: 4,
          // thumbnailUrl: expect.any(String),
          points: 5,
          answers: [{
            answerId: expect.any(Number),
            answer: 'Yes',
            colour: expect.any(String),
            correct: true,
          },
          {
            answerId: expect.any(Number),
            answer: 'Cool',
            colour: expect.any(String),
            correct: false,
          }],
          thumbnailUrl: ANY_STRING
        }
      ],
      duration: expect.any(Number),
      thumbnailUrl: expect.any(String)
    });
  });
});

// ----------- HTTP wrapper tests for adminQuizQuestionMove -------------
describe('v1 HTTP adminQuizQuestionMove', () => {
  let token1: string, token2: string;
  let quizId1: number, quizId2: number;
  let quiz1: quizType;
  let questionId1: number, questionId2: number;
  let res: any;
  beforeEach(() => {
    // User1
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', {
      email: 'user1@gmail.com',
      password: '123456ABCdef$',
      nameFirst: 'Audemars',
      nameLast: 'Piguet'
    }).body)).token;

    // create quiz successfully
    quiz1 = { token: token1, name: 'name', description: 'desc' };
    quizId1 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz1).body)).quizId;

    // create question succesfully
    let qBody = {
      token: token1,
      questionBody: {
        question: 'first question',
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
        ]
      }
    };
    questionId1 = JSON.parse(String(postMethod(`/v1/admin/quiz/${quizId1}/question`, qBody).body)).questionId;

    // create second question successfully
    qBody = {
      token: token1,
      questionBody: {
        question: 'second question',
        duration: 4,
        points: 5,
        answers: [
          {
            answer: 'Buzz',
            correct: true
          },
          {
            answer: 'Neil',
            correct: false
          },
          {
            answer: 'Ur mum',
            correct: false
          }
        ]
      }
    };
    questionId2 = JSON.parse(String(postMethod(`/v1/admin/quiz/${quizId1}/question`, qBody).body)).questionId;
  });

  // token not in structure (token structure error)
  test('invalid token with code 401', () => {
    // invalid token
    const bodyInput = { token: 'fijaofjdosajiofdo', newPosition: 1 };

    res = putMethod(`/v1/admin/quiz/${quizId1}/question/${questionId1}/move`, bodyInput);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  test('token session not logged in with code 403', () => {
    // logout the user first
    postMethod('/v1/admin/auth/logout', { token: token1 });

    const bodyInput = { token: token1, newPosition: 1 };
    res = putMethod(`/v1/admin/quiz/${quizId1}/question/${questionId1}/move`, bodyInput);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
  });

  test('Quiz ID does not refer to a quiz the user owns (code 400)', () => {
    token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', {
      email: 'user2@gmail.com',
      password: '123456789ABCdef$',
      nameFirst: 'Leon',
      nameLast: 'Breitling'
    }).body)).token;

    // create second quiz
    const quiz2 = { token2, name: 'second', description: '' };
    quizId2 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz2).body)).quizId;

    // create question in second quiz
    let qBody = {
      token: token1,
      questionBody: {
        question: 'quiz2 question',
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
        ]
      }
    };
    // create question succesfully
    const questionId1Quiz2 = JSON.parse(String(postMethod(`/v1/admin/quiz/${quizId2}/question`, qBody).body)).questionId;

    qBody = {
      token: token1,
      questionBody: {
        question: 'quiz2 question number 2',
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
        ]
      }
    };
    // create second question succesfully
    postMethod(`/v1/admin/quiz/${quizId2}/question`, qBody);
    const bodyInput = { token: token1, newPosition: 1 };
    // should fail since quiz2 belongs to token 2 not token 1
    res = putMethod(`/v1/admin/quiz/${quizId2}/question/${questionId1Quiz2}/move`, bodyInput);

    // user1 can't access quiz2
    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);

    // also check the other way - user2 can't access quiz1
    const bodyInput2 = { token: token2, newPosition: 1 };
    // should also fail since quiz1 belongs to token 1 not token 2
    res = putMethod(`/v1/admin/quiz/${quizId1}/question/${questionId1}/move`, bodyInput2);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Question id does not exist in quiz (code 400)', () => {
    const bodyInput = { token: token1, newPosition: 1 };
    // testing bogus questionid
    res = putMethod(`/v1/admin/quiz/${quizId1}/question/${-1}/move`, bodyInput);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('New position is less than 0 (code 400)', () => {
    // new position invalid
    const bodyInput = { token: token1, newPosition: -1 };
    res = putMethod(`/v1/admin/quiz/${quizId1}/question/${questionId1}/move`, bodyInput);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('New position is more than n-1 (code 400)', () => {
    // new position invalid as its greater than 1
    const bodyInput = { token: token1, newPosition: 2 };
    res = putMethod(`/v1/admin/quiz/${quizId1}/question/${questionId1}/move`, bodyInput);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('New position is same as old position (code 400)', () => {
    // new position invalid as its same as old position
    const bodyInput = { token: token1, newPosition: 0 };
    res = putMethod(`/v1/admin/quiz/${quizId1}/question/${questionId1}/move`, bodyInput);

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);

    // similarly, the second question can't be moved to be in its same spot
    const bodyInput2 = { token: token1, newPosition: 1 };
    res = putMethod(`/v1/admin/quiz/${quizId1}/question/${questionId2}/move`, bodyInput2);

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Successfully move quiz to start (code 200)', () => {
    // move question2 to start
    const bodyInput = { token: token1, newPosition: 0 };
    res = putMethod(`/v1/admin/quiz/${quizId1}/question/${questionId2}/move`, bodyInput);

    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);

    // integration testing
    res = getMethod(`/v1/admin/quiz/${quizId1}`, { token: token1 });
    expect(res.statusCode).toBe(OK);

    // order should be swapped
    expect(JSON.parse(String(res.body))).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 2,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
      ],
      duration: expect.any(Number),
    });
  });

  test('Successfully move quiz to end (code 200)', () => {
    // move question1 to end
    const bodyInput = { token: token1, newPosition: 1 };
    res = putMethod(`/v1/admin/quiz/${quizId1}/question/${questionId1}/move`, bodyInput);

    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);

    // integration testing
    res = getMethod(`/v1/admin/quiz/${quizId1}`, { token: token1 });
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(String(res.body))).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 2,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
      ],
      duration: expect.any(Number),
    });
  });

  test('Successfully move quiz from start to middle (code 200)', () => {
    // create third question in the quiz
    const qBody = {
      token: token1,
      questionBody: {
        question: 'third question',
        duration: 4,
        points: 5,
        answers: [
          {
            answer: 'Hayden',
            correct: true
          },
          {
            answer: 'Neil',

            correct: false
          },
          {
            answer: 'Ur mum',

            correct: false
          }
        ]
      }
    };
    // create third question successfully
    res = postMethod(`/v1/admin/quiz/${quizId1}/question`, qBody);

    const bodyInput = { token: token1, newPosition: 1 };
    res = putMethod(`/v1/admin/quiz/${quizId1}/question/${questionId1}/move`, bodyInput);

    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);

    res = getMethod(`/v1/admin/quiz/${quizId1}`, { token: token1 });
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(String(res.body))).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 3,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'third question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Hayden',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
      ],
      duration: expect.any(Number),
    });
  });

  test('Successfully move quiz from end to middle (code 200)', () => {
    const qBody = {
      token: token1,
      questionBody: {
        question: 'third question',
        duration: 4,
        points: 5,
        answers: [
          {
            answer: 'Hayden',
            correct: true
          },
          {
            answer: 'Neil',
            correct: false
          },
          {
            answer: 'Ur mum',
            correct: false
          }
        ]
      }
    };
    // create third question successfully
    res = postMethod(`/v1/admin/quiz/${quizId1}/question`, qBody);
    const questionId3 = JSON.parse(String(res.body)).questionId;

    const bodyInput = { token: token1, newPosition: 1 };
    res = putMethod(`/v1/admin/quiz/${quizId1}/question/${questionId3}/move`, bodyInput);

    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);

    res = getMethod(`/v1/admin/quiz/${quizId1}`, { token: token1 });
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(String(res.body))).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 3,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'third question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Hayden',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        }
      ],
      duration: expect.any(Number),
    });
  });
});

// ----------- HTTP wrapper tests for adminQuizQuestionMove -------------
describe('v2 HTTP adminQuizQuestionMove', () => {
  let token1: string, token2: string;
  let quizId1: number, quizId2: number;
  let quiz1: quizType;
  let questionId1: number, questionId2: number;
  let res: any;
  beforeEach(() => {
    // User1
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', {
      email: 'user1@gmail.com',
      password: '123456ABCdef$',
      nameFirst: 'Audemars',
      nameLast: 'Piguet'
    }).body)).token;

    // create quiz successfully
    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'name', description: 'desc' }, { token: token1 }).quizId;
    // create question succesfully
    let qBody = {
      questionBody: {
        question: 'first question',
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
    };
    questionId1 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`, qBody, { token: token1 }).questionId;

    qBody = {
      questionBody: {
        question: 'second question',
        duration: 4,
        points: 5,
        answers: [
          {
            answer: 'Buzz',
            correct: true
          },
          {
            answer: 'Neil',
            correct: false
          },
          {
            answer: 'Ur mum',
            correct: false
          }
        ],
        thumbnailUrl: LEBRONJAMES_JPG
      }
    };

    questionId2 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`, qBody, { token: token1 }).questionId;
  });

  // token not in structure (token structure error)
  test('invalid token with code 401 403', () => {
    // invalid token

    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId1}/question/${questionId1}/move`, { newPosition: 1 }, { token: 'fijaofjdosajiofdo' })).toThrow(HTTPError[401]);

    // logout the user first
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });

    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId1}/question/${questionId1}/move`, { newPosition: 1 }, { token: token1 })).toThrow(HTTPError[403]);
  });

  test('Quiz ID does not refer to a quiz the user owns (code 400)', () => {
    token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', {
      email: 'user2@gmail.com',
      password: '123456789ABCdef$',
      nameFirst: 'Leon',
      nameLast: 'Breitling'
    }).body)).token;

    // create second quiz

    quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'second', description: 'desc111' }, { token: token2 }).quizId;

    // create question in second quiz
    const qBody = {
      questionBody: {
        question: 'first question',
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
    };
    const questionId1Quiz2 = requestMethod('post', `/v2/admin/quiz/${quizId2}/question`, qBody, { token: token2 }).questionId;

    // create second question succesfully
    // should fail since quiz2 belongs to token 2 not token 1
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId2}/question/${questionId1Quiz2}/move`, { newPosition: 1 }, { token: token1 })).toThrow(HTTPError[400]);

    // also check the other way - user2 can't access quiz1
    // should also fail since quiz1 belongs to token 1 not token 2
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId1}/question/${questionId1}/move`, { newPosition: 1 }, { token: token2 })).toThrow(HTTPError[400]);

    // testing bogus questionid
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId1}/question/${-1}/move`, { newPosition: 1 }, { token: token1 })).toThrow(HTTPError[400]);
  });

  test('New position is wrong (code 400)', () => {
    // new position invalid

    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId1}/question/${-1}/move`, { newPosition: -1 }, { token: token1 })).toThrow(HTTPError[400]);

    // new position invalid as its greater than 1
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId1}/question/${questionId1}/move`, { newPosition: 2 }, { token: token1 })).toThrow(HTTPError[400]);

    // new position invalid as its same as old position
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId1}/question/${questionId1}/move`, { newPosition: 0 }, { token: token1 })).toThrow(HTTPError[400]);

    // similarly, the second question can't be moved to be in its same spot
    expect(() => requestMethod('put', `/v2/admin/quiz/${quizId1}/question/${questionId2}/move`, { newPosition: 1 }, { token: token1 })).toThrow(HTTPError[400]);
  });

  test('Successfully move quiz to start (code 200)', () => {
    // move question2 to start
    expect(requestMethod('put', `/v2/admin/quiz/${quizId1}/question/${questionId2}/move`, { newPosition: 0 }, { token: token1 })).toStrictEqual({});

    // integration testing
    res = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });

    // order should be swapped
    expect(res).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 2,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: ANY_STRING
        },
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: ANY_STRING
        },
      ],
      duration: expect.any(Number),
      thumbnailUrl: expect.any(String)
    });
  });

  test('Successfully move quiz to end (code 200)', () => {
    // move question1 to end

    expect(requestMethod('put', `/v2/admin/quiz/${quizId1}/question/${questionId1}/move`, { newPosition: 1 }, { token: token1 })).toStrictEqual({});

    // integration testing
    res = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });
    expect(res).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 2,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: ANY_STRING
        },
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: ANY_STRING
        },
      ],
      duration: expect.any(Number),
      thumbnailUrl: expect.any(String)
    });
  });

  test('Successfully move quiz from start to middle (code 200)', () => {
    // create third question in the quiz
    const qBody = {

      questionBody: {
        question: 'third question',
        duration: 4,
        points: 5,
        answers: [
          {
            answer: 'Hayden',
            correct: true
          },
          {
            answer: 'Neil',

            correct: false
          },
          {
            answer: 'Ur mum',

            correct: false
          }
        ],
        thumbnailUrl: LEBRONJAMES_JPG
      }
    };
    // create third question successfully
    requestMethod('post', `/v2/admin/quiz/${quizId1}/question`, qBody, { token: token1 }).questionId;

    expect(requestMethod('put', `/v2/admin/quiz/${quizId1}/question/${questionId1}/move`, { newPosition: 1 }, { token: token1 })).toStrictEqual({});

    res = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });
    expect(res).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 3,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: ANY_STRING
        },
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: ANY_STRING
        },
        {
          questionId: expect.any(Number),
          question: 'third question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Hayden',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: ANY_STRING
        },
      ],
      duration: expect.any(Number),
      thumbnailUrl: expect.any(String)
    });
  });

  test('Successfully move quiz from end to middle (code 200)', () => {
    const qBody = {

      questionBody: {
        question: 'third question',
        duration: 4,
        points: 5,
        answers: [
          {
            answer: 'Hayden',
            correct: true
          },
          {
            answer: 'Neil',

            correct: false
          },
          {
            answer: 'Ur mum',

            correct: false
          }
        ],
        thumbnailUrl: LEBRONJAMES_JPG
      }
    };
    // create third question successfully
    const questionId3 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`, qBody, { token: token1 }).questionId;

    expect(requestMethod('put', `/v2/admin/quiz/${quizId1}/question/${questionId3}/move`, { newPosition: 1 }, { token: token1 })).toStrictEqual({});

    res = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });
    expect(res).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 3,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: ANY_STRING
        },
        {
          questionId: expect.any(Number),
          question: 'third question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Hayden',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: ANY_STRING
        },
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: ANY_STRING
        }
      ],
      duration: expect.any(Number),
      thumbnailUrl: expect.any(String)
    });
  });
});

// --------- HTTP wrapper tests for adminQuizQuestionDuplicate ----------
describe('v1 HTTP adminQuizQuestionDuplicate', () => {
  let token1: string, token2: string;
  let quizId1: number;
  let quiz1: quizType;
  let questionId1: number, questionId2: number;
  let res: any;
  beforeEach(() => {
    // User1
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', {
      email: 'user1@gmail.com',
      password: '123456ABCdef$',
      nameFirst: 'Audemars',
      nameLast: 'Piguet'
    }).body)).token;

    // create quiz successfully
    quiz1 = { token: token1, name: 'name', description: 'desc' };
    quizId1 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz1).body)).quizId;

    // create question succesfully
    const qBody = {
      token: token1,
      questionBody: {
        question: 'first question',
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
        ]
      }
    };
    questionId1 = JSON.parse(String(postMethod(`/v1/admin/quiz/${quizId1}/question`, qBody).body)).questionId;
  });

  // token not in structure (token structure error)
  test('invalid token with code 401', () => {
    // invalid token
    const bodyInput = { token: 'fijaofjdosajiofdo' };

    res = postMethod(`/v1/admin/quiz/${quizId1}/question/${questionId1}/duplicate`, bodyInput);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  test('token session not logged in with code 403', () => {
    // logout the user first
    postMethod('/v1/admin/auth/logout', { token: token1 });

    const bodyInput = { token: token1 };
    res = postMethod(`/v1/admin/quiz/${quizId1}/question/${questionId1}/duplicate`, bodyInput);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
  });

  test('Quiz ID does not refer to a valid quiz (code 400)', () => {
    const bodyInput = { token: token1 };
    res = postMethod(`/v1/admin/quiz/${quizId1 + 1}/question/${questionId1}/duplicate`, bodyInput);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Quiz ID does not refer to a quiz the user owns (code 400)', () => {
    token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', {
      email: 'user2@gmail.com',
      password: '123456789ABCdef$',
      nameFirst: 'Leon',
      nameLast: 'Breitling'
    }).body)).token;

    // create second quiz
    const quiz2 = { token2, name: 'second', description: '' };
    const quizId2 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz2).body)).quizId;

    // create question in second quiz
    const qBody = {
      token: token1,
      questionBody: {
        question: 'quiz2 question',
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
        ]
      }
    };
    // create question succesfully
    const questionId1Quiz2 = JSON.parse(String(postMethod(`/v1/admin/quiz/${quizId2}/question`, qBody).body)).questionId;

    const bodyInput = { token: token1 };
    // should fail since quiz2 belongs to token 2 not token 1
    res = postMethod(`/v1/admin/quiz/${quizId2}/question/${questionId1Quiz2}/duplicate`, bodyInput);

    // user1 can't access quiz2
    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);

    // also check the other way - user2 can't access quiz1
    const bodyInput2 = { token: token2 };
    // should also fail since quiz1 belongs to token 1 not token 2
    res = postMethod(`/v1/admin/quiz/${quizId1}/question/${questionId1}/duplicate`, bodyInput2);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Question id does not exist in quiz (code 400)', () => {
    const bodyInput = { token: token1 };
    // testing bogus questionid
    res = postMethod(`/v1/admin/quiz/${quizId1}/question/${-1}/duplicate`, bodyInput);

    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('successfully duplicate one question (code 200)', () => {
    const bodyInput = { token: token1 };
    res = postMethod(`/v1/admin/quiz/${quizId1}/question/${questionId1}/duplicate`, bodyInput);

    expect(JSON.parse(String(res.body))).toStrictEqual({ newQuestionId: expect.any(Number) });
    expect(res.statusCode).toBe(OK);

    res = getMethod(`/v1/admin/quiz/${quizId1}`, { token: token1 });
    expect(res.statusCode).toBe(OK);

    // quiz should be duplicated
    expect(JSON.parse(String(res.body))).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 2,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
      ],
      duration: 8,
    });
  });

  test('successfully duplicate two questions (code 200)', () => {
    // create second question successfully
    const qBody = {
      token: token1,
      questionBody: {
        question: 'second question',
        duration: 4,
        points: 5,
        answers: [
          {
            answer: 'Buzz',
            correct: true
          },
          {
            answer: 'Neil',
            correct: false
          },
          {
            answer: 'Ur mum',
            correct: false
          }
        ]
      }
    };
    questionId2 = JSON.parse(String(postMethod(`/v1/admin/quiz/${quizId1}/question`, qBody).body)).questionId;

    // duplicate first question
    const bodyInput = { token: token1 };
    res = postMethod(`/v1/admin/quiz/${quizId1}/question/${questionId1}/duplicate`, bodyInput);

    expect(JSON.parse(String(res.body))).toStrictEqual({ newQuestionId: expect.any(Number) });
    expect(res.statusCode).toBe(OK);

    res = getMethod(`/v1/admin/quiz/${quizId1}`, { token: token1 });
    expect(res.statusCode).toBe(OK);

    // first question should be duplicated
    expect(JSON.parse(String(res.body))).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 3,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
      ],
      duration: expect.any(Number),
    });

    // duplicate second question
    res = postMethod(`/v1/admin/quiz/${quizId1}/question/${questionId2}/duplicate`, bodyInput);

    expect(JSON.parse(String(res.body))).toStrictEqual({ newQuestionId: expect.any(Number) });
    expect(res.statusCode).toBe(OK);

    // view new question list
    res = getMethod(`/v1/admin/quiz/${quizId1}`, { token: token1 });
    expect(res.statusCode).toBe(OK);

    // second question also should be duplicated and there should be 4 qns now
    expect(JSON.parse(String(res.body))).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 4,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ]
        },
      ],
      duration: expect.any(Number),
    });
  });

  test('duplicating makes time go over 180s', () => {
    const qBody = {
      token: token1,
      questionBody: {
        question: 'second question',
        duration: 100,
        points: 5,
        answers: [
          {
            answer: 'Buzz',
            correct: true
          },
          {
            answer: 'Neil',
            correct: false
          },
          {
            answer: 'Ur mum',
            correct: false
          }
        ]
      }
    };
    questionId2 = JSON.parse(String(postMethod(`/v1/admin/quiz/${quizId1}/question`, qBody).body)).questionId;

    // duplicate first question
    const bodyInput = { token: token1 };
    res = postMethod(`/v1/admin/quiz/${quizId1}/question/${questionId2}/duplicate`, bodyInput);
    expect(JSON.parse(String(res.body)).error).toStrictEqual(ANY_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
});

describe('v2 HTTP adminQuizQuestionDuplicate', () => {
  let token1: string, token2: string;
  let quizId1: number;
  let quiz1: quizType;
  let questionId1: number, questionId2: number;
  let res: any;
  beforeEach(() => {
    // User1
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', {
      email: 'user1@gmail.com',
      password: '123456ABCdef$',
      nameFirst: 'Audemars',
      nameLast: 'Piguet'
    }).body)).token;

    // create quiz successfully
    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'name', description: 'desc' }, { token: token1 }).quizId;
    // create question succesfully
    const qBody = {
      questionBody: {
        question: 'first question',
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
    };
    questionId1 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`, qBody, { token: token1 }).questionId;
  });

  // token not in structure (token structure error)
  test('invalid token with code 401', () => {
    // invalid token

    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question/${questionId1}/duplicate`, {}, { token: 'fijaofjdosajiofdo' })).toThrow(HTTPError[401]);

    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });

    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question/${questionId1}/duplicate`, {}, { token: token1 })).toThrow(HTTPError[403]);
  });

  test('Quiz ID does not refer to a valid quiz (code 400)', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1 + 1}/question/${questionId1}/duplicate`, {}, { token: token1 })).toThrow(HTTPError[400]);

    token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', {
      email: 'user2@gmail.com',
      password: '123456789ABCdef$',
      nameFirst: 'Leon',
      nameLast: 'Breitling'
    }).body)).token;

    // create second quiz
    const quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'name111', description: 'desc111' }, { token: token2 }).quizId;

    // create question in second quiz
    const qBody = {
      questionBody: {
        question: 'first question',
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
    };
    const questionId1Quiz2 = requestMethod('post', `/v2/admin/quiz/${quizId2}/question`, qBody, { token: token2 }).questionId;

    // should fail since quiz2 belongs to token 2 not token 1
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId2}/question/${questionId1Quiz2}/duplicate`, {}, { token: token1 })).toThrow(HTTPError[400]);

    // also check the other way - user2 can't access quiz1
    const bodyInput2 = { token: token2 };
    // should also fail since quiz1 belongs to token 1 not token 2
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question/${questionId1}/duplicate`, {}, { token: token2 })).toThrow(HTTPError[400]);

    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question/${-1}/duplicate`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });

  test('successfully duplicate one question (code 200)', () => {
    expect(requestMethod('post', `/v2/admin/quiz/${quizId1}/question/${questionId1}/duplicate`, {}, { token: token1 })).toStrictEqual({ newQuestionId: expect.any(Number) });

    res = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });

    // quiz should be duplicated
    expect(res).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 2,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: ANY_STRING
        },
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: ANY_STRING
        },
      ],
      duration: 8,
      thumbnailUrl: expect.any(String)
    });
  });

  test('successfully duplicate two questions (code 200)', () => {
    // create second question successfully
    const qBody = {

      questionBody: {
        question: 'second question',
        duration: 4,
        points: 5,
        answers: [
          {
            answer: 'Buzz',
            correct: true
          },
          {
            answer: 'Neil',
            correct: false
          },
          {
            answer: 'Ur mum',
            correct: false
          }
        ],
        thumbnailUrl: LEBRONJAMES_JPG
      }
    };
    const questionId2 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`, qBody, { token: token1 }).questionId;

    // duplicate first question

    expect(requestMethod('post', `/v2/admin/quiz/${quizId1}/question/${questionId1}/duplicate`, {}, { token: token1 })).toStrictEqual({ newQuestionId: expect.any(Number) });

    res = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });

    // first question should be duplicated
    expect(res).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 3,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        },
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        },
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        },
      ],
      duration: expect.any(Number),
      thumbnailUrl: expect.any(String)
    });

    // duplicate second question
    expect(requestMethod('post', `/v2/admin/quiz/${quizId1}/question/${questionId2}/duplicate`, {}, { token: token1 })).toStrictEqual({ newQuestionId: expect.any(Number) });

    // view new question list
    res = requestMethod('get', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });

    // second question also should be duplicated and there should be 4 qns now
    expect(res).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'desc',
      numQuestions: 4,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        },
        {
          questionId: expect.any(Number),
          question: 'first question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Will',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'samson',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        },
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        },
        {
          questionId: expect.any(Number),
          question: 'second question',
          duration: 4,
          points: 5,
          answers: [
            {
              answerId: ANY_NUMBER,
              answer: 'Buzz',
              colour: ANY_STRING,
              correct: true
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Neil',
              colour: ANY_STRING,
              correct: false
            },
            {
              answerId: ANY_NUMBER,
              answer: 'Ur mum',
              colour: ANY_STRING,
              correct: false
            }
          ],
          thumbnailUrl: LEBRONJAMES_JPG
        },
      ],
      duration: expect.any(Number),
      thumbnailUrl: expect.any(String)
    });
  });

  test('duplicating makes time go over 180s', () => {
    const qBody = {

      questionBody: {
        question: 'second question',
        duration: 100,
        points: 5,
        answers: [
          {
            answer: 'Buzz',
            correct: true
          },
          {
            answer: 'Neil',
            correct: false
          },
          {
            answer: 'Ur mum',
            correct: false
          }
        ],
        thumbnailUrl: LEBRONJAMES_JPG
      }
    };
    questionId2 = requestMethod('post', `/v2/admin/quiz/${quizId1}/question`, qBody, { token: token1 }).questionId;

    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/question/${questionId2}/duplicate`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });
});

// ----------- HTTP wrapper tests for adminQuizFinalResults -----------
describe('HTTP test for adminQuizFinalResults', () => {
  let token: string, quizId:number, questionId: number,
    questionBody: questionType, sessionId: number, questionId2: number,
    questionBody2: questionType, questionId3: number,
    questionBody3: questionType;

  beforeEach(() => {
    requestMethod('delete', '/v1/clear', {}, {});
    const user = {
      email: 'user1@gmail.com',
      password: '123456ABCdef$',
      nameFirst: 'Audemars',
      nameLast: 'Piguet'
    };
    token = requestMethod('post', '/v1/admin/auth/register', user).token;
    const quiz = { name: 'fay', description: 'my quiz description' };
    quizId = requestMethod('post', '/v2/admin/quiz', quiz, { token: token }).quizId;
    questionBody = {
      question: 'Yes or no?',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      },
      {
        answer: 'No',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      }],
      thumbnailUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/2324px-Banana-Single.jpg'
    };
    questionId = requestMethod('post', `/v2/admin/quiz/${quizId}/question`,
      { questionBody: questionBody }, { token: token }).questionId;
    questionBody2 = {
      question: 'How many fucks do you have left?',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'None',
        correct: true
      },
      {
        answer: 'One',
        correct: false
      },
      {
        answer: 'Too many',
        correct: false
      }],
      thumbnailUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/2324px-Banana-Single.jpg'
    };
    questionId2 = requestMethod('post', `/v2/admin/quiz/${quizId}/question`,
      { questionBody: questionBody2 }, { token: token }).questionId;
    questionBody3 = {
      question: 'what time is it',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'too early',
        correct: true
      },
      {
        answer: '7am',
        correct: true
      },
      {
        answer: '8am',
        correct: false
      }],
      thumbnailUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/2324px-Banana-Single.jpg'
    };
    questionId3 = requestMethod('post', `/v2/admin/quiz/${quizId}/question`,
      { questionBody: questionBody3 }, { token: token }).questionId;

    sessionId = requestMethod('post', `/v1/admin/quiz/${quizId}/session/start`,
      { autoStartNum: 2 }, { token: token }).sessionId;
  });

  test('2 players, p1 only ans 1/2 qs, skipped last', () => {
    const resOfAdminQuizInfo = requestMethod('get', `/v2/admin/quiz/${quizId}`, {}, { token: token });
    const answerId = resOfAdminQuizInfo.questions[0].answers[0].answerId;
    const answerId2 = resOfAdminQuizInfo.questions[1].answers[0].answerId;
    const playerId = requestMethod('post', '/v1/player/join',
      { sessionId: sessionId, name: 'valid123' }, {}).playerId; // goes to q1

    const playerId2 = requestMethod('post', '/v1/player/join',
      { sessionId: sessionId, name: 'blaze420' }, {}).playerId; // goes to q1
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId}/session/${sessionId}`, { action: 'NEXT_QUESTION' }, { token: token })).not.toThrow(HTTPError[401]);

    sleepSync(100);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId}/session/${sessionId}`, {}, { token: token }).state).toStrictEqual('QUESTION_OPEN');

    // PLAYER 1 SUBMITTING ANSWER TO Q1
    expect(() => requestMethod('put', `/v1/player/${playerId}/question/${1}/answer`,
      { answerIds: [answerId] }, {})).not.toThrow(HTTPError[400]);
    sleepSync(questionBody.duration * 1000);

    let body = { token: token, action: 'GO_TO_ANSWER' }; // go to answer for q1
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});
    body = { token: token, action: 'NEXT_QUESTION' }; // go to q2
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});
    sleepSync(100);
    expect(requestMethod('get', `/v1/admin/quiz/${quizId}/session/${sessionId}`, {}, { token: token }).state).toStrictEqual('QUESTION_OPEN');

    // NO ANS SUBMISSION TO Q2
    sleepSync(questionBody2.duration * 1000);

    body = { token: token, action: 'GO_TO_ANSWER' }; // go to answer for q2
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});
    body = { token: token, action: 'GO_TO_FINAL_RESULTS' }; // go to final results
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});
    // console.log("questionid in test is ", questionId);

    const ret = requestMethod('get', // get final results for all players
    `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, {},
    { token: token });
    //   console.log(ret);
    //   console.log(ret.usersRankedByScore);
    //   console.log(ret.questionResults[0]);
    //   console.log(ret.questionResults[1]);
    //   console.log(ret.questionResults[0].questionCorrectBreakdown);
    //  console.log(ret.questionResults[1].questionCorrectBreakdown);
    expect(requestMethod('get', // get final results for all players
    `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, {},
    { token: token })).toStrictEqual({
      usersRankedByScore: [
        {
          name: 'valid123',
          score: 5
        },
        {
          name: 'blaze420',
          score: 0
        }
      ],
      questionResults: [
        {
          questionId: questionId,
          questionCorrectBreakdown: [
            {
              answerId: answerId,
              playersCorrect: [
                'valid123'
              ]
            }
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 50,
        },
        {
          questionId: questionId2,
          questionCorrectBreakdown: [
            {
              answerId: answerId2,
              playersCorrect: [
              ]
            }
          ],
          averageAnswerTime: 0,
          percentCorrect: 0,
        }
      ]
    });
  });
  test('successfully gets final results for 2 players', () => {
    const resOfAdminQuizInfo = requestMethod('get', `/v2/admin/quiz/${quizId}`, {}, { token: token });
    const answerId = resOfAdminQuizInfo.questions[0].answers[0].answerId;
    const answerId2 = resOfAdminQuizInfo.questions[0].answers[1].answerId;
    const answerId3 = resOfAdminQuizInfo.questions[1].answers[0].answerId;
    const playerId = requestMethod('post', '/v1/player/join',
      { sessionId: sessionId, name: 'valid123' }, {}).playerId; // goes to q1
    const playerId2 = requestMethod('post', '/v1/player/join',
      { sessionId: sessionId, name: 'blaze420' }, {}).playerId; // player 2 joins
    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId}/session/${sessionId}`, { action: 'NEXT_QUESTION' }, { token: token })).not.toThrow(HTTPError[401]);

    sleepSync(100); // QUESTION_COUNTDOWN TO QUESTION_OPEN
    expect(requestMethod('get', `/v1/admin/quiz/${quizId}/session/${sessionId}`, {}, { token: token }).state).toStrictEqual('QUESTION_OPEN');

    // PLAYER 1 SUBMITTING ANSWER TO Q1
    expect(() => requestMethod('put', `/v1/player/${playerId}/question/${1}/answer`,
      { answerIds: [answerId] }, {})).not.toThrow(HTTPError[400]);
    // PLAYER 2 SUBMITTING ANSWER TO Q1
    expect(() => requestMethod('put', `/v1/player/${playerId2}/question/${1}/answer`,
      { answerIds: [answerId2] }, {})).not.toThrow(HTTPError[400]);
    sleepSync(questionBody.duration * 1000);

    let body = { token: token, action: 'GO_TO_ANSWER' }; // go to answer for q1/skip q2
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});
    body = { token: token, action: 'NEXT_QUESTION' }; // go to answer for q1/skip q2
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});
    sleepSync(100); // QUESTION_COUNTDOWN TO QUESTION_OPEN
    expect(requestMethod('get', `/v1/admin/quiz/${quizId}/session/${sessionId}`, {}, { token: token }).state).toStrictEqual('QUESTION_OPEN');
    // PLAYER 1 SUBMITTING ANSWER TO Q2
    expect(() => requestMethod('put', `/v1/player/${playerId}/question/${2}/answer`,
      { answerIds: [answerId3] }, {})).not.toThrow(HTTPError[400]);
    // PLAYER 2 SUBMITTING ANSWER TO Q2
    expect(() => requestMethod('put', `/v1/player/${playerId2}/question/${2}/answer`,
      { answerIds: [answerId3] }, {})).not.toThrow(HTTPError[400]);
    sleepSync(questionBody2.duration * 1000);

    body = { token: token, action: 'GO_TO_ANSWER' }; // go to answer for q2/skip q3
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});
    body = { token: token, action: 'GO_TO_FINAL_RESULTS' }; // go to final results
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});

    const ret = requestMethod('get', // get final results for all players
    `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, {},
    { token: token });

    // console.log(ret.usersRankedByScore);
    // console.log(ret.questionResults);
    // console.log(ret.questionResults[0].questionCorrectBreakdown);
    // console.log(ret.questionResults[1].questionCorrectBreakdown);
    expect(requestMethod('get', // get final results for all players
    `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, {},
    { token: token })).toStrictEqual({
      usersRankedByScore: [
        {
          name: 'valid123',
          score: 10
        },
        {
          name: 'blaze420',
          score: 2.5
        }
      ],
      questionResults: [
        {
          questionId: questionId,
          questionCorrectBreakdown: [
            {
              answerId: answerId,
              playersCorrect: [
                'valid123'
              ]
            }
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 50,
        },
        {
          questionId: questionId2,
          questionCorrectBreakdown: [
            {
              answerId: answerId3,
              playersCorrect: [
                'valid123',
                'blaze420'
              ]
            }
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 100,
        }
      ]
    });
  });
  // Quiz ID does not refer to a quiz that this user owns - 400
  test('Testing quizid not owned by user', () => {
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'NEXT_QUESTION' },
    { token: token })).toStrictEqual({});
    sleepSync(1000);
    expect(requestMethod('get',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    {},
    { token: token }).state).toStrictEqual('QUESTION_OPEN');
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'GO_TO_ANSWER' },
    { token: token })).toStrictEqual({});
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'GO_TO_FINAL_RESULTS' },
    { token: token })).toStrictEqual({});
    const user2 = {
      email: 'user2@gmail.com',
      password: '123456789ABCdef$',
      nameFirst: 'Leon',
      nameLast: 'Breitling'
    };
    const token2 = requestMethod('post', '/v1/admin/auth/register', user2).token;

    const quiz2 = { name: 'jeremy', description: 'HAHAHHAHAH' };
    const quizID2 = requestMethod('post', '/v2/admin/quiz',
      quiz2, { token: token2 }).quizId;
    const questionBody2 = {
      question: 'yay or nay?',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'yay',
        correct: true
      },
      {
        answer: 'nay',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      }],
      thumbnailUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/2324px-Banana-Single.jpg'
    };
    const questionID2 = requestMethod('post', `/v2/admin/quiz/${quizID2}/question`,
      { questionBody: questionBody2 }, { token: token2 }).questionId;
      // const res = deleteMethod(`/v1/admin/quiz/${quizID2}/question/${questionID2}`,
      // { token: token });
    expect(() => requestMethod('get',
    `/v1/admin/quiz/${quizID2}/session/${sessionId}/results`, {},
    { token: token })).toThrow(HTTPError[400]);
  });
  // Quiz ID does not refer to a valid quiz - 400
  test('Testing invalid quizID', () => {
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'NEXT_QUESTION' },
    { token: token })).toStrictEqual({});
    sleepSync(1000);
    expect(requestMethod('get',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    {},
    { token: token }).state).toStrictEqual('QUESTION_OPEN');
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'GO_TO_ANSWER' },
    { token: token })).toStrictEqual({});
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'GO_TO_FINAL_RESULTS' },
    { token: token })).toStrictEqual({});
    expect(() => requestMethod('get',
    `/v1/admin/quiz/${quizId - 999}/session/${sessionId}/results`, {},
    { token: token })).toThrow(HTTPError[400]);
  });

  // Session is not in FINAL_RESULTS state
  test('Session is not in FINAL_RESULTS state (QUESTION_CLOSE) - 400', () => {
    const body = { token: token, action: 'NEXT_QUESTION' };
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});

    sleepSync(1000);

    expect(() => requestMethod('get',
    `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, {},
    { token: token })).toThrow(HTTPError[400]);
  });
  test('Session is not in FINAL_RESULTS state (ANSWER_SHOW) - 400', () => {
    requestMethod('get', '/echo', { echo: 'test2' }, {});
    const body = { token: token, action: 'NEXT_QUESTION' };
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});
    sleepSync(1000);
    expect(requestMethod('get',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    {},
    { token: token }).state).toStrictEqual('QUESTION_OPEN');
    sleepSync(questionBody.duration * 1000);
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'GO_TO_ANSWER' },
    { token: token })).toStrictEqual({});
    expect(() => requestMethod('get',
  `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, {},
  { token: token })).toThrow(HTTPError[400]);
  });
  test('Session is not in FINAL_RESULTS state (END) - 400', () => {
    const body = { token: token, action: 'END' };
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});

    expect(() => requestMethod('get',
    `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, {},
    { token: token })).toThrow(HTTPError[400]);
  });
  // Session Id does not refer to a valid quiz within this quiz
  test('Session Id does not refer to a valid quiz - 400', () => {
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'NEXT_QUESTION' },
    { token: token })).toStrictEqual({});
    sleepSync(1000);
    expect(requestMethod('get',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    {},
    { token: token }).state).toStrictEqual('QUESTION_OPEN');
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'GO_TO_ANSWER' },
    { token: token })).toStrictEqual({});
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'GO_TO_FINAL_RESULTS' },
    { token: token })).toStrictEqual({});
    expect(() => requestMethod('get',
    `/v1/admin/quiz/${quizId}/session/${sessionId - 9999}/results`, {},
    { token: token })).toThrow(HTTPError[400]);
  });
  // not logged in - 403
  test('Testing valid token but not logged in', () => {
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'NEXT_QUESTION' },
    { token: token })).toStrictEqual({});
    sleepSync(1000);
    expect(requestMethod('get',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    {},
    { token: token }).state).toStrictEqual('QUESTION_OPEN');
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'GO_TO_ANSWER' },
    { token: token })).toStrictEqual({});
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'GO_TO_FINAL_RESULTS' },
    { token: token })).toStrictEqual({});

    expect(requestMethod('post',
      '/v2/admin/auth/logout', {}, { token: token })).toStrictEqual({});

    expect(() => requestMethod('get',
    `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, {},
    { token: token })).toThrow(HTTPError[403]);
  });
  // invalid token structure - 401
  test('Testing token is not a valid structure', () => {
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'NEXT_QUESTION' },
    { token: token })).toStrictEqual({});
    sleepSync(1000);
    expect(requestMethod('get',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    {},
    { token: token }).state).toStrictEqual('QUESTION_OPEN');
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'GO_TO_ANSWER' },
    { token: token })).toStrictEqual({});
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { token: token, action: 'GO_TO_FINAL_RESULTS' },
    { token: token })).toStrictEqual({});
    const token3 = 'notanumber';
    expect(() => requestMethod('get',
    `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, {},
    { token: token3 })).toThrow(HTTPError[401]);
  });
});

// ----------- HTTP wrapper tests for adminQuizFinalResultsCSV -----------
describe('HTTP test for adminQuizFinalResultsCSV', () => {
  let token: string, quizId:number, questionId: number,
    questionBody: questionType, sessionId: number, questionId2: number,
    questionBody2: questionType;
  let playerId;
  let playerId2;

  beforeEach(() => {
    requestMethod('delete', '/v1/clear', {}, {});
    const user = {
      email: 'user1@gmail.com',
      password: '123456ABCdef$',
      nameFirst: 'Audemars',
      nameLast: 'Piguet'
    };
    token = requestMethod('post', '/v1/admin/auth/register', user).token;
    const quiz = { name: 'fay', description: 'my quiz description' };
    quizId = requestMethod('post', '/v2/admin/quiz', quiz, { token: token }).quizId;
    questionBody = {
      question: 'Yes or no?',
      duration: 2,
      points: 5,
      answers: [{
        answer: 'Yes',
        correct: true
      },
      {
        answer: 'No',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false

      }],
      thumbnailUrl:
      LEBRONJAMES_JPG

    };
    questionId = requestMethod('post', `/v2/admin/quiz/${quizId}/question`,
      { questionBody: questionBody }, { token: token }).questionId;
    questionBody2 = {
      question: 'How many fucks do you have left?',
      duration: 2,
      points: 5,
      answers: [{
        answer: 'None',
        correct: true
      },
      {
        answer: 'One',
        correct: false
      },
      {
        answer: 'Too many',

      }],
      thumbnailUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/2324px-Banana-Single.jpg'
    };
    questionId2 = requestMethod('post', `/v2/admin/quiz/${quizId}/question`, { questionBody: questionBody2 }, { token: token }).questionId;
    sessionId = requestMethod('post', `/v1/admin/quiz/${quizId}/session/start`, { autoStartNum: 2 }, { token: token }).sessionId;

    playerId = requestMethod('post', '/v1/player/join', { sessionId: sessionId, name: 'valid123' }, {}).playerId; // goes to q1
    playerId2 = requestMethod('post', '/v1/player/join', { sessionId: sessionId, name: 'blaze420' }, {}).playerId; // player 2 joins

    // auto-start
    // requestMethod('put',`/v1/admin/quiz/${quizId}/session/${sessionId}`,{ token: token, action: 'NEXT_QUESTION' },{ token: token })
    sleepSync(FINISH_COUNTDOWN + 52);
  });

  test('successfully gets final results 4all players in quiz session', () => {
    const resOfAdminQuizInfo = requestMethod('get', `/v2/admin/quiz/${quizId}`, {}, { token: token });
    const answerId = resOfAdminQuizInfo.questions[0].answers[0].answerId;// correct
    const answerId2 = resOfAdminQuizInfo.questions[0].answers[1].answerId;// wrong
    const answerId3 = resOfAdminQuizInfo.questions[1].answers[0].answerId;// correct

    expect(() => requestMethod('put', `/v1/admin/quiz/${quizId}/session/${sessionId}`, { action: 'NEXT_QUESTION' }, { token: token })).not.toThrow(HTTPError[401]);

    sleepSync(100); // QUESTION_COUNTDOWN TO QUESTION_OPEN
    expect(requestMethod('get', `/v1/admin/quiz/${quizId}/session/${sessionId}`, {}, { token: token }).state).toStrictEqual('QUESTION_OPEN');

    // PLAYER 1 SUBMITTING ANSWER TO Q1
    expect(() => requestMethod('put', `/v1/player/${playerId}/question/${1}/answer`,
      { answerIds: [answerId] }, {})).not.toThrow(HTTPError[400]);
    // PLAYER 2 SUBMITTING ANSWER TO Q1
    expect(() => requestMethod('put', `/v1/player/${playerId2}/question/${1}/answer`,
      { answerIds: [answerId2] }, {})).not.toThrow(HTTPError[400]);
    sleepSync(questionBody.duration * 1000);

    let body = { token: token, action: 'GO_TO_ANSWER' }; // go to answer for q1/skip q2
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});
    body = { token: token, action: 'NEXT_QUESTION' }; // go to answer for q1/skip q2
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});
    sleepSync(100); // QUESTION_COUNTDOWN TO QUESTION_OPEN
    expect(requestMethod('get', `/v1/admin/quiz/${quizId}/session/${sessionId}`, {}, { token: token }).state).toStrictEqual('QUESTION_OPEN');

    // PLAYER 1 SUBMITTING ANSWER TO Q2
    expect(() => requestMethod('put', `/v1/player/${playerId}/question/${2}/answer`,
      { answerIds: [answerId3] }, {})).not.toThrow(HTTPError[400]);
    // PLAYER 2 SUBMITTING ANSWER TO Q2
    expect(() => requestMethod('put', `/v1/player/${playerId2}/question/${2}/answer`,
      { answerIds: [answerId3] }, {})).not.toThrow(HTTPError[400]);
    sleepSync(questionBody2.duration * 1000);

    body = { token: token, action: 'GO_TO_ANSWER' }; // go to answer for q1/skip q2
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});

    body = { token: token, action: 'GO_TO_FINAL_RESULTS' }; // go to final results
    expect(requestMethod('put',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`, body,
    { token: token })).toStrictEqual({});

    const ret = requestMethod('get', // get final results for all players
    `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, {},
    { token: token });

    // console.log(`our ret = ${JSON.stringify(ret)}`)

    let ret_url;
    expect(ret_url = requestMethod('get', `/v1/admin/quiz/${quizId}/session/${sessionId}/results/csv`, {}, { token: token }).url).toStrictEqual(ANY_STRING);

    console.log(`csv url = ${ret_url}`);
  });

  // Quiz ID does not refer to a valid quiz - 400
  test('Testing invalid quizID', () => {
    expect(requestMethod('put', `/v1/admin/quiz/${quizId}/session/${sessionId}`, { token: token, action: 'GO_TO_ANSWER' }, { token: token })).toStrictEqual({});

    expect(requestMethod('put', `/v1/admin/quiz/${quizId}/session/${sessionId}`, { token: token, action: 'GO_TO_FINAL_RESULTS' }, { token: token })).toStrictEqual({});
    expect(() => requestMethod('get', `/v1/admin/quiz/${quizId - 999}/session/${sessionId}/results/csv`, {}, { token: token })).toThrow(HTTPError[400]);

    const user2 = {
      email: 'user2@gmail.com',
      password: '123456789ABCdef$',
      nameFirst: 'Leon',
      nameLast: 'Breitling'
    };
    const token2 = requestMethod('post', '/v1/admin/auth/register', user2).token;

    const quiz2 = { token: token2, name: 'jeremy', description: 'HAHAHHAHAH' };
    const quizID2 = requestMethod('post', '/v1/admin/quiz', quiz2).quizId;
    const questionBody2 = {
      question: 'yay or nay?',
      duration: 4,
      points: 5,
      answers: [{
        answer: 'yay',
        correct: true
      },
      {
        answer: 'nay',
        correct: false
      },
      {
        answer: 'Maybe',
        correct: false
      }],
      thumbnailUrl:
        LEBRONJAMES_JPG
    };
    const questionID2 = requestMethod('post', `/v2/admin/quiz/${quizID2}/question`, { questionBody: questionBody2 }, { token: token2 }).questionId;
    expect(() => requestMethod('get', `/v1/admin/quiz/${quizID2}/session/${sessionId}/results/csv`, {}, { token: token })).toThrow(HTTPError[400]);
  });
  // Session is not in FINAL_RESULTS state
  test('Session is not in final results state - 400', () => {
    const states = [
      { action: 'GO_TO_ANSWER' },
      { action: 'END' },
    ];
    for (const state of states) {
      expect(requestMethod('put', `/v1/admin/quiz/${quizId}/session/${sessionId}`, state, { token: token })).toStrictEqual({});
      expect(() => requestMethod('get', `/v1/admin/quiz/${quizId}/session/${sessionId}/results/csv`, {}, { token: token })).toThrow(HTTPError[400]);
    }
  });
  // Session Id does not refer to a valid question within this quiz
  test('Session Id does not refer to a valid question within this quiz - 400', () => {
    expect(requestMethod('put', `/v1/admin/quiz/${quizId}/session/${sessionId}`, { token: token, action: 'GO_TO_ANSWER' }, { token: token })).toStrictEqual({});

    expect(requestMethod('put', `/v1/admin/quiz/${quizId}/session/${sessionId}`, { token: token, action: 'GO_TO_FINAL_RESULTS' }, { token: token })).toStrictEqual({});
    expect(() => requestMethod('get', `/v1/admin/quiz/${quizId}/session/${sessionId - 99999}/results/csv`, {}, { token: token })).toThrow(HTTPError[400]);
  });
  // invalid token structure - 401
  test('Testing token is not a valid structure', () => {
    expect(requestMethod('put', `/v1/admin/quiz/${quizId}/session/${sessionId}`, { token: token, action: 'GO_TO_ANSWER' }, { token: token })).toStrictEqual({});
    expect(requestMethod('put', `/v1/admin/quiz/${quizId}/session/${sessionId}`, { token: token, action: 'GO_TO_FINAL_RESULTS' }, { token: token })).toStrictEqual({});

    expect(() => requestMethod('get', `/v1/admin/quiz/${quizId}/session/${sessionId}/results/csv`, {}, { token: 'notanumber' })).toThrow(HTTPError[401]);
    expect(requestMethod('post', '/v2/admin/auth/logout', {}, { token: token })).toStrictEqual({});
    expect(() => requestMethod('get', `/v1/admin/quiz/${quizId}/session/${sessionId}/results/csv`, {}, { token: token })).toThrow(HTTPError[403]);
  });
});
