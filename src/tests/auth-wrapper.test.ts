import { getMethod, postMethod, putMethod, deleteMethod, requestMethod } from './test-helper';
import { getData } from './../dataStore';
import { UserType, TokenObject } from './../types';
import HTTPError from 'http-errors';
const OK = 200;
const INPUT_ERROR = 400;
const TOKEN_STRUCTURE_ERROR = 401;
const TOKEN_SESSION_ERROR = 403;
const ERROR_STRING = { error: expect.any(String) };
const ANY_STRING = expect.any(String);
const ANY_NUMBER = expect.any(Number);

beforeEach(() => {
  requestMethod('delete', '/v1/clear', {}, {});
});

// ===================== ITERATION 1 FUNCTION TESTS =====================

// ------------------- Tests for adminAuthRegister ----------------------
describe('x v1 HTTP adminAuthRegister', () => {
  beforeEach(() => {
    deleteMethod('/v1/clear', {});
  });

  test('Email address already in use', () => {
    postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'joe',
      nameLast: 'swanson'
    });

    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'joe',
      nameLast: 'swanson'
    });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Email does not satisfy validator.isEmail 1', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joegmail.com',
      password: 'securePW123$',
      nameFirst: 'joe',
      nameLast: 'swanson'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Email does not satisfy validator.isEmail 2', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: '@gmail.com',
      password: 'securePW123$',
      nameFirst: 'joe',
      nameLast: 'swanson'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Email does not satisfy validator.isEmail 3', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail',
      password: 'securePW123$',
      nameFirst: 'joe',
      nameLast: 'swanson'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Email does not satisfy validator.isEmail 4', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: '',
      password: 'securePW123$',
      nameFirst: 'joe',
      nameLast: 'swanson'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Email does satisfy validator.isEmail', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'joe',
      nameLast: 'swanson'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual({
      token: expect.any(String)
    });
    expect(res.statusCode).toBe(OK);
  });

  test('NameFirst has allowed special characters 1', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: "aaa'- john'- ' s",
      nameLast: 'swanson'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual({
      token: expect.any(String)
    });
    expect(res.statusCode).toBe(OK);
  });

  test('NameFirst has disallowed special characters', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'A. Lange & Sohne',
      nameLast: 'swanson'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('NameFirst is less than 2 characters', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'j',
      nameLast: 'swanson'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('NameFirst is greater than twenty characters ', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'abcdeABCDEabcdeABCDEa',
      nameLast: 'swanson'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('NameFirst is exactly two characters', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'ja',
      nameLast: 'swanson'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual({
      token: expect.any(String)
    });
    expect(res.statusCode).toBe(OK);
  });

  test('NameFirst is exactly twenty characters ', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'abcdeABCDEabcdeABCDE',
      nameLast: 'swanson'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual({
      token: expect.any(String)
    });
    expect(res.statusCode).toBe(OK);
  });

  test('NameLast has allowed special characters 1', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'joe',
      nameLast: "patekp-hi lli'pe"
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual({
      token: expect.any(String)
    });
    expect(res.statusCode).toBe(OK);
  });

  test('NameLast has disallowed special characters', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'joe',
      nameLast: 'IWC & Schaffhausen'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('NameLast is less than 2 characters', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'joe',
      nameLast: 'p'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('NameLast is greater than twenty characters ', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'joe',
      nameLast: 'QQQQQwwwwwQQQQQwwwwwQ'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('NameLast is exactly two characters', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'joe',
      nameLast: 'sw'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual({
      token: expect.any(String)
    });
    expect(res.statusCode).toBe(OK);
  });

  test('NameLast is exactly twenty characters ', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'securePW123$',
      nameFirst: 'joe',
      nameLast: 'QQQQQwwwwwQQQQQwwwww'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual({
      token: expect.any(String)
    });
    expect(res.statusCode).toBe(OK);
  });

  test('Password is less than 8 characters', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: '1234567',
      nameFirst: 'rolex',
      nameLast: 'daytona'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Password is exactly 8 characters', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'a2345678',
      nameFirst: 'rolex',
      nameLast: 'daytona'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual({
      token: expect.any(String)
    });
    expect(res.statusCode).toBe(OK);
  });

  test('Password does not have a number', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: 'abcdefghijkadf',
      nameFirst: 'omega',
      nameLast: 'speedmaster'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Password does not have a letter', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: '12342134132',
      nameFirst: 'vacheron',
      nameLast: 'constantin'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Valid password', () => {
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joe@gmail.com',
      password: '1234567a',
      nameFirst: 'cartier',
      nameLast: 'desantos'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual({
      token: expect.any(String)
    });
    expect(res.statusCode).toBe(OK);
  });
});

