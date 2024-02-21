import { getMethod, postMethod, deleteMethod, requestMethod } from './test-helper';
import { UserType, QuizType } from './../types';

import HTTPError from 'http-errors';

const OK = 200;
const INPUT_ERROR = 400;
const INVALID_AUTHENTICATE = 401;
const NOT_LOGGED_IN = 403;

beforeEach(() => {
  deleteMethod('/v1/clear', {});
});

// --------------------- Tests for viewing trash ------------------------
describe('tests for viewing trash', () => {
  let user1: UserType, token1: string, quiz1: QuizType, quizId1: number;
  beforeEach(() => {
    deleteMethod('/v1/clear', {});
    // Registering a user
    user1 = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', user1).body)).token;

    // Creating a quiz
    quiz1 = {
      token: token1,
      name: 'Successful Quiz',
      description: 'my quiz description'
    };
    quizId1 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz1).body)).quizId;

    // Removing quiz
    deleteMethod(`/v1/admin/quiz/${quizId1}`, { token: token1 });
  });

  // 200, successful viewing a single quiz in trash
  test('successful viewing one quiz in trash', () => {
    // Calling view trash function
    const res = getMethod('/v1/admin/quiz/trash', { token: token1 });
    const bodyObj = JSON.parse(String(res.body));

    expect(bodyObj).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1,
          name: 'Successful Quiz'
        }
      ]
    });
    expect(res.statusCode).toBe(OK);
  });

  // 200, successful viewing multiple quizzes in trash
  test('successful viewing multiple quizzes in trash', () => {
    // Creating a 2nd quiz
    const quiz2 = {
      token: token1,
      name: 'Successful Quiz V2',
      description: 'my quiz description'
    };
    const quizId2 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz2).body)).quizId;

    // Removing quiz
    deleteMethod(`/v1/admin/quiz/${quizId2}`, { token: token1 });

    // Calling view trash function
    const res = getMethod('/v1/admin/quiz/trash', { token: token1 });
    const bodyObj = JSON.parse(String(res.body));

    expect(bodyObj).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1,
          name: 'Successful Quiz'
        },
        {
          quizId: quizId2,
          name: 'Successful Quiz V2'
        }
      ]
    });
    expect(res.statusCode).toBe(OK);
  });

  // 200, successful viewing multiple quizzes in trash,
  // after making another user create and send a quiz to trash
  test('successful viewing multiple quizzes in trash, with another user', () => {
    // Creating a 2nd quiz
    const quiz2 = {
      token: token1,
      name: 'Successful Quiz V2',
      description: 'my quiz description'
    };
    const quizId2 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz2).body)).quizId;

    // Removing quiz
    deleteMethod(`/v1/admin/quiz/${quizId2}`, { token: token1 });

    // Registering a 2nd user
    const user2 = {
      email: 'madhu.shrestha@unsw.edu.au',
      password: 'StrongPassword1',
      nameFirst: 'Madhu',
      nameLast: 'Shrestha'
    };
    const token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', user2).body)).token;

    // Creating a quiz belonging to 2nd user
    const quiz3 = {
      token: token2,
      name: 'Successful Quiz',
      description: 'my quiz description'
    };
    const quizId3 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz3).body)).quizId;

    // Removing quiz belonging to 2nd user
    deleteMethod(`/v1/admin/quiz/${quizId3}`, { token: token2 });

    // Calling view trash function
    const res = getMethod('/v1/admin/quiz/trash', { token: token1 });
    const bodyObj = JSON.parse(String(res.body));

    expect(bodyObj).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1,
          name: 'Successful Quiz'
        },
        {
          quizId: quizId2,
          name: 'Successful Quiz V2'
        }
      ]
    });
    expect(res.statusCode).toBe(OK);
  });

  // // Error 401, token is not in a valid structure
  test('token is not a valid structure, error', () => {
    const res = getMethod('/v1/admin/quiz/trash', { token: '0' });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INVALID_AUTHENTICATE);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 403, token is not for a currently logged in session
  test('token is valid structure, but is not for a currently logged in session', () => {
    // Log user 1 with token 1 out
    postMethod('/v1/admin/auth/logout', { token: token1 });

    const res = getMethod('/v1/admin/quiz/trash', { token: token1 });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(NOT_LOGGED_IN);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });
});

