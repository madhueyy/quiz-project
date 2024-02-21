// @ts-ignore
// @ts-nocheck
import HTTPError from 'http-errors';

import fs from 'fs';
const path = require('path');
import { PORT, HOST } from './server';

import { getData, setData } from './dataStore';
import {
  getUser, getUserWithEmail, getUsersQuizzesByUserId, getValidQuiz,
  checkQuizName, quizNameNotUsed, userOwnsQuiz, getUNIXTime, checkTokenError, randomColour, correctAnswerExists, throwTokenError, throwQuizError, fetchDownloadImage, getNumActiveSessions,
  sessionGetState, hasCommonElement, getPlayerQuestionScore, getPlayerQuestionScoreByPlayerId, getPlayerQuestionRankByPlayerId
} from './helper';
import { ErrorString, ReturnAdminQuizList, ReturnQuizCreate, QuizInfoReturnType, QuestionCreateBody, EmptyObject, DuplicateQuizQuestionCreate, ReturnQuizQuestionCreate, QuizObject, NewUser, TokenObject, SingleQuestionType } from './types';
import { Token } from 'yaml/dist/parse/cst';

// ----------------------- ITERATION 1 FUNCTIONS ------------------------

/**
 * @param {string} token
 * @returns {quizzes: [ {quizId: number, name: string} ] }
 */
// Provide a list of all quizzes that are owned by the currently logged in user.
function adminQuizList(token: string): ReturnAdminQuizList | ErrorString {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const tokenObject = data.tokens.find((ele:TokenObject) => ele.token === token);
  const authUserId: number = tokenObject.userId;
  const user = getUser(authUserId);
  const quizList: {quizId: number, name: string}[] = [];

  // Check if user exists
  // if (!user) {
  //   return { error: 'AuthUserId is not a valid user' };
  //   // throw HTTPError(400, 'Old Password is not correct');
  // }

  // Add properties of each quiz created by the user to quizList array
  for (const quiz of user.quizzesCreated) {
    const quizObject = getValidQuiz(quiz);
    // only show active quizzes
    if (!quizObject.isTrash) {
      const objectToPush = {
        quizId: quizObject.quizId,
        name: quizObject.name,
      };
      quizList.push(objectToPush);
    } else {

    }
  }

  return {
    quizzes: quizList,
  };
}

/**
 * @param {string} token
 * @returns {quizzes: [ {quizId: number, name: string} ] }
 */
// Provide a list of all quizzes that are owned by the currently logged in user.
function v2adminQuizList(token: string): ReturnAdminQuizList | ErrorString {
  // Error 401/403
  throwTokenError(token);

  const data = getData();
  const tokenObject = data.tokens.find((ele:TokenObject) => ele.token === token);
  const authUserId: number = tokenObject.userId;
  const user = getUser(authUserId);
  const quizList: {quizId: number, name: string}[] = [];

  // Check if user exists
  // if (!user) {
  //   return { error: 'AuthUserId is not a valid user' };
  //   // throw HTTPError(400, 'Old Password is not correct');
  // }

  // Add properties of each quiz created by the user to quizList array
  for (const quiz of user.quizzesCreated) {
    const quizObject = getValidQuiz(quiz);
    // only show active quizzes
    if (!quizObject.isTrash) {
      const objectToPush = {
        quizId: quizObject.quizId,
        name: quizObject.name,
      };
      quizList.push(objectToPush);
    } else {

    }
  }

  return {
    quizzes: quizList,
  };
}

/**
 * @param {string} token
 * @param {string} name
 * @param {string} description
 * @returns {quizId: number}
 */
// Given basic details about a new quiz, create one for the logged in user.
function v2adminQuizCreate(token: string, name: string, description: string): ReturnQuizCreate | ErrorString {
  // Error 401/403
  throwTokenError(token);

  const data = getData();
  const tokenObject = data.tokens.find((ele:TokenObject) => ele.token === token);
  const authUserId: number = tokenObject.userId;

  // Ensure valid quiz name (ERROR 400)
  if (!checkQuizName(name)) {
    throw HTTPError(400, 'quizName out of accepted length or containing unallowed characters');
  }

  // Ensure quiz name is not already used by the user for another quiz (ERROR 400)
  if (!quizNameNotUsed(authUserId, name)) {
    throw HTTPError(400, 'quizName is already used by the user for another quiz');
  }

  // Ensure desrciption is less than or equal to 100 characters (ERROR 400)
  if (description.length > 100) {
    throw HTTPError(400, 'description is over 100 characters long');
  }

  // Unique quizId created by adding current time (in ms after 1/1/1970) with
  // a random number between 0 and 999. This is (almost) guaranteed to be unique
  // unless more than one quiz is created within a millisecond AND the created
  // quizzes happen to have the same randomly generated number.
  const uniqueQuizId = Date.now() + Math.floor(Math.random() * 1000000000);

  // Valid arguments, create quiz
  const newQuiz: QuizObject = {
    creatorId: authUserId,
    name: name,
    description: description,
    quizId: uniqueQuizId,
    timeCreated: Math.floor(Date.now() / 1000),
    timeLastEdited: Math.floor(Date.now() / 1000),
    numQuestions: 0,
    questions: [],
    duration: 0,
    thumbnailUrl: '',
    isTrash: false
  };

  // Modifying data
  const indexOfUserInUsers = data.users.findIndex((user:NewUser) => user.authUserId === authUserId);
  data.users[indexOfUserInUsers].quizzesCreated.push(uniqueQuizId);
  data.quizzes.push(newQuiz);
  setData(data);

  return {
    quizId: uniqueQuizId,
  };
}

/**
 * @param {string} token
 * @param {string} name
 * @param {string} description
 * @returns {quizId: number}
 */
// Given basic details about a new quiz, create one for the logged in user.
function adminQuizCreate(token: string, name: string, description: string): ReturnQuizCreate | ErrorString {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const tokenObject = data.tokens.find((ele:TokenObject) => ele.token === token);
  const authUserId: number = tokenObject.userId;

  // Ensure valid quiz name (ERROR 400)
  if (!checkQuizName(name)) {
    return { error: 'quizName out of accepted length or containing unallowed characters' };
  }

  // Ensure quiz name is not already used by the user for another quiz (ERROR 400)
  if (!quizNameNotUsed(authUserId, name)) {
    return { error: 'quizName is already used by the user for another quiz' };
  }

  // Ensure desrciption is less than or equal to 100 characters (ERROR 400)
  if (description.length > 100) {
    return { error: 'description is over 100 characters long' };
  }

  // Unique quizId created by adding current time (in ms after 1/1/1970) with
  // a random number between 0 and 999. This is (almost) guaranteed to be unique
  // unless more than one quiz is created within a millisecond AND the created
  // quizzes happen to have the same randomly generated number between 0 and 999.
  const uniqueQuizId = Date.now() + Math.floor(Math.random() * 1000000000);

  // Valid arguments, create quiz
  const newQuiz: QuizObject = {
    creatorId: authUserId,
    name: name,
    description: description,
    quizId: uniqueQuizId,
    timeCreated: Math.floor(Date.now() / 1000),
    timeLastEdited: Math.floor(Date.now() / 1000),
    numQuestions: 0,
    questions: [],
    duration: 0,
    isTrash: false
  };

  // Modifying data
  const indexOfUserInUsers = data.users.findIndex((user:NewUser) => user.authUserId === authUserId);
  data.users[indexOfUserInUsers].quizzesCreated.push(uniqueQuizId);
  data.quizzes.push(newQuiz);
  setData(data);

  return {
    quizId: uniqueQuizId,
  };
}

/**
 *
 * @param {string} token
 * @param {number} quizId
 * @returns { }
 */
