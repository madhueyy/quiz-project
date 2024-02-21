import { getData, setData } from './dataStore';
import { userOwnsQuiz, checkTokenStructure, throwTokenError } from './helper';
import { ErrorString, TokenObject, NewUser, EmptyObject, TrashListReturnType, SingleQuizType, QuizObject } from './types';

/**
 * @param {string} token
 * @returns {quizzes: [ {quizId: number, name: string} ] }
 */
// Provides a list of all quizzes that are stored in the
// trash of the currently logged in user.
export function adminTrashView(token: string): TrashListReturnType | ErrorString {
  const data = getData();

  if (!checkTokenStructure(token)) {
    return {
      error: 'Token is not in a valid structure'
    };
  }

  const tokenObject = getData().tokens.find((ele: TokenObject) => ele.token === token);

  // check if user is logged in
  if (!tokenObject) {
    return {
      error: 'User is not currently logged in'
    };
  }

  // const user = getData().users.find(ele => ele.authUserId === tokenObject.userId);

  let trashList = [];

  trashList = data.quizzes
    .filter((quiz: SingleQuizType) => quiz.isTrash === true && quiz.creatorId === tokenObject.userId)
    .map((quiz: SingleQuizType) => ({
      quizId: quiz.quizId,
      name: quiz.name,
    }));

  return {
    quizzes: trashList,
  };
}

/**
 * @param {string} token
 * @param {number} quizId
 * @returns { }
 */
// Restores any given quiz, using it's quizId, from the trash,
// back into the quiz list for the currently logged in user.
export function adminTrashRestore(token: string, quizId: number): EmptyObject | ErrorString {
  const data = getData();

  if (!checkTokenStructure(token)) {
    return {
      error: 'Token is not in a valid structure'
    };
  }

  const tokenObject: TokenObject = getData().tokens.find((ele: TokenObject) => ele.token === token);

  // check if user is logged in
  if (!tokenObject) {
    return {
      error: 'User is not currently logged in'
    };
  }

  // Checking quiz exists
  const quiz: QuizObject = data.quizzes.find((q: QuizObject) => q.quizId === quizId);

  if (quiz === undefined) {
    return {
      error: 'Please enter valid quizId!!'
    };
  }

  // Checking user owns quiz
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    return {
      error: 'Quiz does not belong to current user'
    };
  }

  if (!quiz.isTrash) {
    return {
      error: 'Quiz is not in trash'
    };
  }

  const indexOfQuizInQuizzes: number = data.quizzes.findIndex((quiz: SingleQuizType) => quiz.quizId === quizId);
  data.quizzes[indexOfQuizInQuizzes].isTrash = false;
  data.quizzes[indexOfQuizInQuizzes].timeLastEdited = Math.floor(Date.now() / 1000);

  const authUserId: number = tokenObject.userId;

  const indexOfUserInUsers: number = data.users.findIndex((user: NewUser) => user.authUserId === authUserId);
  data.users[indexOfUserInUsers].quizzesCreated.push(quizId);

  setData(data);
  return {};
}

/**
 * @param {string} token
 * @param {number[]} quizIds
 * @returns { }
 */
// Permanently deletes a quiz from the trash and from quizzes altogether
// for the currently logged in user.
export function adminTrashDelete(token: string, quizIds: number[]): EmptyObject | ErrorString {
  const data = getData();

  if (!checkTokenStructure(token)) {
    return {
      error: 'Token is not in a valid structure'
    };
  }

  const tokenObject = getData().tokens.find((ele: TokenObject) => ele.token === token);

  // check if user is logged in
  if (!tokenObject) {
    return {
      error: 'User is not currently logged in'
    };
  }

  for (const quizId of quizIds) {
    const quizObject = getData().quizzes.find((quiz: SingleQuizType) => (quiz.quizId) === quizId);

    // Checking all quizzes exist
    if (!quizObject) {
      return {
        error: 'Please enter all valid quizIds'
      };
    }

    // Checking user owns all quizzes
    if (!userOwnsQuiz(quizObject, tokenObject.userId)) {
      return {
        error: 'One or more of the Quiz IDs refers to a quiz that this current user does not own'
      };
    }

    if (!quizObject.isTrash) {
      return {
        error: 'One or more of the QuizIDs is not currently in the trash'
      };
    }

    // remove quiz object from quizzes
    data.quizzes = data.quizzes.filter((quiz: SingleQuizType) => (quiz.quizId) !== quizId);
  }

  setData(data);
  return {};
}