// -------------- Tests for restoring quizzes from trash ----------------
describe('tests for restoring trash', () => {
  let user1: UserType, token1: string, quiz1: QuizType, quizId1: number;
  let quiz2: QuizType, quizId2: number, user2: UserType, token2: string, quiz3: QuizType, quizId3: number;
  beforeEach(() => {
    deleteMethod('/v1/clear', {});
    // Registering a user
    user1 = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', user1).body)).token;

    // Creating a quiz
    quiz1 = {
      token: token1,
      name: 'Successful Quiz',
      description: 'my quiz description'
    };
    quizId1 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz1).body)).quizId;
    console.log(`quizid1 = ${quizId1}`);
    // Removing quiz
    deleteMethod(`/v1/admin/quiz/${quizId1}`, { token: token1 });

    // Creating a quiz 2 - belongs to user 1
    quiz2 = {
      token: token1,
      name: 'Successful Quiz V2',
      description: 'my quiz description'
    };
    quizId2 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz2).body)).quizId;

    // Registering user 2
    user2 = {
      email: 'madhu@gmail.com',
      password: 'StrongPassword1',
      nameFirst: 'Madhu',
      nameLast: 'Shrestha'
    };
    token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', user2).body)).token;

    // Creating quiz 3 - belongs to user 2
    quiz3 = { token: token2, name: 'Successful Quiz', description: 'my quiz description' };
    quizId3 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz3).body)).quizId;

    // Deleting quiz 3
    deleteMethod(`/v1/admin/quiz/${quizId3}`, { token: token2 });
  });

  // 200, successful restoring one quiz from trash
  test('successful restoring one quiz from trash', () => {
    // Calling restore quiz from trash function
    const res = postMethod(`/v1/admin/quiz/${quizId1}/restore`, { token: token1 });

    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(OK);
    expect(bodyObj).toStrictEqual({});

    // Checking adminQuizList returns a list with the restored quiz
    const bodyObjOfQuizList = JSON.parse(String(getMethod('/v1/admin/quiz/list', { token: token1 }).body));
    expect(bodyObjOfQuizList).toStrictEqual({
      quizzes: [
        {
          quizId: quizId2,
          name: 'Successful Quiz V2',
        },
        {
          quizId: quizId1,
          name: 'Successful Quiz',
        }
      ]
    });
  });

  // 200, successful restoring two quizzes from trash,
  // with a third quiz kept in trash
  test('successful restoring two quizzes, with a third kept in trash', () => {
    // Creating a 3rd quiz for user1
    const quiz4 = {
      token: token1,
      name: 'Successful Quiz V4',
      description: 'my quiz description'
    };
    const quizId4 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz4).body)).quizId;

    // Removing quizzes 2 and 4
    deleteMethod(`/v1/admin/quiz/${quizId2}`, { token: token1 });
    deleteMethod(`/v1/admin/quiz/${quizId4}`, { token: token1 });

    // Restoring quizzes 1 & 4
    const res = postMethod(`/v1/admin/quiz/${quizId1}/restore`, { token: token1 });
    postMethod(`/v1/admin/quiz/${quizId4}/restore`, { token: token1 });

    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(OK);
    expect(bodyObj).toStrictEqual({});

    // Checking adminQuizList returns a list with the restored quizzes
    const bodyObjOfQuizList = JSON.parse(String(getMethod('/v1/admin/quiz/list', { token: token1 }).body));
    expect(bodyObjOfQuizList).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1,
          name: 'Successful Quiz',
        },
        {
          quizId: quizId4,
          name: 'Successful Quiz V4',
        }
      ]
    });

    // Checking quiz 2 is the only quiz in trash
    const resOfTrashView = getMethod('/v1/admin/quiz/trash', { token: token1 });
    const bodyObjOfTrashView = JSON.parse(String(resOfTrashView.body));
    expect(bodyObjOfTrashView).toStrictEqual({
      quizzes: [
        {
          quizId: quizId2,
          name: 'Successful Quiz V2'
        }
      ]
    });
  });

  // Error 400, invalid quizId parameters
  test('invalid quizId not owned by user', () => {
    const res = postMethod(`/v1/admin/quiz/${[quizId3]}/restore`, { token: token1 });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 400, quiz is not in trash
  test('invalid quizId, quiz is not in trash', () => {
    const res = postMethod(`/v1/admin/quiz/${[quizId2]}/restore`, { token: token1 });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 400, quiz is not valid
  test('invalid quizId, quiz is not in trash', () => {
    const res = postMethod(`/v1/admin/quiz/${[quizId1 - 99999]}/restore`, { token: token1 });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 401, token is not in a valid structure
  test('token is not a valid structure, error', () => {
    const res = postMethod(`/v1/admin/quiz/${quizId1}/restore`, { token: '0' });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INVALID_AUTHENTICATE);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 403, token is not for a currently logged in session
  test('token is valid structure, but is not for a currently logged in session', () => {
    // Log user 1 with token 1 out
    postMethod('/v1/admin/auth/logout', { token: token1 });

    const res = postMethod(`/v1/admin/quiz/${quizId1}/restore`, { token: token1 });
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(NOT_LOGGED_IN);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });
});

// --------------- Tests for deleting quizzes from trash ----------------
describe('tests for deleting trash', () => {
  let user1: UserType, token1: string, quiz1: QuizType, quizId1: number;
  let quiz2: QuizType, quizId2: number, user2: UserType, token2: string, quiz3: QuizType, quizId3: number;
  beforeEach(() => {
    deleteMethod('/v1/clear', {});
    // Registering a user
    user1 = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', user1).body)).token;

    // Creating a quiz
    quiz1 = {
      token: token1,
      name: 'Successful Quiz',
      description: 'my quiz description'
    };
    quizId1 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz1).body)).quizId;

    // Removing quiz
    deleteMethod(`/v1/admin/quiz/${quizId1}`, { token: token1 });

    // Creating a quiz 2 - belongs to user 1
    quiz2 = {
      token: token1,
      name: 'Successful Quiz V2',
      description: 'my quiz description'
    };
    quizId2 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz2).body)).quizId;

    // Registering user 2
    user2 = {
      email: 'madhu@gmail.com',
      password: 'StrongPassword1',
      nameFirst: 'Madhu',
      nameLast: 'Shrestha'
    };
    token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', user2).body)).token;

    // Creating quiz 3 - belongs to user 2
    quiz3 = { token: token2, name: 'Successful Quiz', description: 'my quiz description' };
    quizId3 = JSON.parse(String(postMethod('/v1/admin/quiz', quiz3).body)).quizId;

    // Deleting quiz 3
    deleteMethod(`/v1/admin/quiz/${quizId3}`, { token: token2 });
  });

  // 200 - Successful deleting a single quiz from trash
  test('successful deleting one quiz from trash', () => {
    const quizIds = [quizId1];
    const tokenAndQuizzes = {
      token: token1,
      quizIds: JSON.stringify(quizIds),
    };

    // Calling delete a quiz from trash function
    const res = deleteMethod('/v1/admin/quiz/trash/empty', tokenAndQuizzes);

    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(OK);
    expect(bodyObj).toStrictEqual({});

    // Checking trash view function shows no quizzes in trash
    const resOfTrashView = getMethod('/v1/admin/quiz/trash', { token: token1 });
    const bodyObjOfTrashView = JSON.parse(String(resOfTrashView.body));
    expect(resOfTrashView.statusCode).toBe(OK);
    expect(bodyObjOfTrashView).toStrictEqual({
      quizzes: []
    });
  });

  // 200 - Successful deleting multiple quizzes from trash
  test('successful deleting multiple quizzes from trash', () => {
    // Removing quiz 2 - belongs to user 1
    deleteMethod(`/v1/admin/quiz/${quizId2}`, { token: token1 });

    // Checking trash view function shows both quizzes in trash
    const resOfTrashView1 = getMethod('/v1/admin/quiz/trash', { token: token1 });
    const bodyObjOfTrashView1 = JSON.parse(String(resOfTrashView1.body));
    expect(resOfTrashView1.statusCode).toBe(OK);
    expect(bodyObjOfTrashView1).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1,
          name: 'Successful Quiz'
        },
        {
          quizId: quizId2,
          name: 'Successful Quiz V2'
        }
      ]
    });

    const quizIds = [quizId1, quizId2];

    const tokenAndQuizzes = {
      token: token1,
      quizIds: JSON.stringify(quizIds),
    };

    // Calling delete a quiz from trash function
    const res = deleteMethod('/v1/admin/quiz/trash/empty', tokenAndQuizzes);

    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(OK);
    expect(bodyObj).toStrictEqual({});

    // Checking trash view function shows no quizzes in trash
    const resOfTrashView2 = getMethod('/v1/admin/quiz/trash', { token: token1 });
    const bodyObjOfTrashView2 = JSON.parse(String(resOfTrashView2.body));
    expect(resOfTrashView2.statusCode).toBe(OK);
    expect(bodyObjOfTrashView2).toStrictEqual({
      quizzes: []
    });
  });

  // Error 400 - quizIds are not valid
  test('invalid quizId not owned by user', () => {
    const quizIds = [quizId1, quizId3];
    const tokenAndQuizzes = {
      token: token1,
      quizIds: JSON.stringify(quizIds),
    };

    const res = deleteMethod('/v1/admin/quiz/trash/empty', tokenAndQuizzes);
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 400, quiz is not in trash
  test('invalid quizId, quiz is not in trash', () => {
    const quizIds = [quizId1, quizId2];
    const tokenAndQuizzes = {
      token: token1,
      quizIds: JSON.stringify(quizIds),
    };

    const res = deleteMethod('/v1/admin/quiz/trash/empty', tokenAndQuizzes);
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 400, quizId is not valid
  test('invalid quizId', () => {
    const quizIds = [quizId1, quizId1 - 99999];
    const tokenAndQuizzes = {
      token: token1,
      quizIds: JSON.stringify(quizIds),
    };

    const res = deleteMethod('/v1/admin/quiz/trash/empty', tokenAndQuizzes);
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 401 - token is not in a valid structure
  test('token is not a valid structure, error', () => {
    const tokenAndQuizzes = {
      token: '0',
      quizIds: [quizId1],
    };

    const res = deleteMethod('/v1/admin/quiz/trash/empty', tokenAndQuizzes);
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(INVALID_AUTHENTICATE);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });

  // Error 403 - token is not for a currently logged in session
  test('token is valid structure, but is not for a currently logged in session', () => {
    // Log user 1 with token 1 out
    postMethod('/v1/admin/auth/logout', { token: token1 });
    const tokenAndQuizzes = {
      token: token1,
      quizIds: [quizId1],
    };

    const res = deleteMethod('/v1/admin/quiz/trash/empty', tokenAndQuizzes);
    const bodyObj = JSON.parse(String(res.body));
    expect(res.statusCode).toBe(NOT_LOGGED_IN);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });
});

// ============================= V2 =====================================

// --------------------- Tests for viewing trash ------------------------
describe('v2 tests for viewing trash', () => {
  let user1: UserType, token1: string, quiz1: QuizType, quizId1: number;
  beforeEach(() => {
    deleteMethod('/v1/clear', {});
    // Registering a user
    user1 = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', user1).body)).token;

    // Creating a quiz

    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'Successful Quiz', description: 'my quiz description' }, { token: token1 }).quizId;

    // Removing quiz
    requestMethod('delete', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });
  });

  // 200, successful viewing a single quiz in trash
  test('successful viewing one quiz in trash', () => {
    // Calling view trash function
    const res = requestMethod('get', '/v2/admin/quiz/trash', {}, { token: token1 });
    expect(() => res).not.toThrow(HTTPError[401]);

    expect(res).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1,
          name: 'Successful Quiz'
        }
      ]
    });
  });

  // 200, successful viewing multiple quizzes in trash
  test('successful viewing multiple quizzes in trash', () => {
    // Creating a 2nd quiz

    const quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Successful Quiz V2', description: 'my quiz description' }, { token: token1 }).quizId;

    // Removing quiz
    requestMethod('delete', `/v2/admin/quiz/${quizId2}`, {}, { token: token1 });

    // Calling view trash function
    const res = requestMethod('get', '/v2/admin/quiz/trash', {}, { token: token1 });
    expect(() => res).not.toThrow(HTTPError[401]);

    expect(res).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1,
          name: 'Successful Quiz'
        },
        {
          quizId: quizId2,
          name: 'Successful Quiz V2'
        }
      ]
    });
  });

  // 200, successful viewing multiple quizzes in trash,
  // after making another user create and send a quiz to trash
  test('successful viewing multiple quizzes in trash, with another user', () => {
    const quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Successful Quiz V2', description: 'my quiz description' }, { token: token1 }).quizId;

    // Removing quiz
    requestMethod('delete', `/v2/admin/quiz/${quizId2}`, {}, { token: token1 });

    // Registering a 2nd user
    const user2 = {
      email: 'madhu.shrestha@unsw.edu.au',
      password: 'StrongPassword1',
      nameFirst: 'Madhu',
      nameLast: 'Shrestha'
    };
    const token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', user2).body)).token;

    // Creating a quiz belonging to 2nd user

    const quizId3 = requestMethod('post', '/v2/admin/quiz', { name: 'Successful Quiz', description: 'my quiz description' }, { token: token2 }).quizId;

    // Removing quiz belonging to 2nd user
    requestMethod('delete', `/v2/admin/quiz/${quizId3}`, {}, { token: token2 });

    // Calling view trash function
    const res = requestMethod('get', '/v2/admin/quiz/trash', {}, { token: token1 });
    expect(() => res).not.toThrow(HTTPError[401]);

    expect(res).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1,
          name: 'Successful Quiz'
        },
        {
          quizId: quizId2,
          name: 'Successful Quiz V2'
        }
      ]
    });
  });

  // // Error 401, token is not in a valid structure
  test('token is not a valid structure, error', () => {
    expect(() => requestMethod('get', '/v2/admin/quiz/trash', {}, { token: '0' })).toThrow(HTTPError[401]);
  });

  // Error 403, token is not for a currently logged in session
  test('token is valid structure, but is not for a currently logged in session', () => {
    // Log user 1 with token 1 out
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });

    expect(() => requestMethod('get', '/v2/admin/quiz/trash', {}, { token: token1 })).toThrow(HTTPError[403]);
  });
});