// Given a particular quiz, permanently remove the quiz.
function v2adminQuizRemove(token: string | string[], quizId: number): EmptyObject | ErrorString {
  // Error 401/403
  throwTokenError(token);

  const data = getData();
  const tokenObject = data.tokens.find((ele:TokenObject) => ele.token === token);
  const quiz = getValidQuiz(quizId);

  // ensure valid quiz id (ERROR 400)
  if (!quiz) {
    throw HTTPError(400, 'Please enter a valid quizId adminquizremove');
  }

  // ensure user owns quiz (ERROR 400)
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    throw HTTPError(400, 'Quiz does not belong to current user');
  }

  // ensure that all sessions of the quiz are in END state
  // commented cause STATE functions to be implemented
  // for (const s in data.sessions) {
  //   if (s.quiz.quizId === quizId && s.state !== 'END') {
  //     throw HTTPError(400, 'All quizzes not in END state');
  //   }
  // }

  // remove quizId from user's quizzesCreated
  const authUserId: number = tokenObject.userId;
  const indexOfUserInUsers = data.users.findIndex((user:NewUser) => user.authUserId === authUserId);
  data.users[indexOfUserInUsers].quizzesCreated = data.users[indexOfUserInUsers].quizzesCreated.filter((id:number) => id !== quizId);

  const indexOfQuizInQuizzes = data.quizzes.findIndex((quiz:QuizObject) => quiz.quizId === quizId);
  // send quiz to trash
  data.quizzes[indexOfQuizInQuizzes].isTrash = true;
  // change time last edited
  data.quizzes[indexOfQuizInQuizzes].timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);

  return { };
}

/**
 *
 * @param {string} token
 * @param {number} quizId
 * @returns { }
 */
// Given a particular quiz, permanently remove the quiz.
function adminQuizRemove(token: string, quizId: number): EmptyObject | ErrorString {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const tokenObject = data.tokens.find((ele:TokenObject) => ele.token === token);

  const quiz = getValidQuiz(quizId);

  // ensure valid quiz id (ERROR 400)
  if (!quiz) {
    return { error: 'Please enter a valid quizId' };
  }

  // ensure user owns quiz (ERROR 400)
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    return { error: 'Quiz does not belong to current user' };
  }

  // remove quizId from user's quizzesCreated
  const authUserId: number = tokenObject.userId;
  const indexOfUserInUsers = data.users.findIndex((user:NewUser) => user.authUserId === authUserId);
  data.users[indexOfUserInUsers].quizzesCreated = data.users[indexOfUserInUsers].quizzesCreated.filter((id:number) => id !== quizId);

  const indexOfQuizInQuizzes = data.quizzes.findIndex((quiz:QuizObject) => quiz.quizId === quizId);
  // send quiz to trash
  data.quizzes[indexOfQuizInQuizzes].isTrash = true;
  // change time last edited
  data.quizzes[indexOfQuizInQuizzes].timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);

  return { };
}

/**
 *
 * @param {string} token
 * @param {number} quizId
 * @returns {QuizInfoReturnType | ErrorString}
 */
// Get all of the relevant cinformation about the current quiz.
function adminQuizInfo(token: string, quizId: number): QuizInfoReturnType | ErrorString {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const tokenObject = getData().tokens.find((ele:TokenObject) => ele.token === token);

  // Checking quiz exists
  const quiz = getValidQuiz(quizId);
  if (quiz === undefined) {
    return {
      error: 'Please enter a valid quizId. adminquizinfo'
    };
  }

  // Checking user owns quiz
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    return {
      error: 'Quiz does not belong to current user'
    };
  }
  const questions = quiz.questions;
  for (const question of questions) {
    if (question.hasOwnProperty('thumbnailUrl')) {
      delete question.thumbnailUrl;
    }
  }

  return {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: quiz.numQuestions,
    questions: questions,
    duration: quiz.duration,
  };
}

/**
 *
 * @param {string} token
 * @param {number} quizId
 * @param {string} name
 * @returns { void  }
 */
// Update the name of the relevant quiz.
function adminQuizNameUpdate(token: string, quizId: number, name: string): EmptyObject | ErrorString {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const tokenObject = getData().tokens.find((ele:TokenObject) => ele.token === token);

  // Checking quiz exists
  const quiz = getValidQuiz(quizId);
  if (quiz === undefined) {
    return {
      error: 'Please enter a valid quizId. getvalidquiz'
    };
  }

  // Ensure valid quiz name
  if (!checkQuizName(name)) {
    return { error: 'quizName out of accepted length or containing unallowed characters' };
  }

  // Ensure quiz name is not already used by the user for another quiz
  if (!quizNameNotUsed(tokenObject.userId, name)) {
    return { error: 'quizName is already used by the user for another quiz' };
  }

  // Checking user owns quiz
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    return {
      error: 'Quiz does not belong to current user'
    };
  }

  const indexOfQuizInQuizzes = data.quizzes.findIndex((quiz:QuizObject) => quiz.quizId === quizId);
  data.quizzes[indexOfQuizInQuizzes].name = name;
  data.quizzes[indexOfQuizInQuizzes].timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);
  return { };
}

/**
 *
 * @param {string} token
 * @param {number} quizId
 * @returns {QuizInfoReturnType | ErrorString}
 */
// Get all of the relevant cinformation about the current quiz.
export function v2adminQuizInfo(token: string | string[], quizId: number): QuizInfoReturnType | ErrorString {
  // Error 401/403
  throwTokenError(token);

  const tokenObject = getData().tokens.find((ele:TokenObject) => ele.token === token);

  // Checking quiz exists
  const quiz = getValidQuiz(quizId);
  if (quiz === undefined) {
    throw HTTPError(400, 'Please enter a valid quizId');
  }

  // Checking user owns quiz
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    throw HTTPError(400, 'Quiz does not belong to current user');
  }

  return {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: quiz.numQuestions,
    questions: quiz.questions,
    duration: quiz.duration,
    thumbnailUrl: quiz.thumbnailUrl
  };
}

/**
 *
 * @param {string} token
 * @param {number} quizId
 * @param {string} name
 * @returns { void  }
 */
// Update the name of the relevant quiz.
export function v2adminQuizNameUpdate(token: string | string[], quizId: number, name: string): EmptyObject | ErrorString {
  // Error 401/403
  throwTokenError(token);

  const data = getData();
  const tokenObject = getData().tokens.find((ele:TokenObject) => ele.token === token);

  // Checking quiz exists
  const quiz = getValidQuiz(quizId);
  if (quiz === undefined) {
    throw HTTPError(400, 'Please enter a valid quizId');
  }

  // Ensure valid quiz name
  if (!checkQuizName(name)) {
    throw HTTPError(400, 'quizName out of accepted length or containing unallowed characters');
  }

  // Ensure quiz name is not already used by the user for another quiz
  if (!quizNameNotUsed(tokenObject.userId, name)) {
    throw HTTPError(400, 'quizName is already used by the user for another quiz');
  }

  // Checking user owns quiz
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    throw HTTPError(400, 'Quiz does not belong to current user');
  }

  const indexOfQuizInQuizzes = data.quizzes.findIndex((quiz:QuizObject) => quiz.quizId === quizId);
  data.quizzes[indexOfQuizInQuizzes].name = name;
  data.quizzes[indexOfQuizInQuizzes].timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);
  return { };
}

/**
 *
 * @param {number} quizId
 * @param {string} token
 * @param {string} description
 * @returns { }
 */
// Update the description of the relevant quiz.