// ------------------- Tests for adminAuthLogin -------------------------
describe('x v1 HTTP adminAuthLogin', () => {
  let user1 : TokenObject; // the user.
  let user1Token: string; // the user's token.
  beforeEach(() => {
    deleteMethod('/v1/clear', {});
    const res = postMethod('/v1/admin/auth/register', {
      email: 'joseph@gmail.com',
      password: 'rolexdaytona1',
      nameFirst: 'Joseph',
      nameLast: 'Williamson'
    });

    user1Token = JSON.parse(String(res.body)).token;
    user1 = getData().tokens.find((user:TokenObject) => user.token === user1Token);
  });

  test('Logging into non-existent email address', () => {
    const res = postMethod('/v1/admin/auth/login', {
      email: 'nonexistentemail@gmail.com',
      password: '123456789aA'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Logging into existing email with incorrect password', () => {
    const res = postMethod('/v1/admin/auth/login', {
      email: 'joseph@gmail.com',
      password: 'audemarspiguet1'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('Successfully logging into email', () => {
    const res = postMethod('/v1/admin/auth/login', {
      email: 'joseph@gmail.com',
      password: 'rolexdaytona1'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual({
      token: expect.any(String)
    });
    expect(res.statusCode).toBe(OK);
  });

  test('Successfully logging into multiple emails', () => {
    postMethod('/v1/admin/auth/register', {
      email: 'jose@gmail.com',
      password: 'rolexdaytona1',
      nameFirst: 'Michael',
      nameLast: 'Williamson'
    });

    postMethod('/v1/admin/auth/register', {
      email: 'pete@gmail.com',
      password: 'audemarPiguet50',
      nameFirst: 'John',
      nameLast: 'Williamson'
    });

    const res1 = postMethod('/v1/admin/auth/login', {
      email: 'joseph@gmail.com',
      password: 'rolexdaytona1'
    });

    expect(
      JSON.parse(String(
        res1.body
      ))
    ).toStrictEqual({
      token: expect.any(String)
    });
    expect(res1.statusCode).toBe(OK);

    const res2 = postMethod('/v1/admin/auth/login', {
      email: 'jose@gmail.com',
      password: 'rolexdaytona1'
    });

    expect(
      JSON.parse(String(
        res2.body
      ))
    ).toStrictEqual({
      token: expect.any(String)
    });
    expect(res2.statusCode).toBe(OK);

    const res3 = postMethod('/v1/admin/auth/login', {
      email: 'pete@gmail.com',
      password: 'audemarPiguet50'
    });

    expect(
      JSON.parse(String(
        res3.body
      ))
    ).toStrictEqual({
      token: expect.any(String)
    });
    expect(res3.statusCode).toBe(OK);
  });

  test('Logging into existing email with incorrect password, numFailedPasswordsSinceLastLogin increments once', () => {
    const res1 = postMethod('/v1/admin/auth/login', {
      email: 'joseph@gmail.com',
      password: 'audemarspiguet1'
    });

    expect(
      JSON.parse(String(
        res1.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res1.statusCode).toBe(INPUT_ERROR);

    expect(JSON.parse(String(getMethod('/v1/admin/user/details', { token: user1Token }).body))).toStrictEqual(
      {
        user: {
          userId: user1.userId,
          name: expect.any(String),
          email: 'joseph@gmail.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 1
        }
      }
    );
  });

  test('Successfully logging in, numSuccessfulLogins increments once', () => {
    const loginResponse = JSON.parse(String(
      postMethod('/v1/admin/auth/login', {
        email: 'joseph@gmail.com',
        password: 'rolexdaytona1'
      }).body
    ));

    expect(loginResponse).toStrictEqual({
      token: expect.any(String)
    });

    const userDetailsResponse = JSON.parse(String(getMethod('/v1/admin/user/details', { token: user1Token }).body));

    expect(userDetailsResponse).toStrictEqual({
      user: {
        userId: user1.userId,
        name: expect.any(String),
        email: 'joseph@gmail.com',
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
  });

  test('Successfully logging in, numSuccessfulLogins increments twice', () => {
    postMethod('/v1/admin/auth/login', {
      email: 'joseph@gmail.com',
      password: 'rolexdaytona1'
    });

    postMethod('/v1/admin/auth/login', {
      email: 'joseph@gmail.com',
      password: 'rolexdaytona1'
    });
    const userDetailsResponse = JSON.parse(String(getMethod('/v1/admin/user/details', { token: user1Token }).body));

    expect(userDetailsResponse).toStrictEqual({
      user: {
        userId: user1.userId,
        name: expect.any(String),
        email: 'joseph@gmail.com',
        numSuccessfulLogins: 3,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
  });

  test('Failing to login then successful login', () => {
    const loginResponse1 = JSON.parse(String(
      postMethod('/v1/admin/auth/login', {
        email: 'joseph@gmail.com',
        password: 'rolexdaytona12'
      }).body
    ));

    expect(loginResponse1).toStrictEqual(ERROR_STRING);

    const userDetailsResponse1 = JSON.parse(String(getMethod('/v1/admin/user/details', { token: user1Token }).body));

    expect(userDetailsResponse1).toStrictEqual({
      user: {
        userId: user1.userId,
        name: expect.any(String),
        email: 'joseph@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 1
      }
    });

    const loginResponse2 = JSON.parse(String(
      postMethod('/v1/admin/auth/login', {
        email: 'joseph@gmail.com',
        password: 'rolexdaytona1'
      }).body
    ));

    expect(loginResponse2).toStrictEqual({
      token: expect.any(String)
    });

    const userDetailsResponse2 = JSON.parse(String(getMethod('/v1/admin/user/details', { token: user1Token }).body));

    expect(userDetailsResponse2).toStrictEqual({
      user: {
        userId: user1.userId,
        name: expect.any(String),
        email: 'joseph@gmail.com',
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
  });

  test('Logging into a non-existent email address, using a password that exists', () => {
    const res = postMethod('/v1/admin/auth/login', {
      email: 'thisnotaperson@gmail.com',
      password: 'rolexdaytona1'
    });

    expect(
      JSON.parse(String(
        res.body
      ))
    ).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });
});

// --------------- HTTP wrapper tests for get adminUserDetails ----------
describe('v1 HTTP GET adminUserDetails', () => {
  let token: string, user: UserType;
  beforeEach(() => {
    // clear all
    deleteMethod('/v1/clear', {});
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
  test('unsuccessfully return adminUserDetails with code 401', () => {
    const token1 = token + '1212';
    const res = getMethod('/v1/admin/user/details', { token: token1 });
    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  // token session not active (session not logged in error)
  test('unsuccessfully return adminUserDetails with code 403', () => {
    // log the user out
    postMethod('/v1/admin/auth/logout', { token });
    const res = getMethod('/v1/admin/user/details', { token });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_SESSION_ERROR);
  });

  // successfully create quiz
  test('successfully return adminUserDetails code 200', () => {
    const res = getMethod('/v1/admin/user/details', { token });

    expect(JSON.parse(String(res.body))).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Hayden Smith',
        email: 'hayden.smith@unsw.edu.au',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
    expect(res.statusCode).toBe(OK);
  });
});

// --------------- HTTP wrapper tests for get adminUserDetails ----------
describe('v2 HTTP GET adminUserDetails', () => {
  let token1: string, user: UserType;
  beforeEach(() => {
    // clear all
    requestMethod('delete', '/v1/clear', {}, {});
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
  test('unsuccessfully return adminUserDetails with code 401', () => {
    const token2 = token1 + '1212';
    expect(() => requestMethod('get', '/v2/admin/user/details', {}, { token: token2 })).toThrow(HTTPError[401]);
  });

  // token session not active (session not logged in error)
  test('unsuccessfully return adminUserDetails with code 403', () => {
    // log the user out
    requestMethod('post', '/v1/admin/auth/logout', { token: token1 });
    expect(() => requestMethod('get', '/v2/admin/user/details', {}, { token: token1 })).toThrow(HTTPError[403]);
  });

  // successfully create quiz
  test('successfully return adminUserDetails code 200', () => {
    // const res = getMethod('/v1/admin/user/details', { token });
    const userDetails = requestMethod('get', '/v2/admin/user/details', {}, { token: token1 });

    expect(userDetails).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Hayden Smith',
        email: 'hayden.smith@unsw.edu.au',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
  });
});

// ===================== ITERATION 2 FUNCTION TESTS =====================

// --------------- HTTP wrapper tests for adminAuthLogout ----------------
describe('v1 HTTP adminAuthLogout', () => {
  let token:string, user:UserType;
  beforeEach(() => {
    // clear all
    deleteMethod('/v1/clear', {});
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
  test('token not in structure (token structure error) 401 ', () => {
    const token1 = token + '1212';
    const res = postMethod('/v1/admin/auth/logout', { token: token1 });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  // unsuccessfully logout user (token already logged out)
  test('unsuccessfully logout user with code 400', () => {
    postMethod('/v1/admin/auth/logout', { token });
    const res2 = postMethod('/v1/admin/auth/logout', { token });
    expect(JSON.parse(String(res2.body))).toStrictEqual(ERROR_STRING);
    expect(res2.statusCode).toBe(INPUT_ERROR);
  });

  // successfully logout user
  test('successfully logout user with code 200', () => {
    const res = postMethod('/v1/admin/auth/logout', { token });
    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);
  });
});

// --------------- HTTP wrapper tests for adminAuthLogout ----------------
describe('v2 HTTP adminAuthLogout', () => {
  let token:string, user:UserType;
  beforeEach(() => {
    // clear all
    deleteMethod('/v1/clear', {});
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
  test('token not in structure (token structure error) 401', () => {
    const token1 = token + '1212';
    expect(() => requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 })).toThrow(HTTPError[401]);
  });

  // unsuccessfully logout user (token already logged out)
  test('unsuccessfully logout user with code 400', () => {
    requestMethod('post', '/v2/admin/auth/logout', {}, { token: token });
    expect(() => requestMethod('post', '/v2/admin/auth/logout', {}, { token: token })).toThrow(HTTPError[400]);
  });

  // successfully logout user
  test('successfully logout user with code 200', () => {
    expect(() => requestMethod('post', '/v2/admin/auth/logout', {}, { token: token })).not.toThrow(HTTPError[400]);
  });
});

// --------------- HTTP wrapper tests for putAdminUserDetails ------------
describe('v1 HTTP PUT AdminUserDetails', () => {
  let token:string, user:UserType;
  beforeEach(() => {
    // clear all
    deleteMethod('/v1/clear', {});
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
  test('unsuccessfully change user details with code 401', () => {
    const token1 = token + '1212';
    const res = putMethod('/v1/admin/user/details',
      {
        token: token1,
        email: 'haydensmith123@unsw.edu.au',
        nameFirst: 'Hendo',
        nameLast: 'Smith',
      });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  // unsuccessfully change user password (token not currently logged in)
  test('unsuccessfully change user details with code 403', () => {
    postMethod('/v1/admin/auth/logout', { token });
    const res2 = putMethod('/v1/admin/user/details',
      {
        token: token,
        email: 'haydensmith123@unsw.edu.au',
        nameFirst: 'Hendo',
        nameLast: 'Smith',
      });

    expect(JSON.parse(String(res2.body))).toStrictEqual(ERROR_STRING);
    expect(res2.statusCode).toBe(TOKEN_SESSION_ERROR);
  });

  // Email is currently used by another user (excluding the current authorised user)
  test('unsuccessful change email (email currently in use by another user', () => {
    // clear all
    deleteMethod('/v1/clear', {});
    const user1: UserType = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    // create token for registered user1
    postMethod('/v1/admin/auth/register', user1);
    const user2: UserType = {
      email: 'joe.swanson@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hendo',
      nameLast: 'Smith'
    };
    // create token for registered user2
    const token2 :string = JSON.parse(String(postMethod('/v1/admin/auth/register', user2).body)).token;
    // user2 tries changing their email to already existing email
    const res3:any = putMethod('/v1/admin/user/details',
      {
        token: token2,
        email: 'hayden.smith@unsw.edu.au',
        nameFirst: 'Hendo',
        nameLast: 'Smith',
      });

    expect(JSON.parse(String(res3.body))).toStrictEqual(ERROR_STRING);
    expect(res3.statusCode).toBe(INPUT_ERROR);
  });

  // Email does not satisfy this: https://www.npmjs.com/package/validator (validator.isEmail)
  describe('Email does not satisfy this: https://www.npmjs.com/package/validator (validator.isEmail)', () => {
    let token:string, user:UserType;
    beforeEach(() => {
      // clear all
      deleteMethod('/v1/clear', {});
      user = {
        email: 'hayden.smith@unsw.edu.au',
        password: 'haydensmith123',
        nameFirst: 'Hayden',
        nameLast: 'Smith'
      };
      // create token for registered user
      token = JSON.parse(String(postMethod('/v1/admin/auth/register', user).body)).token;
    });
    test('Email does not satisfy validator.isEmail 2', () => {
      const res = putMethod('/v1/admin/user/details', {
        token: token,
        email: '@gmail.com',
        nameFirst: 'joe',
        nameLast: 'swanson'
      });

      expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
      expect(res.statusCode).toBe(INPUT_ERROR);
    });

    test('Email does not satisfy validator.isEmail 3', () => {
      const res = putMethod('/v1/admin/user/details', {
        token: token,
        email: 'joe@gmail',
        nameFirst: 'joe',
        nameLast: 'swanson'
      });

      expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
      expect(res.statusCode).toBe(INPUT_ERROR);
    });

    test('Email does not satisfy validator.isEmail 4', () => {
      const res = putMethod('/v1/admin/user/details', {
        token: token,
        email: '',
        nameFirst: 'joe',
        nameLast: 'swanson'
      });

      expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
      expect(res.statusCode).toBe(INPUT_ERROR);
    });
  });

  // NameFirst contains characters other than lowercase letters, uppercase letters, spaces, hyphens, or apostrophes
  test('NameFirst has allowed special characters 1', () => {
    const res = putMethod('/v1/admin/user/details', {
      token: token,
      email: 'joe.swanson@gmail.com',
      nameFirst: "aaa'- john'- ' s",
      nameLast: 'swanson'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);
  });

  test('NameFirst has disallowed special characters', () => {
    const res = putMethod('/v1/admin/user/details', {
      token: token,
      email: 'joe@gmail.com',
      nameFirst: 'A. Lange & Sohne',
      nameLast: 'swanson'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // NameFirst is less than 2 characters or more than 20 characters
  test('NameFirst is less than 2 characters', () => {
    const res = putMethod('/v1/admin/user/details', {
      token: token,
      email: 'joe@gmail.com',
      nameFirst: 'j',
      nameLast: 'swanson'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('NameFirst is greater than twenty characters ', () => {
    const res = putMethod('/v1/admin/user/details', {
      token: token,
      email: 'joe@gmail.com',
      nameFirst: 'abcdeABCDEabcdeABCDEa',
      nameLast: 'swanson'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('NameFirst is exactly two characters', () => {
    const res = putMethod('/v1/admin/user/details', {
      token: token,
      email: 'joe@gmail.com',
      nameFirst: 'ja',
      nameLast: 'swanson'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);
  });

  test('NameFirst is exactly twenty characters ', () => {
    const res = putMethod('/v1/admin/user/details', {
      token: token,
      email: 'joe@gmail.com',
      nameFirst: 'abcdeABCDEabcdeABCDE',
      nameLast: 'swanson'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);
  });

  // NameLast contains characters other than lowercase letters, uppercase letters, spaces, hyphens, or apostrophes
  test('NameLast has allowed special characters 1', () => {
    const res = putMethod('/v1/admin/user/details', {
      token: token,
      email: 'joe@gmail.com',
      nameFirst: 'joe',
      nameLast: "patekp-hi lli'pe"
    });

    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);
  });

  test('NameLast has disallowed special characters', () => {
    const res = putMethod('/v1/admin/user/details', {
      token: token,
      email: 'joe@gmail.com',
      nameFirst: 'joe',
      nameLast: 'IWC & Schaffhausen'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // NameLast is less than 2 characters or more than 20 characters
  test('NameLast is less than 2 characters', () => {
    const res = putMethod('/v1/admin/user/details', {
      token: token,
      email: 'joe@gmail.com',
      nameFirst: 'joe',
      nameLast: 'p'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('NameLast is greater than twenty characters ', () => {
    const res = putMethod('/v1/admin/user/details', {
      token: token,
      email: 'joe@gmail.com',
      nameFirst: 'joe',
      nameLast: 'QQQQQwwwwwQQQQQwwwwwQ'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('NameLast is exactly two characters', () => {
    const res = putMethod('/v1/admin/user/details', {
      token: token,
      email: 'joe@gmail.com',
      nameFirst: 'joe',
      nameLast: 'sw'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);
  });

  test('NameLast is exactly twenty characters ', () => {
    const res = putMethod('/v1/admin/user/details', {
      token: token,
      email: 'joe@gmail.com',
      nameFirst: 'joe',
      nameLast: 'QQQQQwwwwwQQQQQwwwww'
    });

    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);
  });
});

// --------------- HTTP wrapper tests for putAdminUserDetails ------------
describe('v2 HTTP PUT AdminUserDetails', () => {
  let token1: string, user: UserType;
  beforeEach(() => {
    // clear all
    requestMethod('delete', '/v1/clear', {}, {});
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
  test('unsuccessfully change user details with code 401', () => {
    const token2 = token1 + '1212';
    expect(() => requestMethod('put', '/v2/admin/user/details', {
      email: 'haydensmith123@unsw.edu.au',
      nameFirst: 'Hendo',
      nameLast: 'Smith'
    },
    { token: token2 })).toThrow(HTTPError[401]);
  });

  // token session not active (session not logged in error)
  test('unsuccessfully return adminUserDetails with code 403', () => {
    // log the user out
    requestMethod('post', '/v1/admin/auth/logout', { token: token1 });
    expect(() => requestMethod('put', '/v2/admin/user/details', {
      email: 'haydensmith123@unsw.edu.au',
      nameFirst: 'Hendo',
      nameLast: 'Smith'
    },
    { token: token1 })).toThrow(HTTPError[403]);
  });

  // Email is currently used by another user (excluding the current authorised user)
  test('unsuccessful change email (email currently in use by another user)', () => {
    // clear all
    requestMethod('delete', '/v1/clear', {}, {});
    const user1: UserType = {
      email: 'hayden.smith@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hayden',
      nameLast: 'Smith'
    };
    // create token for registered user
    requestMethod('post', '/v1/admin/auth/register', user1);
    const user2: UserType = {
      email: 'joe.swanson@unsw.edu.au',
      password: 'haydensmith123',
      nameFirst: 'Hendo',
      nameLast: 'Smith'
    };
    // create token for registered user
    const token2 = requestMethod('post', '/v1/admin/auth/register', user2).token;
    // user2 tries changing their email to already existing email
    expect(() => requestMethod('put', '/v2/admin/user/details', {
      email: 'hayden.smith@unsw.edu.au',
      nameFirst: 'Hendo',
      nameLast: 'Smith'
    },
    { token: token2 })).toThrow(HTTPError[400]);
  });

  // Email does not satisfy this: https://www.npmjs.com/package/validator (validator.isEmail)
  describe('Email does not satisfy this: https://www.npmjs.com/package/validator (validator.isEmail)', () => {
    let token1: string, user: UserType;
    beforeEach(() => {
      // clear all
      requestMethod('delete', '/v1/clear', {}, {});
      user = {
        email: 'hayden.smith@unsw.edu.au',
        password: 'haydensmith123',
        nameFirst: 'Hayden',
        nameLast: 'Smith'
      };
      // create token for registered user
      token1 = requestMethod('post', '/v1/admin/auth/register', user).token;
    });
    test('Email does not satisfy validator.isEmail 2', () => {
      expect(() => requestMethod('put', '/v2/admin/user/details', {
        email: '@gmail.com',
        nameFirst: 'joe',
        nameLast: 'swanson'
      },
      { token: token1 })).toThrow(HTTPError[400]);
    });

    test('Email does not satisfy validator.isEmail 3', () => {
      expect(() => requestMethod('put', '/v2/admin/user/details', {
        email: 'joe@gmail',
        nameFirst: 'joe',
        nameLast: 'swanson'
      },
      { token: token1 })).toThrow(HTTPError[400]);
    });

    test('Email does not satisfy validator.isEmail 4', () => {
      expect(() => requestMethod('put', '/v2/admin/user/details', {
        email: '',
        nameFirst: 'joe',
        nameLast: 'swanson'
      },
      { token: token1 })).toThrow(HTTPError[400]);
    });
  });

  // NameFirst contains characters other than lowercase letters, uppercase letters, spaces, hyphens, or apostrophes
  test('NameFirst has allowed special characters 1', () => {
    expect(requestMethod('put', '/v2/admin/user/details', {
      email: 'joe.swanson@gmail.com',
      nameFirst: "aaa'- john'- ' s",
      nameLast: 'swanson'
    },
    { token: token1 })).toStrictEqual({});
  });

  test('NameFirst has disallowed special characters', () => {
    expect(() => requestMethod('put', '/v2/admin/user/details', {
      email: 'joe@gmail.com',
      nameFirst: 'A. Lange & Sohne',
      nameLast: 'swanson'
    },
    { token: token1 })).toThrow(HTTPError[400]);
  });

  // NameFirst is less than 2 characters or more than 20 characters
  test('NameFirst is less than 2 characters', () => {
    expect(() => requestMethod('put', '/v2/admin/user/details', {
      email: 'joe@gmail.com',
      nameFirst: 'j',
      nameLast: 'swanson'
    },
    { token: token1 })).toThrow(HTTPError[400]);
  });

  test('NameFirst is greater than twenty characters ', () => {
    expect(() => requestMethod('put', '/v2/admin/user/details', {
      email: 'joe@gmail.com',
      nameFirst: 'abcdeABCDEabcdeABCDEa',
      nameLast: 'swanson'
    },
    { token: token1 })).toThrow(HTTPError[400]);
  });

  test('NameFirst is exactly two characters', () => {
    expect(requestMethod('put', '/v2/admin/user/details', {
      email: 'joe.swanson@gmail.com',
      nameFirst: 'ja',
      nameLast: 'swanson'
    },
    { token: token1 })).toStrictEqual({});
  });

  test('NameFirst is exactly twenty characters ', () => {
    expect(requestMethod('put', '/v2/admin/user/details', {
      email: 'joe.swanson@gmail.com',
      nameFirst: 'abcdeABCDEabcdeABCDE',
      nameLast: 'swanson'
    },
    { token: token1 })).toStrictEqual({});
  });

  // NameLast contains characters other than lowercase letters, uppercase letters, spaces, hyphens, or apostrophes
  test('NameLast has allowed special characters 1', () => {
    expect(requestMethod('put', '/v2/admin/user/details', {
      email: 'joe.swanson@gmail.com',
      nameFirst: 'joe',
      nameLast: "patekp-hi lli'pe"
    },
    { token: token1 })).toStrictEqual({});
  });

  test('NameLast has disallowed special characters', () => {
    expect(() => requestMethod('put', '/v2/admin/user/details', {
      email: 'joe@gmail.com',
      nameFirst: 'joe',
      nameLast: 'IWC & Schaffhausen'
    },
    { token: token1 })).toThrow(HTTPError[400]);
  });

  // NameLast is less than 2 characters or more than 20 characters
  test('NameLast is less than 2 characters', () => {
    expect(() => requestMethod('put', '/v2/admin/user/details', {
      email: 'joe@gmail.com',
      nameFirst: 'joe',
      nameLast: 'p'
    },
    { token: token1 })).toThrow(HTTPError[400]);
  });

  test('NameLast is greater than twenty characters ', () => {
    expect(() => requestMethod('put', '/v2/admin/user/details', {
      email: 'joe@gmail.com',
      nameFirst: 'joe',
      nameLast: 'QQQQQwwwwwQQQQQwwwwwQ'
    },
    { token: token1 })).toThrow(HTTPError[400]);
  });

  test('NameLast is exactly two characters', () => {
    expect(requestMethod('put', '/v2/admin/user/details', {
      email: 'joe.swanson@gmail.com',
      nameFirst: 'joe',
      nameLast: 'sw'
    },
    { token: token1 })).toStrictEqual({});
  });

  test('NameLast is exactly twenty characters ', () => {
    expect(requestMethod('put', '/v2/admin/user/details', {
      email: 'joe.swanson@gmail.com',
      nameFirst: 'joe',
      nameLast: 'QQQQQwwwwwQQQQQwwwww'
    },
    { token: token1 })).toStrictEqual({});
  });
});

// --------------- HTTP wrapper tests for adminUserPassword --------------
describe('v1 HTTP adminUserPassword', () => {
  let token:string, user:UserType;
  beforeEach(() => {
    // clear all
    deleteMethod('/v1/clear', {});
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
  test('unsuccessfully change user password with code 401', () => {
    const token1 = token + '1212';
    const res = putMethod('/v1/admin/user/password', { token: token1, oldPassword: 'haydensmith123', newPassword: 'haydensmith1234' });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(TOKEN_STRUCTURE_ERROR);
  });

  // unsuccessfully change user password (token not currently logged in)
  test('unsuccessfully change user password with code 403', () => {
    postMethod('/v1/admin/auth/logout', { token });
    const res2 = putMethod('/v1/admin/user/password', { token, oldPassword: 'haydensmith123', newPassword: 'haydensmith1234' });

    expect(JSON.parse(String(res2.body))).toStrictEqual(ERROR_STRING);
    expect(res2.statusCode).toBe(TOKEN_SESSION_ERROR);
  });

  // unsuccessfully change password (Old Password is not the correct old password)
  test('unsuccessfully change password user with code 400', () => {
    const res = putMethod('/v1/admin/user/password', { token, oldPassword: 'haydensmith12', newPassword: 'haydensmith1234' });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // unsuccessfully change password (New Password has already been used before by this user)
  test('unsuccessfully change password user with code 400', () => {
    const res = putMethod('/v1/admin/user/password', { token, oldPassword: 'haydensmith123', newPassword: 'haydensmith123' });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // unsuccessfully change password (New Password is less than 8 characters)
  test('unsuccessfully change password user with code 400', () => {
    const res = putMethod('/v1/admin/user/password', { token, oldPassword: 'haydensmith123', newPassword: 'hayth3' });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // unsuccessfully change password (New Password does not contain at least one number)
  test('unsuccessfully change password user with code 400', () => {
    const res = putMethod('/v1/admin/user/password', { token, oldPassword: 'haydensmith123', newPassword: 'haydithsmith' });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  // unsuccessfully change password (New Password does not contain at least one number)
  test('unsuccessfully change password user with code 400', () => {
    const res = putMethod('/v1/admin/user/password', { token, oldPassword: 'haydensmith123', newPassword: '123456789' });

    expect(JSON.parse(String(res.body))).toStrictEqual(ERROR_STRING);
    expect(res.statusCode).toBe(INPUT_ERROR);
  });

  test('successfully change password user with code 200', () => {
    const res = putMethod('/v1/admin/user/password', { token, oldPassword: 'haydensmith123', newPassword: 'haydensmith1234' });
    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);
  });
});

// --------------- HTTP wrapper tests for adminUserPassword --------------
describe('v2 HTTP adminUserPassword', () => {
  let token1: string, user: UserType;
  beforeEach(() => {
    // clear all
    requestMethod('delete', '/v1/clear', {}, {});
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
  test('unsuccessfully change user password with code 401', () => {
    const token2 = token1 + '1212';
    expect(() => requestMethod('put', '/v2/admin/user/password', {
      oldPassword: 'haydensmith123',
      newPassword: 'haydensmith1234'
    },
    { token: token2 })).toThrow(HTTPError[401]);
  });

  // token session not active (session not logged in error)
  test('unsuccessfully change user password with code 403', () => {
    // log the user out
    requestMethod('post', '/v1/admin/auth/logout', { token: token1 });
    expect(() => requestMethod('put', '/v2/admin/user/password', {
      oldPassword: 'haydensmith123',
      newPassword: 'haydensmith1234'
    },
    { token: token1 })).toThrow(HTTPError[403]);
  });

  // unsuccessfully change password (Old Password is not the correct old password)
  test('unsuccessfully change password user with code 400', () => {
    expect(() => requestMethod('put', '/v2/admin/user/password', {
      oldPassword: 'haydensmith12',
      newPassword: 'haydensmith1234'
    },
    { token: token1 })).toThrow(HTTPError[400]);
  });

  // unsuccessfully change password (New Password has already been used before by this user)
  test('unsuccessfully change password user with code 400', () => {
    expect(() => requestMethod('put', '/v2/admin/user/password', {
      oldPassword: 'haydensmith123',
      newPassword: 'haydensmith123'
    },
    { token: token1 })).toThrow(HTTPError[400]);
  });

  // unsuccessfully change password (New Password is less than 8 characters)
  test('unsuccessfully change password user with code 400', () => {
    expect(() => requestMethod('put', '/v2/admin/user/password', {
      oldPassword: 'haydensmith123',
      newPassword: 'hayth3'
    },
    { token: token1 })).toThrow(HTTPError[400]);
  });

  // unsuccessfully change password (New Password does not contain at least one number)
  test('unsuccessfully change password user with code 400', () => {
    expect(() => requestMethod('put', '/v2/admin/user/password', {
      oldPassword: 'haydensmith123',
      newPassword: 'haydithsmith'
    },
    { token: token1 })).toThrow(HTTPError[400]);
  });

  // unsuccessfully change password (New Password does not contain at least one letter)
  test('unsuccessfully change password user with code 400', () => {
    expect(() => requestMethod('put', '/v2/admin/user/password', {
      oldPassword: 'haydensmith123',
      newPassword: '123456789'
    },
    { token: token1 })).toThrow(HTTPError[400]);
  });

  test('successfully change password user with code 200', () => {
    expect(requestMethod('put', '/v2/admin/user/password', {
      oldPassword: 'haydensmith123',
      newPassword: 'haydensmith1234'
    },
    { token: token1 })).toStrictEqual({});
  });

  // successfully logout user
  test('successfully logout user with code 200', () => {
    expect(requestMethod('post', '/v2/admin/auth/logout', {}, { token: token1 })).toStrictEqual({});
  });
});