// -------------- Tests for restoring quizzes from trash ----------------
describe('v2 tests for restoring trash', () => {
  let user1: UserType, token1: string, quiz1: QuizType, quizId1: number;
  let quiz2: QuizType, quizId2: number, user2: UserType, token2: string, quiz3: QuizType, quizId3: number;
  beforeEach(() => {
    deleteMethod('/v1/clear', {});
    // Registering a user
    user1 = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', user1).body)).token;

    // Creating a quiz

    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'Successful Quiz', description: 'my quiz description' }, { token: token1 }).quizId;

    // Removing quiz
    requestMethod('delete', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });

    // Creating a quiz 2 - belongs to user 1
    quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Successful Quiz V2', description: 'my quiz description' }, { token: token1 }).quizId;

    // Registering user 2
    user2 = {
      email: 'madhu@gmail.com',
      password: 'StrongPassword1',
      nameFirst: 'Madhu',
      nameLast: 'Shrestha'
    };
    token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', user2).body)).token;

    // Creating quiz 3 - belongs to user 2
    quizId3 = requestMethod('post', '/v2/admin/quiz', { name: 'Successful Quiz', description: 'my quiz description' }, { token: token2 }).quizId;

    // Deleting quiz 3
    requestMethod('delete', `/v2/admin/quiz/${quizId3}`, {}, { token: token2 });
  });

  // 200, successful restoring one quiz from trash
  test('successful restoring one quiz from trash', () => {
    // Calling restore quiz from trash function
    const res = requestMethod('post', `/v2/admin/quiz/${quizId1}/restore`, {}, { token: token1 });
    expect(() => res).not.toThrow(HTTPError[401]);
    expect(res).toStrictEqual({});

    // Checking adminQuizList returns a list with the restored quiz
    const bodyObjOfQuizList = requestMethod('get', '/v2/admin/quiz/list', {}, { token: token1 });
    expect(bodyObjOfQuizList).toStrictEqual({
      quizzes: [
        {
          quizId: quizId2,
          name: 'Successful Quiz V2',
        },
        {
          quizId: quizId1,
          name: 'Successful Quiz',
        }
      ]
    });
  });

  // 200, successful restoring two quizzes from trash,
  // with a third quiz kept in trash
  test('successful restoring two quizzes, with a third kept in trash', () => {
    // Creating a 3rd quiz for user1
    const quizId4 = requestMethod('post', '/v2/admin/quiz', { name: 'Successful Quiz V4', description: 'my quiz description' }, { token: token1 }).quizId;

    // Removing quizzes 2 and 4
    requestMethod('delete', `/v2/admin/quiz/${quizId2}`, {}, { token: token1 });
    requestMethod('delete', `/v2/admin/quiz/${quizId4}`, {}, { token: token1 });

    // Restoring quizzes 1 & 4
    const res = requestMethod('post', `/v2/admin/quiz/${quizId1}/restore`, {}, { token: token1 });
    expect(() => res).not.toThrow(HTTPError[401]);
    const res2 = requestMethod('post', `/v2/admin/quiz/${quizId4}/restore`, {}, { token: token1 });
    expect(() => res2).not.toThrow(HTTPError[401]);

    expect(res).toStrictEqual({});
    expect(res2).toStrictEqual({});

    // Checking adminQuizList returns a list with the restored quizzes
    const bodyObjOfQuizList = requestMethod('get', '/v2/admin/quiz/list', {}, { token: token1 });
    expect(bodyObjOfQuizList).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1,
          name: 'Successful Quiz',
        },
        {
          quizId: quizId4,
          name: 'Successful Quiz V4',
        }
      ]
    });

    // Checking quiz 2 is the only quiz in trash
    const res3 = requestMethod('get', '/v2/admin/quiz/trash', {}, { token: token1 });
    expect(() => res3).not.toThrow(HTTPError[401]);

    expect(res3).toStrictEqual({
      quizzes: [
        {
          quizId: quizId2,
          name: 'Successful Quiz V2'
        }
      ]
    });
  });

  // Error 400, invalid quizId parameters
  test('invalid quizId not owned by user', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${[quizId3]}/restore`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });

  // Error 400, quiz is not in trash
  test('invalid quizId, quiz is not in trash', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${[quizId2]}/restore`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });

  // Error 400, quiz is not valid
  test('invalid quizId, quiz is not in trash', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${[quizId1 - 99999]}/restore`, {}, { token: token1 })).toThrow(HTTPError[400]);
  });

  // Error 401, token is not in a valid structure
  test('token is not a valid structure, error', () => {
    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/restore`, {}, { token: '0' })).toThrow(HTTPError[401]);
  });

  // Error 403, token is not for a currently logged in session
  test('token is valid structure, but is not for a currently logged in session', () => {
    // Log user 1 with token 1 out
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });

    expect(() => requestMethod('post', `/v2/admin/quiz/${quizId1}/restore`, {}, { token: token1 })).toThrow(HTTPError[403]);
  });
});