function v2adminQuizDescriptionUpdate(quizId: number, token: string | string[], description: string): EmptyObject | ErrorString {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error === 'Token is not in a valid structure') {
    throw HTTPError(401, tokenError.error);
  }
  if (tokenError.error === 'User is not currently logged in') {
    throw HTTPError(403, tokenError.error);
  }
  const data = getData();
  const tokenObject = getData().tokens.find((currentToken:TokenObject) => currentToken.token === token);

  // Checks if quizid exists
  const quiz = getData().quizzes.find((quiz:QuizObject) => quiz.quizId === quizId);
  if (quiz === undefined) {
    throw HTTPError(400, 'Please enter a valid quizId');
  }
  // Checks if user owns the quiz
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    throw HTTPError(400, 'quizId does not refer to a quiz that this user owns');
  }
  // Checks if description length is greater than 100
  if (description.length > 100) {
    throw HTTPError(400, 'description is over 100 characters long');
  }
  const indexOfQuizInQuizzes = data.quizzes.findIndex((quiz:QuizObject) => quiz.quizId === quizId);
  data.quizzes[indexOfQuizInQuizzes].description = description;
  setData(data);
  return {};
}

/**
 *
 * @param {number} quizId
 * @param {string} token
 * @param {string} description
 * @returns { }
 */
// Update the description of the relevant quiz.
function adminQuizDescriptionUpdate(quizId: number, token: string, description: string): EmptyObject | ErrorString {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const tokenObject = getData().tokens.find((currentToken:TokenObject) => currentToken.token === token);

  // Checks if quizid exists
  const quiz = getData().quizzes.find((quiz:QuizObject) => quiz.quizId === quizId);
  if (quiz === undefined) {
    return {
      error: 'Please enter a valid quizId'
    };
  }
  // Checks if user owns the quiz
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    return { error: 'quizId does not refer to a quiz that this user owns' };
  }

  // Checks if description length is greater than 100
  if (description.length > 100) {
    return { error: 'description is over 100 characters long' };
  }

  const indexOfQuizInQuizzes = data.quizzes.findIndex((quiz:QuizObject) => quiz.quizId === quizId);
  data.quizzes[indexOfQuizInQuizzes].description = description;

  setData(data);
  return {};
}
// ----------------------- ITERATION 2 FUNCTIONS ------------------------

/**
 *
 * @param {string} token //Used for authentication
 * @param {string} quizId //Transfer from this person
 * @param {string} userEmail //To this person
 * @returns {void} statusCode
 */
// Transfer quiz ownership from quizId to user based on userEmail
function adminQuizTransfer(token: string, quizId: number, userEmail:string):ErrorString|EmptyObject {
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const authUserId = data.tokens.find((user:TokenObject) => user.token === token).userId;

  // Check if quizId is a valid quiz.
  const quiz = getValidQuiz(quizId);
  if (quiz === undefined) {
    return { error: 'quizId does not refer to a valid quiz.' };
  }

  // Check if the user  owns this quiz.
  if (userOwnsQuiz(quiz, authUserId) === false) {
    return { error: 'quizId does not refer to a quiz this user owns.' };
  }

  // Check if userEmail is a real user.
  const newQuizOwner = getUserWithEmail(userEmail);
  if (newQuizOwner === undefined) {
    return { error: 'userEmail is not a real user.' };
  }

  // Check if userEmail is the current logged in user (user transferring quiz to themselves.)
  const oldQuizOwner = getUser(authUserId);
  if (oldQuizOwner.email === userEmail) {
    return { error: 'Cannot transfer quiz to yourself.' };
  }

  // Check if the target user has a quiz of the same name as the one being transferred
  const newUserQuizzes = getUsersQuizzesByUserId(newQuizOwner.authUserId);
  for (const newUserQuiz of newUserQuizzes) {
    if (newUserQuiz.name === quiz.name) {
      return { error: 'Quiz recipient has existing quiz with same name as one being transferred.' };
    }
  }

  // If code execution gets here, no errors. We transfer
  const indexOfFirstUser = data.users.findIndex((user:NewUser) => user.authUserId === authUserId);
  const indexOfSecondUser = data.users.findIndex((user:NewUser) => user.email === userEmail);
  const indexOfQuiz = data.quizzes.findIndex((quiz: QuizObject) => quiz.quizId === quizId);

  // Delete the quizIndex from the user's quizzesCreated[]
  const newQuizzesCreated = [];
  for (const id of data.users[indexOfFirstUser].quizzesCreated) {
    if (id !== quizId) {
      newQuizzesCreated.push(id);
    }
  }
  data.users[indexOfFirstUser].quizzesCreated = newQuizzesCreated;

  // Add this quizIndex to receiver user's quizzesCreated[]
  data.users[indexOfSecondUser].quizzesCreated.push(data.quizzes[indexOfQuiz].quizId);

  // Update the quizz's creatorid
  data.quizzes[indexOfQuiz].creatorId = data.users[indexOfSecondUser].authUserId;
  setData(data);

  return {};
}

/**
 *
 * @param {string} token //Used for authentication
 * @param {string} quizId //Transfer from this person
 * @param {string} userEmail //To this person
 * @returns {void} statusCode
 */
// Transfer quiz ownership from quizId to user based on userEmail
function v2adminQuizTransfer(token: string | string[], quizId: number, userEmail:string):ErrorString|EmptyObject {
  throwTokenError(token);
  const quiz = throwQuizError(token, quizId);

  const data = getData();
  const authUserId = data.tokens.find((user:TokenObject) => user.token === token).userId;

  // Check if userEmail is a real user.
  const newQuizOwner = getUserWithEmail(userEmail);
  if (newQuizOwner === undefined) {
    throw HTTPError(400, 'userEmail is not a real user.');
  }

  // Check if userEmail is the current logged in user (user transferring quiz to themselves.)
  const oldQuizOwner = getUser(authUserId);
  if (oldQuizOwner.email === userEmail) {
    throw HTTPError(400, 'Cannot transfer quiz to yourself.');
  }

  // Check if the target user has a quiz of the same name as the one being transferred
  const newUserQuizzes = getUsersQuizzesByUserId(newQuizOwner.authUserId);
  for (const newUserQuiz of newUserQuizzes) {
    if (newUserQuiz.name === quiz.name) {
      throw HTTPError(400, 'Quiz recipient has existing quiz with same name as one being transferred.');
    }
  }

  // check sessions in end state
  for (const session of data.sessions) {
    if (session.quiz.quizId === quizId && session.state != 'END') {
      throw HTTPError(400, 'Quiz being transferred must be in END state.');
    }
  }

  // If code execution gets here, no errors. We transfer
  const indexOfFirstUser = data.users.findIndex((user:NewUser) => user.authUserId === authUserId);
  const indexOfSecondUser = data.users.findIndex((user:NewUser) => user.email === userEmail);
  const indexOfQuiz = data.quizzes.findIndex((quiz: QuizObject) => quiz.quizId === quizId);

  // Delete the quizIndex from the user's quizzesCreated[]
  const newQuizzesCreated = [];
  for (const id of data.users[indexOfFirstUser].quizzesCreated) {
    if (id !== quizId) {
      newQuizzesCreated.push(id);
    }
  }
  data.users[indexOfFirstUser].quizzesCreated = newQuizzesCreated;

  // Add this quizIndex to receiver user's quizzesCreated[]
  data.users[indexOfSecondUser].quizzesCreated.push(data.quizzes[indexOfQuiz].quizId);

  // Update the quizz's creatorid
  data.quizzes[indexOfQuiz].creatorId = data.users[indexOfSecondUser].authUserId;

  // update the info in sessions[] array

  setData(data);

  return {};
}

/**
 *
 * @param {number} token //Used for authentication
 * @param {string} quizId //Transfer from this person
 * @param {QuestionCreateBody} questionBody //The actual question
 *
 * "questionBody": {
    "question": "Who is the Monarch of England?",
    "duration": 4,
    "points": 5,
    "answers": [
      {
        "answer": "Prince Charles",
        "correct": true
      }
    ]
  }
 *
 * @returns {questionId: number}
 */