import HTTPError from 'http-errors';

/**
 * @param {string} token
 * @returns {quizzes: [ {quizId: number, name: string} ] }
 */
// Provides a list of all quizzes that are stored in the
// trash of the currently logged in user.
export function v2adminTrashView(token: string | string[]): TrashListReturnType | ErrorString {
  const data = getData();

  throwTokenError(token);

  const tokenObject = getData().tokens.find((ele: TokenObject) => ele.token === token);

  let trashList = [];

  trashList = data.quizzes
    .filter((quiz: SingleQuizType) => quiz.isTrash === true && quiz.creatorId === tokenObject.userId)
    .map((quiz: SingleQuizType) => ({
      quizId: quiz.quizId,
      name: quiz.name,
    }));

  return {
    quizzes: trashList,
  };
}

/**
 * @param {string} token
 * @param {number} quizId
 * @returns { }
 */
// Restores any given quiz, using it's quizId, from the trash,
// back into the quiz list for the currently logged in user.
export function v2adminTrashRestore(token: string | string[], quizId: number): EmptyObject | ErrorString {
  const data = getData();

  throwTokenError(token);

  const tokenObject: TokenObject = getData().tokens.find((ele: TokenObject) => ele.token === token);

  // Checking quiz exists
  const quiz: QuizObject = getData().quizzes.find((quiz: SingleQuizType) => quiz.quizId === quizId);
  if (quiz === undefined) {
    throw HTTPError(400, 'Please enter a valid quizId');
  }

  // Checking user owns quiz
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    throw HTTPError(400, 'Quiz does not belong to current user');
  }

  if (!quiz.isTrash) {
    throw HTTPError(400, 'Quiz is not in trash');
  }

  const indexOfQuizInQuizzes: number = data.quizzes.findIndex((quiz: SingleQuizType) => quiz.quizId === quizId);
  data.quizzes[indexOfQuizInQuizzes].isTrash = false;
  data.quizzes[indexOfQuizInQuizzes].timeLastEdited = Math.floor(Date.now() / 1000);

  const authUserId: number = tokenObject.userId;

  const indexOfUserInUsers: number = data.users.findIndex((user: NewUser) => user.authUserId === authUserId);
  data.users[indexOfUserInUsers].quizzesCreated.push(quizId);

  setData(data);
  return {};
}

/**
 * @param {string} token
 * @param {number[]} quizIds
 * @returns { }
 */
// Permanently deletes a quiz from the trash and from quizzes altogether
// for the currently logged in user.
export function v2adminTrashDelete(token: string | string[], quizIds: number[]): EmptyObject | ErrorString {
  const data = getData();

  throwTokenError(token);

  const tokenObject = getData().tokens.find((ele: TokenObject) => ele.token === token);

  for (const quizId of quizIds) {
    const quizObject = getData().quizzes.find((quiz: SingleQuizType) => (quiz.quizId) === quizId);

    // Checking all quizzes exist
    if (!quizObject) {
      throw HTTPError(400, 'Please enter all valid quizIds');
    }

    // Checking user owns all quizzes
    if (!userOwnsQuiz(quizObject, tokenObject.userId)) {
      throw HTTPError(400, 'One or more of the Quiz IDs refers to a quiz that this current user does not own');
    }

    if (!quizObject.isTrash) {
      throw HTTPError(400, 'One or more of the QuizIDs is not currently in the trash');
    }

    // remove quiz object from quizzes
    data.quizzes = data.quizzes.filter((quiz: SingleQuizType) => (quiz.quizId) !== quizId);
  }

  setData(data);
  return {};
}