// --------------- Tests for deleting quizzes from trash ----------------
describe('v2 tests for deleting trash', () => {
  let user1: UserType, token1: string, quiz1: QuizType, quizId1: number;
  let quiz2: QuizType, quizId2: number, user2: UserType, token2: string, quiz3: QuizType, quizId3: number;
  beforeEach(() => {
    deleteMethod('/v1/clear', {});
    // Registering a user
    user1 = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    token1 = JSON.parse(String(postMethod('/v1/admin/auth/register', user1).body)).token;

    // Creating a quiz

    quizId1 = requestMethod('post', '/v2/admin/quiz', { name: 'Successful Quiz', description: 'my quiz description' }, { token: token1 }).quizId;

    // Removing quiz
    requestMethod('delete', `/v2/admin/quiz/${quizId1}`, {}, { token: token1 });

    // Creating a quiz 2 - belongs to user 1
    quizId2 = requestMethod('post', '/v2/admin/quiz', { name: 'Successful Quiz V2', description: 'my quiz description' }, { token: token1 }).quizId;

    // Registering user 2
    user2 = {
      email: 'madhu@gmail.com',
      password: 'StrongPassword1',
      nameFirst: 'Madhu',
      nameLast: 'Shrestha'
    };
    token2 = JSON.parse(String(postMethod('/v1/admin/auth/register', user2).body)).token;

    // Creating quiz 3 - belongs to user 2
    quizId3 = requestMethod('post', '/v2/admin/quiz', { name: 'Successful Quiz', description: 'my quiz description' }, { token: token2 }).quizId;

    // Deleting quiz 3
    requestMethod('delete', `/v2/admin/quiz/${quizId3}`, {}, { token: token2 });
  });

  // 200 - Successful deleting a single quiz from trash
  test('successful deleting one quiz from trash', () => {
    const quizIds = [quizId1];
    // const tokenAndQuizzes = {
    //   token: token1,
    //   quizIds: JSON.stringify(quizIds),
    // };

    // Calling delete a quiz from trash function
    const res = requestMethod('delete', '/v2/admin/quiz/trash/empty', { quizIds: JSON.stringify(quizIds) }, { token: token1 });
    expect(() => res).not.toThrow(HTTPError[401]);
    expect(res).toStrictEqual({});

    // Checking trash view function shows no quizzes in trash
    const res2 = requestMethod('get', '/v2/admin/quiz/trash', {}, { token: token1 });
    expect(() => res2).not.toThrow(HTTPError[401]);

    expect(res2).toStrictEqual({
      quizzes: []
    });
  });

  // 200 - Successful deleting multiple quizzes from trash
  test('successful deleting multiple quizzes from trash', () => {
    // Removing quiz 2 - belongs to user 1
    requestMethod('delete', `/v2/admin/quiz/${quizId2}`, {}, { token: token1 });

    // Checking trash view function shows both quizzes in trash
    const res2 = requestMethod('get', '/v2/admin/quiz/trash', {}, { token: token1 });
    expect(() => res2).not.toThrow(HTTPError[401]);

    expect(res2).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1,
          name: 'Successful Quiz'
        },
        {
          quizId: quizId2,
          name: 'Successful Quiz V2'
        }
      ]
    });

    const quizIds = [quizId1, quizId2];

    // const tokenAndQuizzes = {
    //   token: token1,
    //   quizIds: JSON.stringify(quizIds),
    // };

    // Calling delete a quiz from trash function
    const res = requestMethod('delete', '/v2/admin/quiz/trash/empty', { quizIds: JSON.stringify(quizIds) }, { token: token1 });
    expect(() => res).not.toThrow(HTTPError[401]);

    expect(res).toStrictEqual({});

    // Checking trash view function shows no quizzes in trash
    const res3 = requestMethod('get', '/v2/admin/quiz/trash', {}, { token: token1 });
    expect(() => res3).not.toThrow(HTTPError[401]);

    expect(res3).toStrictEqual({
      quizzes: []
    });
  });

  // Error 400 - quizIds are not valid
  test('invalid quizId not owned by user', () => {
    const quizIds = [quizId1, quizId3];
    // const tokenAndQuizzes = {
    //   token: token1,
    //   quizIds: JSON.stringify(quizIds),
    // };

    expect(() => requestMethod('delete', '/v2/admin/quiz/trash/empty', { quizIds: JSON.stringify(quizIds) }, { token: token1 })).toThrow(HTTPError[400]);
  });

  // Error 400, quiz is not in trash
  test('invalid quizId, quiz is not in trash', () => {
    const quizIds = [quizId1, quizId2];
    // const tokenAndQuizzes = {
    //   token: token1,
    //   quizIds: JSON.stringify(quizIds),
    // };

    expect(() => requestMethod('delete', '/v2/admin/quiz/trash/empty', { quizIds: JSON.stringify(quizIds) }, { token: token1 })).toThrow(HTTPError[400]);
  });

  // Error 400, quizId is not valid
  test('invalid quizId', () => {
    const quizIds = [quizId1, quizId1 - 99999];
    // const tokenAndQuizzes = {
    //   token: token1,
    //   quizIds: JSON.stringify(quizIds),
    // };

    expect(() => requestMethod('delete', '/v2/admin/quiz/trash/empty', { quizIds: JSON.stringify(quizIds) }, { token: token1 })).toThrow(HTTPError[400]);
  });

  // Error 401 - token is not in a valid structure
  test('token is not a valid structure, error', () => {
    const quizIds = [quizId1];
    // const tokenAndQuizzes = {
    //   token: '0',
    //   quizIds: [quizId1],
    // };

    expect(() => requestMethod('delete', '/v2/admin/quiz/trash/empty', { quizIds: JSON.stringify(quizIds) }, { token: '0' })).toThrow(HTTPError[401]);
  });

  // Error 403 - token is not for a currently logged in session
  test('token is valid structure, but is not for a currently logged in session', () => {
    // Log user 1 with token 1 out
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 });

    const quizIds = [quizId1];
    // const tokenAndQuizzes = {
    //   token: token1,
    //   quizIds: [quizId1],
    // };

    expect(() => requestMethod('delete', '/v2/admin/quiz/trash/empty', { quizIds: JSON.stringify(quizIds) }, { token: token1 })).toThrow(HTTPError[403]);
  });
});