// Creates a quiz question.
function adminQuizQuestionCreate(quizId: number, token: string, questionBody: QuestionCreateBody): ReturnQuizQuestionCreate | ErrorString {
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const user = data.tokens.find((user:TokenObject) => user.token === token);
  const authUserId = user.userId;

  // Check if quizId is a valid quiz.
  const quiz = getValidQuiz(quizId);
  if (quiz === undefined) {
    return { error: 'quizId does not refer to a valid quiz.' };
  }

  // Check if the user (token) owns this quiz.
  if (userOwnsQuiz(quiz, authUserId) === false) {
    return { error: 'quizId does not refer to a quiz this user owns.' };
  }

  // Check if question string is <5char or >50char
  if (String(questionBody.question).length > 50 || String(questionBody.question).length < 5) {
    return { error: 'Question length must be between 5 and 50 characters inclusive.' };
  }

  // For some reason. questionBody.answers.length wont work??? Typeerror undefined 'length'
  const questionAnswers = questionBody.answers;
  const numAnswers = questionAnswers.length;

  // Check if 2<=numQuestions<=6. If not, error.
  if (numAnswers > 6 || numAnswers < 2) {
    return { error: 'Question must have between 2 and 6 answers inclusive.' };
  }

  // Check if question duration is positive (must be >0 otherwise error)
  if (questionBody.duration <= 0) {
    return { error: 'Question duration must be positive.' };
  }

  // Check total duration of questions in quiz <=180
  let durationSum = questionBody.duration;
  const existingQuestions = data.quizzes.find((quiz:QuizObject) => quiz.quizId === quizId).questions;
  for (const question of existingQuestions) {
    durationSum = durationSum + question.duration;
  }

  if (durationSum > 180) {
    return { error: 'Question duration sum exceeds 3 minutes.' };
  }

  // Check question points 1<=pts<=10
  if (questionBody.points > 10 || questionBody.points < 1) {
    return { error: 'Question points must be between 1 and 10 inclusive.' };
  }

  // Check length of answer strings 1<=len<=30
  for (const answer of questionAnswers) {
    const answerString = String(answer.answer);
    if (answerString.length < 1 || answerString.length > 30) {
      return { error: 'Question answer strings must be between 1 and 30 characters inclusive.' };
    }
  }

  // Check for no duplicate answer strings.
  for (let i = 0; i < numAnswers - 1; i = i + 1) {
    for (let j = i + 1; j < numAnswers; j = j + 1) {
      if (questionBody.answers[i].answer === questionBody.answers[j].answer) {
        return { error: 'Answer strings within the same question must not be duplicates.' };
      }
    }
  }

  if (correctAnswerExists(questionBody) === false) {
    return { error: 'There must be at least 1 correct answer.' };
  }

  // Unique quizId created by adding current time (in ms after 1/1/1970) with
  // a random number between 0 and 999. This is (almost) guaranteed to be unique
  // unless more than one quiz is created within a millisecond AND the created
  // quizzes happen to have the same randomly generated number between 0 and 999.
  const newQuestionId = Date.now() + Math.floor(Math.random() * 1000000000);

  const newQuestion: SingleQuestionType = {
    questionId: newQuestionId,
    question: questionBody.question,
    duration: questionBody.duration,
    points: questionBody.points,
    answers: []
  };

  for (const ans of questionBody.answers) {
    newQuestion.answers.push({
      answerId: Date.now() + Math.floor(Math.random() * 1000000000),
      answer: ans.answer,
      colour: randomColour().colour,
      correct: ans.correct
    });
  }
  const indexOfQuiz = (data.quizzes).findIndex((quiz: QuizObject) => quiz.quizId === quizId);
  (data.quizzes[indexOfQuiz].questions).push(newQuestion);
  data.quizzes[indexOfQuiz].timeLastEdited = getUNIXTime();
  data.quizzes[indexOfQuiz].duration = durationSum;
  data.quizzes[indexOfQuiz].numQuestions = data.quizzes[indexOfQuiz].numQuestions + 1;

  setData(data);

  return { questionId: newQuestionId };
}

function v2adminQuizQuestionCreate(quizId: number, token: string | string[], questionBody: any): ReturnQuizQuestionCreate | ErrorString {
  throwTokenError(token);
  const quiz = throwQuizError(token, quizId);

  const data = getData();
  const user = data.tokens.find((user:TokenObject) => user.token === token);
  const authUserId = user.userId;

  // Check if question string is <5char or >50char
  if (String(questionBody.question).length > 50 || String(questionBody.question).length < 5) {
    throw HTTPError(400, 'Question length must be between 5 and 50 characters inclusive.');
  }

  // For some reason. questionBody.answers.length wont work??? Typeerror undefined 'length'
  const questionAnswers = questionBody.answers;
  const numAnswers = questionAnswers.length;

  // Check if 2<=numQuestions<=6. If not, error.
  if (numAnswers > 6 || numAnswers < 2) {
    throw HTTPError(400, 'Question must have between 2 and 6 answers inclusive.');
  }

  // Check if question duration is positive (must be >0 otherwise error)
  if (questionBody.duration <= 0) {
    throw HTTPError(400, 'Question duration must be positive.');
  }

  // Check total duration of questions in quiz <=180
  let durationSum = questionBody.duration;
  const existingQuestions = data.quizzes.find((quiz:QuizObject) => quiz.quizId === quizId).questions;
  for (const question of existingQuestions) {
    durationSum = durationSum + question.duration;
  }

  if (durationSum > 180) {
    throw HTTPError(400, 'Question duration sum exceeds 3 minutes.');
  }

  // Check question points 1<=pts<=10
  if (questionBody.points > 10 || questionBody.points < 1) {
    throw HTTPError(400, 'Question points must be between 1 and 10 inclusive.');
  }

  // Check length of answer strings 1<=len<=30
  for (const answer of questionAnswers) {
    const answerString = String(answer.answer);
    if (answerString.length < 1 || answerString.length > 30) {
      throw HTTPError(400, 'Question answer strings must be between 1 and 30 characters inclusive.');
    }
  }

  // Check for no duplicate answer strings.
  for (let i = 0; i < numAnswers - 1; i = i + 1) {
    for (let j = i + 1; j < numAnswers; j = j + 1) {
      if (questionBody.answers[i].answer === questionBody.answers[j].answer) {
        throw HTTPError(400, 'Answer strings within the same question must not be duplicates.');
      }
    }
  }

  if (correctAnswerExists(questionBody) === false) {
    throw HTTPError(400, 'There must be at least 1 correct answer.');
  }

  // check the thumbnail
  const imgUrl = questionBody.thumbnailUrl;
  setData(data);
  const thumbnailFilePath = fetchDownloadImage(imgUrl); // if error, this func will throw.
  data = getData();
  // Unique quizId created by adding current time (in ms after 1/1/1970) with
  // a random number between 0 and 999. This is (almost) guaranteed to be unique
  // unless more than one quiz is created within a millisecond AND the created
  // quizzes happen to have the same randomly generated number between 0 and 999.
  const newQuestionId = Date.now() + Math.floor(Math.random() * 1000000000);

  const newQuestion: any = {
    questionId: newQuestionId,
    question: questionBody.question,
    duration: questionBody.duration,
    points: questionBody.points,
    answers: [],
    thumbnailUrl: imgUrl
  };

  for (const ans of questionBody.answers) {
    newQuestion.answers.push({
      answerId: Date.now() + Math.floor(Math.random() * 1000000000),
      answer: ans.answer,
      colour: randomColour().colour,
      correct: ans.correct
    });
  }
  const indexOfQuiz = (data.quizzes).findIndex((quiz: QuizObject) => quiz.quizId === quizId);
  (data.quizzes[indexOfQuiz].questions).push(newQuestion);
  data.quizzes[indexOfQuiz].timeLastEdited = getUNIXTime();
  data.quizzes[indexOfQuiz].duration = durationSum;
  data.quizzes[indexOfQuiz].numQuestions = data.quizzes[indexOfQuiz].numQuestions + 1;

  setData(data);

  return { questionId: newQuestionId };
}
/**
 *
 * @param {number} quizId //Used to find which quiz the question to update is in
 * @param {number} questionId //which question we are updating
 * @param {string} token //authentication
 * @param {QuestionCreateBody} questionBody //body of the question
 * @returns {ErrorString|EmptyObject}} string: error on error. otherwise, void
 */
