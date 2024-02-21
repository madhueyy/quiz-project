import { postMethod, deleteMethod, requestMethod } from './test-helper';
const OK = 200;
import fs from 'fs';
const path = require('path');
import HTTPError from 'http-errors';
interface userType {
  email: string;
  password: string;
  nameFirst: string;
  nameLast: string;
}

describe('HTTP test for clear', () => {
  // clearing already empty data object
  test('Testing clear an already empty data object', () => {
    const res = deleteMethod('/v1/clear', {});
    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);
  });

  let token: string, user: userType;
  beforeEach(() => {
    user = {
      email: 'name123@gmail.com',
      password: 'password1',
      nameFirst: 'Firstname',
      nameLast: 'Lastname'
    };
    token = JSON.parse(String(postMethod('/v1/admin/auth/register',
      user).body)).token;
  });

  // clearing only users
  test('Testing clear only data containing users', () => {
    const res = deleteMethod('/v1/clear', {});
    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);
  });

  // clearing quizzes and users
  test('Clear function successfully clears all data', () => {
    const quiz = { token, description: 'my quiz description' };
    postMethod('/v1/admin/quiz', quiz);
    const res = deleteMethod('/v1/clear', {});
    expect(JSON.parse(String(res.body))).toStrictEqual({});
    expect(res.statusCode).toBe(OK);
  });

  test('testing that if csv, images folders dont exist, they are created', () => {
    const imagesFolderPath = path.join(__dirname, '..', 'images');
    const csvFolderPath = path.join(__dirname, '..', 'csv');

    try {
      fs.rmdirSync(imagesFolderPath, { recursive: true });
    } catch (err) {
      console.log(err);
    }

    try {
      fs.rmdirSync(csvFolderPath, { recursive: true });
    } catch (err) {
      console.log(err);
    }
    expect(() => requestMethod('delete', '/v1/clear', {}, {})).not.toThrow(HTTPError[400]);
  });
});

describe('coverage', () => {
  test('echo', () => {
    expect(requestMethod('get', '/echo', { echo: 'hi' })).toStrictEqual({ value: 'hi' });

    expect(() => requestMethod('get', '/echo', { echo: 'echo' })).toThrow(HTTPError[400]);
  });
});