// Update a quiz question

function v2adminQuizQuestionUpdate(quizId: number, questionId: number, token: string | string[], questionBody: QuestionCreateBody): ErrorString|EmptyObject {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error === 'Token is not in a valid structure') {
    throw HTTPError(401, tokenError.error);
  }
  if (tokenError.error === 'User is not currently logged in') {
    throw HTTPError(403, tokenError.error);
  }
  const data = getData();
  const tokenObject = getData().tokens.find((currentToken:TokenObject) => currentToken.token === token);
  const quiz = getData().quizzes.find((quiz:QuizObject) => quiz.quizId === quizId);
  // Quiz ID does not refer to a valid quiz
  if (quiz === undefined) {
    throw HTTPError(400, 'Please enter a valid quizId'
    );
  }
  // Quiz ID does not refer to a quiz that this user owns
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    throw HTTPError(400, 'quizId does not refer to a quiz that this user owns');
  }
  // Question Id does not refer to a valid question within this quiz
  const questionToUpdate = (quiz.questions).find((question:SingleQuestionType) => question.questionId === questionId);
  if (questionToUpdate === undefined) {
    throw HTTPError(400,
      'Question Id does not refer to a valid question within this quiz');
  }
  // Question string is less than 5 characters in length or greater than 50 characters in length
  if (questionBody.question.length < 5) {
    throw HTTPError(400,
      'Question string is less than 5 characters in length');
  } else if (questionBody.question.length > 50) {
    throw HTTPError(400,
      'Question string is greater than 50 characters in length');
  }
  // The question has more than 6 answers or less than 2 answers
  if (questionBody.answers.length < 2) {
    throw HTTPError(400, 'Question has less than 2 answers');
  } else if (questionBody.answers.length > 6) {
    throw HTTPError(400, 'Question has more than 6 answers');
  }
  // The question duration is not a positive number
  if (questionBody.duration < 0) {
    throw HTTPError(400, 'Question duration is not a positive number');
  }
  // If this question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes
  if (quiz.duration + questionBody.duration > 180) {
    throw HTTPError(400, 'Sum of question duration exceeds 3 minutes');
  }
  // The points awarded for the question are less than 1 or greater than 10
  if (questionBody.points > 10) {
    throw HTTPError(400, 'Points awarded for question is greater than 10');
  } else if (questionBody.points < 1) {
    throw HTTPError(400, 'Points awarded for question is less than 1');
  }
  // The length of any answer is shorter than 1 character long, or longer than 30 characters long
  for (const currentAnswer of questionBody.answers) {
    if (currentAnswer.answer.length < 1) {
      throw HTTPError(400, 'Question string is greater than 50 characters in length');
    } else if (currentAnswer.answer.length > 30) {
      throw HTTPError(400, 'Answer is longer than 30 characters');
    }
  }
  // Any answer strings are duplicates of one another (within the same question)
  for (let i = 0; i < (questionBody.answers).length - 1; i = i + 1) {
    for (let j = i + 1; j < (questionBody.answers).length; j = j + 1) {
      if (questionBody.answers[i].answer === questionBody.answers[j].answer) {
        throw HTTPError(400,
          'Answer strings within the same question must not be duplicates.');
      }
    }
  }
  // There are no correct answers
  if (!correctAnswerExists(questionBody)) {
    throw HTTPError(400, 'There are no correct answers');
  }
  //   The thumbnailUrl is an empty string
  if (questionBody.thumbnailUrl.length === 0) {
    throw HTTPError(400, 'The thumbnailUrl is an empty string');
  }
  // The thumbnailUrl, when fetched, is not a JPG or PNg file type
  // The thumbnailUrl does not return to a valid file
  setData(data);
  const filename = fetchDownloadImage(questionBody.thumbnailUrl);
  data = getData();
  questionToUpdate.question = questionBody.question;
  questionToUpdate.duration = questionBody.duration;
  questionToUpdate.points = questionBody.points;
  questionToUpdate.thumbnailUrl = questionBody.thumbnailUrl;
  if (questionToUpdate.answers.length !== 0) {
    questionToUpdate.answers.splice(0);
  } else {

  }
  for (const currentAnswer of questionBody.answers) {
    const newAnswer = {
      answer: currentAnswer.answer,
      correct: currentAnswer.correct,
      colour: randomColour().colour,
      answerId: Date.now() + Math.floor(Math.random() * 1000000000)
    };
    questionToUpdate.answers.push(newAnswer);
  }
  const indexOfQuestionToUpdateInQuiz = (quiz.questions).findIndex((question:SingleQuestionType) => question.questionId === questionId);
  quiz.questions[indexOfQuestionToUpdateInQuiz] = questionToUpdate;
  quiz.timeLastEdited = getUNIXTime();
  quiz.duration = quiz.duration + questionBody.duration;
  const indexOfQuizInQuizzes = data.quizzes.findIndex((quiz:QuizObject) => quiz.quizId === quizId);
  data.quizzes[indexOfQuizInQuizzes] = quiz;
  setData(data);
  return {};
}

/**
 *
 * @param {number} quizId //Used to find which quiz the question to update is in
 * @param {number} questionId //which question we are updating
 * @param {string} token //authentication
 * @param {QuestionCreateBody} questionBody //body of the question
 * @returns {ErrorString|EmptyObject}} string: error on error. otherwise, void
 */
// Update a quiz question
function adminQuizQuestionUpdate(quizId: number, questionId: number, token: string, questionBody: QuestionCreateBody): ErrorString|EmptyObject {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const tokenObject = getData().tokens.find((currentToken:TokenObject) => currentToken.token === token);
  const quiz = getData().quizzes.find((quiz:QuizObject) => quiz.quizId === quizId);
  // Quiz ID does not refer to a valid quiz
  if (quiz === undefined) {
    return {
      error: 'Please enter a valid quizId'
    };
  }

  // Quiz ID does not refer to a quiz that this user owns
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    return { error: 'quizId does not refer to a quiz that this user owns' };
  }

  // Question Id does not refer to a valid question within this quiz
  const questionToUpdate = (quiz.questions).find((question:SingleQuestionType) => question.questionId === questionId);
  if (questionToUpdate === undefined) {
    return {
      error: 'Question Id does not refer to a valid question within this quiz'
    };
  }

  // Question string is less than 5 characters in length or greater than 50 characters in length
  if (questionBody.question.length < 5) {
    return {
      error: 'Question string is less than 5 characters in length'
    };
  } else if (questionBody.question.length > 50) {
    return {
      error: 'Question string is greater than 50 characters in length'
    };
  }
  // The question has more than 6 answers or less than 2 answers
  if (questionBody.answers.length < 2) {
    return {
      error: 'Question has less than 2 answers'
    };
  } else if (questionBody.answers.length > 6) {
    return {
      error: 'Question has more than 6 answers'
    };
  }
  // The question duration is not a positive number
  if (questionBody.duration < 0) {
    return {
      error: 'Question duration is not a positive number'
    };
  }
  // If this question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes
  if (quiz.duration + questionBody.duration > 180) {
    return {
      error: 'Sum of question duration exceeds 3 minutes'
    };
  }
  // The points awarded for the question are less than 1 or greater than 10
  if (questionBody.points > 10) {
    return {
      error: 'Points awarded for question is greater than 10'
    };
  } else if (questionBody.points < 1) {
    return {
      error: 'Points awarded for question is less than 1'
    };
  }

  // The length of any answer is shorter than 1 character long, or longer than 30 characters long
  for (const currentAnswer of questionBody.answers) {
    if (currentAnswer.answer.length < 1) {
      return { error: 'Answer is shorter than 1 character' };
    } else if (currentAnswer.answer.length > 30) {
      return { error: 'Answer is longer than 30 characters' };
    }
  }

  // Any answer strings are duplicates of one another (within the same question)
  for (let i = 0; i < (questionBody.answers).length - 1; i = i + 1) {
    for (let j = i + 1; j < (questionBody.answers).length; j = j + 1) {
      if (questionBody.answers[i].answer === questionBody.answers[j].answer) {
        return { error: 'Answer strings within the same question must not be duplicates.' };
      }
    }
  }

  // There are no correct answers
  if (!correctAnswerExists(questionBody)) {
    return { error: 'There are no correct answers' };
  } else {

  }

  questionToUpdate.question = questionBody.question;
  questionToUpdate.duration = questionBody.duration;
  questionToUpdate.points = questionBody.points;
  if (questionToUpdate.answers.length !== 0) {
    questionToUpdate.answers.splice(0);
  }

  for (const currentAnswer of questionBody.answers) {
    const newAnswer = {
      answer: currentAnswer.answer,
      correct: currentAnswer.correct,
      colour: randomColour().colour,
      answerId: Date.now() + Math.floor(Math.random() * 1000000000)
    };
    questionToUpdate.answers.push(newAnswer);
  }

  const indexOfQuestionToUpdateInQuiz = (quiz.questions).findIndex((question:SingleQuestionType) => question.questionId === questionId);
  quiz.questions[indexOfQuestionToUpdateInQuiz] = questionToUpdate;
  quiz.timeLastEdited = getUNIXTime();
  quiz.duration = quiz.duration + questionBody.duration;

  const indexOfQuizInQuizzes = data.quizzes.findIndex((quiz:QuizObject) => quiz.quizId === quizId);
  data.quizzes[indexOfQuizInQuizzes] = quiz;
  setData(data);
  return {};
}

/**
 *
 * @param {number} quizId //Used to find which quiz the question to update is in
 * @param {number} questionId //which question we are updating
 * @param {string} token //authentication
 * @returns {ErrorString|EmptyObject}} string: error on error. otherwise, void
 */
// Delete a quiz question
function v2adminQuizQuestionDelete(quizId: number, questionId: number, token: string | string[]): ErrorString|EmptyObject {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error === 'Token is not in a valid structure') {
    throw HTTPError(401, tokenError.error);
  }
  if (tokenError.error === 'User is not currently logged in') {
    throw HTTPError(403, tokenError.error);
  }
  const data = getData();
  const tokenObject = data.tokens.find((currentToken:TokenObject) => currentToken.token === token);
  // Quiz ID does not refer to a valid quiz
  const quiz = data.quizzes.find((quiz:QuizObject) => quiz.quizId === quizId);
  if (quiz === undefined) {
    throw HTTPError(400, 'Please enter a valid quizId');
  }
  // Quiz ID does not refer to a quiz that this user owns
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    throw HTTPError(400,
      'quizId does not refer to a quiz that this user owns');
  }
  // Question Id does not refer to a valid question within this quiz
  const quizQuestionToDelete = (quiz.questions).find((question:SingleQuestionType) =>
    question.questionId === questionId);
  const indexOfQuizQuestionToDelete = quiz.questions.findIndex((question: SingleQuestionType) =>
    question.questionId === questionId);
  const quizQuestions = quiz.questions;
  if (!quizQuestionToDelete) {
    throw HTTPError(400,
      'Question Id does not refer to a valid question within this quiz');
  }
  // All sessions for this quiz must be in END state
  if (getNumActiveSessions(token) > 0) {
    throw HTTPError(400, 'All sessions for this quiz must be in END state');
  }
  quiz.numQuestions--;
  quiz.duration = quiz.duration - quizQuestionToDelete.duration;
  for (let i = indexOfQuizQuestionToDelete; i < quizQuestions.length - 1; i++) {
    quizQuestions[i] = quizQuestions[i + 1];
  }
  quizQuestions.pop();
  quiz.questions = quizQuestions;
  const indexOfQuizInQuizzes = data.quizzes.findIndex((quiz:QuizObject) => quiz.quizId === quizId);
  data.quizzes[indexOfQuizInQuizzes] = quiz;
  setData(data);
  return {};
}

/**
 *
 * @param {number} quizId //Used to find which quiz the question to update is in
 * @param {number} questionId //which question we are updating
 * @param {string} token //authentication
 * @returns {ErrorString|EmptyObject}} string: error on error. otherwise, void
 */
// Delete a quiz question
function adminQuizQuestionDelete(quizId: number, questionId: number, token: string): ErrorString|EmptyObject {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const tokenObject = data.tokens.find((currentToken:TokenObject) => currentToken.token === token);

  // Quiz ID does not refer to a valid quiz
  const quiz = data.quizzes.find((quiz:QuizObject) => quiz.quizId === quizId);
  if (quiz === undefined) {
    return {
      error: 'Please enter a valid quizId'
    };
  }

  // Quiz ID does not refer to a quiz that this user owns
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    return { error: 'quizId does not refer to a quiz that this user owns' };
  }

  // Question Id does not refer to a valid question within this quiz
  const quizQuestionToDelete = (quiz.questions).find((question:SingleQuestionType) =>
    question.questionId === questionId);
  const indexOfQuizQuestionToDelete = quiz.questions.findIndex((question: SingleQuestionType) =>
    question.questionId === questionId);
  const quizQuestions = quiz.questions;

  if (!quizQuestionToDelete) {
    return {
      error: 'Question Id does not refer to a valid question within this quiz'
    };
  }

  quiz.numQuestions--;
  quiz.duration = quiz.duration - quizQuestionToDelete.duration;
  console.log(`ioqqtd = ${indexOfQuizQuestionToDelete}, qqlen = ${quizQuestions.length}`);
  for (let i = indexOfQuizQuestionToDelete; i < quizQuestions.length - 1; i++) {
    console.log('sup');
    quizQuestions[i] = quizQuestions[i + 1];
  }
  quizQuestions.pop();

  quiz.questions = quizQuestions;
  const indexOfQuizInQuizzes = data.quizzes.findIndex((quiz:QuizObject) => quiz.quizId === quizId);
  data.quizzes[indexOfQuizInQuizzes] = quiz;

  setData(data);
  return {};
}

/**
 *
 * @param {number} quizId //Used to find which quiz the question to update is in
 * @param {number} questionId //which question we are updating
 * @param {string} token //authentication
 * @param {number} newPosition //new position (index in questions array)
 * @returns {ErrorString|EmptyObject}} string: error on error. otherwise, void
 */
// Move a quiz question from its original position to a new position in its quiz by index (shifting)
function adminQuizQuestionMove(quizId: number, questionId: number, token: string, newPosition: number): ErrorString|EmptyObject {
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const user = data.tokens.find((user:TokenObject) => user.token === token);
  const authUserId = user.userId;

  // Quiz ID does not refer to a valid quiz
  const quiz = getValidQuiz(quizId);
  if (quiz === undefined) {
    return { error: 'quizId does not refer to a valid quiz.' };
  }

  // Quiz ID does not refer to a quiz that this user owns
  if (userOwnsQuiz(quiz, authUserId) === false) {
    return { error: 'quizId does not refer to a quiz this user owns.' };
  }

  // Question Id does not refer to a valid question within this quiz
  if (quiz.questions.find((question:SingleQuestionType) => question.questionId === questionId) === undefined) {
    return { error: 'questionId does not to refer to a valid question within this quiz.' };
  }

  // NewPosition is less than 0, or NewPosition is greater than n-1 where n is the number of questions
  const numQuestions = quiz.questions.length;
  if (newPosition < 0 || newPosition > numQuestions - 1) {
    return { error: 'Numquestions must be between 0, n-1 (n=numquestions)' };
  }

  // NewPosition is the position of the current question
  const quizQuestions = quiz.questions;
  const oldPosition = (quizQuestions).findIndex((question: SingleQuestionType) => question.questionId === questionId);
  if (newPosition === oldPosition) {
    return { error: 'New position must not be same as old position' };
  }

  // if execution gets here then theres no errors
  // now, do what wee supposed to do

  // a b c d e f
  // if move c -> index4
  // a b d e c f

  const temp = quizQuestions[oldPosition];
  if (newPosition > oldPosition) {
    // shift everything to the left
    for (let i = oldPosition; i < newPosition; i++) {
      quizQuestions[i] = quizQuestions[i + 1];
    }
    quizQuestions[newPosition] = temp;
  } else {
    // if newPosition < oldPosition
    // shift everything to the right
    for (let i = oldPosition; i > newPosition; i--) {
      quizQuestions[i] = quizQuestions[i - 1];
    }
    quizQuestions[newPosition] = temp;
  }

  quiz.questions = quizQuestions;
  quiz.timeLastEdited = getUNIXTime();
  data.quizzes[data.quizzes.findIndex((quiz: QuizObject) => quiz.quizId === quizId)] = quiz;
  setData(data);
  return {};
}

/**
 *
 * @param {number} quizId //Used to find which quiz the question to update is in
 * @param {number} questionId //which question we are updating
 * @param {string} token //authentication
 * @param {number} newPosition //new position (index in questions array)
 * @returns {ErrorString|EmptyObject}} string: error on error. otherwise, void
 */
// Move a quiz question from its original position to a new position in its quiz by index (shifting)
function v2adminQuizQuestionMove(quizId: number, questionId: number, token: string | string[], newPosition: number): ErrorString|EmptyObject {
  throwTokenError(token);
  const quiz = throwQuizError(token, quizId);

  const data = getData();
  const user = data.tokens.find((user:TokenObject) => user.token === token);
  const authUserId = user.userId;

  // Question Id does not refer to a valid question within this quiz
  if (quiz.questions.find((question:SingleQuestionType) => question.questionId === questionId) === undefined) {
    throw HTTPError(400, 'questionId does not to refer to a valid question within this quiz.');
  }

  // NewPosition is less than 0, or NewPosition is greater than n-1 where n is the number of questions
  const numQuestions = quiz.questions.length;
  if (newPosition < 0 || newPosition > numQuestions - 1) {
    throw HTTPError(400, 'Numquestions must be between 0, n-1 (n=numquestions)');
  }

  // NewPosition is the position of the current question
  const quizQuestions = quiz.questions;
  const oldPosition = (quizQuestions).findIndex((question: SingleQuestionType) => question.questionId === questionId);
  if (newPosition === oldPosition) {
    throw HTTPError(400, 'New position must not be same as old position');
  }

  // if execution gets here then theres no errors
  // now, do what wee supposed to do

  // a b c d e f
  // if move c -> index4
  // a b d e c f

  const temp = quizQuestions[oldPosition];
  if (newPosition > oldPosition) {
    // shift everything to the left
    for (let i = oldPosition; i < newPosition; i++) {
      quizQuestions[i] = quizQuestions[i + 1];
    }
    quizQuestions[newPosition] = temp;
  } else {
    // if newPosition < oldPosition
    // shift everything to the right
    for (let i = oldPosition; i > newPosition; i--) {
      quizQuestions[i] = quizQuestions[i - 1];
    }
    quizQuestions[newPosition] = temp;
  }

  quiz.questions = quizQuestions;
  quiz.timeLastEdited = getUNIXTime();
  data.quizzes[data.quizzes.findIndex((quiz: QuizObject) => quiz.quizId === quizId)] = quiz;
  setData(data);
  return {};
}

/**
 *
 * @param {number} quizId //Used to find which quiz the question to update is in
 * @param {number} questionId //which question we are updating
 * @param {string} token //authentication
 * @returns {ErrorString|EmptyObject}} string: error on error. otherwise, void
 */
// Duplicate a quiz question in a quiz, and position it right after the original.
function adminQuizQuestionDuplicate(quizId: number, questionId: number, token: string): ErrorString|DuplicateQuizQuestionCreate {
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const user = data.tokens.find((user:TokenObject) => user.token === token);
  const authUserId = user.userId;

  // Quiz ID does not refer to a valid quiz
  const quiz = getValidQuiz(quizId);
  if (quiz === undefined) {
    return { error: 'quizId does not refer to a valid quiz.' };
  }

  // Quiz ID does not refer to a quiz that this user owns
  if (userOwnsQuiz(quiz, authUserId) === false) {
    return { error: 'quizId does not refer to a quiz this user owns.' };
  }

  // Question Id does not refer to a valid question within this quiz
  if (quiz.questions.find((question:SingleQuestionType) => question.questionId === questionId) === undefined) {
    return { error: 'questionId does not to refer to a valid question within this quiz.' };
  }

  // errorchecking done
  const oldPosition = (quiz.questions).findIndex((question: SingleQuestionType) => question.questionId === questionId);
  const quizQuestions = quiz.questions;

  let durationSum = 0;
  for (const question of quizQuestions) {
    durationSum = durationSum + question.duration;
  }
  durationSum = durationSum + quizQuestions[oldPosition].duration;

  if (durationSum > 180) {
    return { error: 'Question duration sum exceeds 3 minutes.' };
  }

  // tophalf = the quiz questions after the one we r duplicating
  const topHalf = quizQuestions.splice(oldPosition + 1);
  quizQuestions.push(quizQuestions[quizQuestions.length - 1]);
  for (const ele of topHalf) {
    quizQuestions.push(ele);
  }

  // changing quiz fields
  quiz.numQuestions = quiz.numQuestions + 1;
  quiz.duration = durationSum;
  quiz.timelastedited = getUNIXTime();

  data.quizzes[(data.quizzes).findIndex((ele: QuizObject) => ele.quizId === quizId)] = quiz;
  setData(data);

  return { newQuestionId: questionId };
}

/**
 *
 * @param {number} quizId //Used to find which quiz the question to update is in
 * @param {number} questionId //which question we are updating
 * @param {string} token //authentication
 * @returns {ErrorString|EmptyObject}} string: error on error. otherwise, void
 */
// Duplicate a quiz question in a quiz, and position it right after the original.
function v2adminQuizQuestionDuplicate(quizId: number, questionId: number, token: string | string[]): ErrorString|DuplicateQuizQuestionCreate {
  throwTokenError(token);
  const quiz = throwQuizError(token, quizId);
  const data = getData();
  const user = data.tokens.find((user:TokenObject) => user.token === token);
  const authUserId = user.userId;

  // Quiz ID does not refer to a valid quiz

  // Question Id does not refer to a valid question within this quiz
  if (quiz.questions.find((question:SingleQuestionType) => question.questionId === questionId) === undefined) {
    throw HTTPError(400, 'questionId does not to refer to a valid question within this quiz.');
  }

  // errorchecking done
  const oldPosition = (quiz.questions).findIndex((question: SingleQuestionType) => question.questionId === questionId);
  const quizQuestions = quiz.questions;

  let durationSum = 0;
  for (const question of quizQuestions) {
    durationSum = durationSum + question.duration;
  }
  durationSum = durationSum + quizQuestions[oldPosition].duration;

  if (durationSum > 180) {
    throw HTTPError(400, 'Question duration sum exceeds 3 minutes.');
  }

  // tophalf = the quiz questions after the one we r duplicating
  const topHalf = quizQuestions.splice(oldPosition + 1);
  quizQuestions.push(quizQuestions[quizQuestions.length - 1]);
  for (const ele of topHalf) {
    quizQuestions.push(ele);
  }

  // changing quiz fields
  quiz.numQuestions = quiz.numQuestions + 1;
  quiz.duration = durationSum;
  quiz.timelastedited = getUNIXTime();

  data.quizzes[(data.quizzes).findIndex((ele: QuizObject) => ele.quizId === quizId)] = quiz;
  setData(data);

  return { newQuestionId: questionId };
}

export function adminQuizFinalResults(quizId: number, sessionId: number, token: string | string[]): ErrorString|EmptyObject {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error === 'Token is not in a valid structure') {
    throw HTTPError(401, tokenError.error);
  }
  if (tokenError.error === 'User is not currently logged in') {
    throw HTTPError(403, tokenError.error);
  }
  const tokenObject = getData().tokens.find((currentToken:TokenObject) => currentToken.token === token);
  const quiz = getData().quizzes.find((quiz:QuizObject) => quiz.quizId === quizId);
  // Quiz ID does not refer to a valid quiz
  if (quiz === undefined) {
    throw HTTPError(400, 'Please enter a valid quizId'
    );
  }
  // Quiz ID does not refer to a quiz that this user owns
  if (!userOwnsQuiz(quiz, tokenObject.userId)) {
    throw HTTPError(400, 'quizId does not refer to a quiz that this user owns');
  }
  // Session Id does not refer to a valid quiz
  const currentSession =
  getData().sessions.find((session: NewUser) => session.sessionId === sessionId);
  if (currentSession === undefined) {
    throw HTTPError(400, 'Session Id does not refer to a valid quiz ');
  }
  // Session is not in FINAL_RESULTS state
  if (sessionGetState(sessionId) !== 'FINAL_RESULTS') {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }
  const correctAnswers = [];
  const usersRankedByScore = [];
  const questionResults = [];
  for (const player of currentSession.players) {
    usersRankedByScore.push({ name: player.name, score: 0 });
  }
  for (const question of quiz.questions) {
    const correctAnswerBody =
    {
      questionId: question.questionId,
      answerId: [],
      points: question.points
    };
    for (const answer of question.answers) {
      if (answer.correct === true) {
        correctAnswerBody.answerId.push(answer.answerId);
      }
    }
    correctAnswers.push(correctAnswerBody);
  }
  const questionsWithResponses = [];
  for (const question of currentSession.questionResponses) {
    questionsWithResponses.push(question.questionId);
  }
  for (const questionId of currentSession.questionsGoneThrough) {
    let totalTime = 0;
    const correctAnswer = correctAnswers.find((element) => element.questionId === questionId);
    const correctAnswerIdArray = correctAnswer.answerId;
    const numCorrectAnswers = correctAnswerIdArray.length;
    const questionCorrectBreakdown = [];
    const playersCorrect = [];
    if (questionsWithResponses.includes(questionId)) { // question is gone through
      const index = currentSession.questionResponses.findIndex((response) => response.questionId === questionId);
      const playerResponse =
      currentSession.questionResponses[index].playerResponses;
      for (const player of playerResponse) {
        const numPlayerAnswers = hasCommonElement(correctAnswerIdArray, player.answerIds);
        if (numPlayerAnswers === numCorrectAnswers) {
          totalTime = totalTime +
          (player.timeSubmitted - currentSession.startTime);
          const playerName =
          currentSession.players.find(
            (currentPlayer) => currentPlayer.playerId === player.playerId).name;
          playersCorrect.push(playerName);
          const user = usersRankedByScore.find((currentUser) => currentUser.name === playerName);
          for (let questionPosition = 1; questionPosition < quiz.questions.length + 1; questionPosition++) {
            user.score = user.score +
          getPlayerQuestionScore(player.answerIds, player.playerId,
            questionPosition, sessionId, quizId);
          }
        } else if (numPlayerAnswers === 0) {
          const playerName =
          currentSession.players.find(
            (currentPlayer) => currentPlayer.playerId === player.playerId).name;
          const user = usersRankedByScore.find((currentUser) => currentUser.name === playerName);
          user.score = 0;
        }
      }
    }
    for (const answerId of correctAnswerIdArray) {
      questionCorrectBreakdown.push({
        answerId: answerId,
        playersCorrect: playersCorrect
      });
    }
    const questionResultBody =
      {
        questionId: questionId,
        questionCorrectBreakdown: questionCorrectBreakdown,
        averageAnswerTime: 0,
        percentCorrect: 0
      };
    const index = currentSession.questionResponses.findIndex((response) => response.questionId === questionId);
    if (index !== -1) {
      questionResultBody.averageAnswerTime = Math.ceil((totalTime / currentSession.questionResponses[index].playerResponses.length) / 1000);
      questionResultBody.percentCorrect = (playersCorrect.length / currentSession.players.length) * 100;
    }
    questionResults.push(questionResultBody);
  }
  // Sort the array in descending order
  usersRankedByScore.sort((a, b) => b.score - a.score);
  return {
    usersRankedByScore: usersRankedByScore,
    questionResults: questionResults
  };
}

/*
Player,question1score,question1rank,question2score,question2rank
Giuliana,1,3,2,2
Hayden,1.5,2,1.3,3
Yuchao,3,1,4,1
X,Y,Z,...
X,Y,Z,...
X,Y,Z,...
*/
export function adminQuizFinalResultsCSV(token: string | string[], sessionId: number, quizId: number) {
  throwTokenError(token);
  const quiz = throwQuizError(token, quizId);

  const data = getData();
  const session = data.sessions.find(ele => ele.sessionId === sessionId);

  // Session Id does not refer to a valid question within this quiz ->
  // i assume this is a typo? i assume this is what it means?
  if (session === undefined) {
    throw HTTPError(400, 'session not found.');
  }

  if (sessionGetState(session.sessionId) !== 'FINAL_RESULTS') {
    throw HTTPError(400, 'session must be in FINAL_RESULTS state');
  }

  let csvSTRING = '';// csv is just a string lol

  let playersSorted = session.players;
  playersSorted = playersSorted.sort((a, b) => a.name.localeCompare(b.name));

  for (const playerObject of playersSorted) {
    csvSTRING = csvSTRING + playerObject.name + ',';
    for (let i = 0; i < session.quiz.questions.length; i++) {
      const score = getPlayerQuestionScoreByPlayerId(playerObject.playerId, i + 1, session);
      const rank = getPlayerQuestionRankByPlayerId(playerObject.playerId, i + 1, session);
      csvSTRING = csvSTRING + score + ',';
      csvSTRING = csvSTRING + rank + ',';
    }
    csvSTRING = csvSTRING.substring(0, csvSTRING.length - 1);
    csvSTRING = csvSTRING + '\n';
  }

  const fileName = session.sessionId + '.csv';
  const filePath = path.join(__dirname, '..', 'csv', fileName);
  fs.writeFileSync(filePath, csvSTRING);

  return {
    url: `${HOST}:${PORT}/csv/${fileName}`
  };
}
export {
  adminQuizList, v2adminQuizList, adminQuizCreate, v2adminQuizCreate, adminQuizRemove, v2adminQuizRemove, adminQuizInfo, v2adminQuizInfo, adminQuizNameUpdate, v2adminQuizNameUpdate, adminQuizDescriptionUpdate, v2adminQuizDescriptionUpdate, adminQuizTransfer, v2adminQuizTransfer, adminQuizQuestionCreate, v2adminQuizQuestionCreate, adminQuizQuestionUpdate, v2adminQuizQuestionUpdate, adminQuizQuestionDelete, v2adminQuizQuestionDelete, adminQuizQuestionMove, v2adminQuizQuestionMove, adminQuizQuestionDuplicate, v2adminQuizQuestionDuplicate
};
