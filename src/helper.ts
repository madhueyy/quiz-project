// @ts-nocheck
// @ts-ignore
import HTTPError from 'http-errors';
import { getData, setData, addTimer } from './dataStore';
import { NewUser, TokenObject, QuestionBody, QuizObject, ErrorString } from './types';
import {
  sessionStart,
  sessionPlayerJoin,
  sessionUpdateState,
  sessionGetStatus,
  sessionGetResults,
  sessionGetResultsCSV,
  sessionPlayerStatus,
  sessionPlayerQuestionInfo,
  sessionPlayerAnswerSubmit,
  sessionPlayerQuestionResults,
  sessionFinalResults,
  sessionViewChat,
  sessionSendChatMessage
} from './player';
import request from 'sync-request';
import fs from 'fs';
const path = require('path');
import { PORT, HOST } from './server';
const CryptoJS = require('crypto-js');

export function sha256(password) {
  return password + 'lol'; // CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

/**
 *
 * @param {number} authUserId
 * @returns {object}
 * @returns {undefined}
 */
// Helper function that finds a user in the datastore using the user authUserId.
// Returns the user object, or undefined if not found.
export function getUser(authUserId: number) {
  return getData().users.find((user: NewUser) => user.authUserId === authUserId);
}

export function findSessionOfPlayer(playerId: number) {
  const data = getData();
  for (const session of data.sessions) {
    for (const player of session.players) {
      if (player.playerId === playerId) {
        return [session.sessionId, player.name];
      }
    }
  }

  return [null, null];
}

// fetch image downloads this image to project-backend/images
// IMPORTANT - if you ever call this function, you have to do 'data = getData()' AGAIN after you
// call this function, since this function modifies db.json
// returns path_to_image on server
export function fetchDownloadImage(imgUrl: string) {
  if (imgUrl.includes('.png') == false && imgUrl.includes('.jpg') == false) {
    throw HTTPError(400, `URL: ${imgUrl} is an invalid image url.`);
  }

  if (imgUrl === '.png' || imgUrl === '.jpg') {
    throw HTTPError(400, `URL: ${imgUrl} is an invalid image url.`);
  }

  // check if this image has been previosuly downloaded
  const data = getData();
  if (data.images.find(ele => ele.imgUrl === imgUrl) !== undefined) {
    return data.images.find(ele => ele.imgUrl === imgUrl).imgPath;
  }
  // otherwise

  // request the img
  const start_time = Date.now();
  let res;
  try {
    res = request('GET', imgUrl);
    console.log(`Took ${Date.now() - start_time}ms to get img`);
  } catch (err) {
    throw HTTPError(400, `Failed to send download request to ${imgUrl}. Err = ${err}`);
  }

  // if (res == undefined || res.statusCode !== 200) {
  //   // 403 not allowed
  //   // 404 not found
  //   throw HTTPError(400, `Error requesting ${imgUrl}. Statuscode = ${res.statusCode}.`);
  // }

  let fileName = imgUrl.substring(imgUrl.lastIndexOf('/') + 1, imgUrl.length);
  const badChars = ",/<>?;;\'\":;[]{}\\|-=_+!@#$%^&*()`~";
  for (const char of badChars) {
    fileName = fileName.replace(new RegExp(`\\${char}`, 'g'), '');
  }
  // coverage
  fileName = fileName.replace('.png', '');
  fileName = fileName.replace('.jpg', '');

  fileName = fileName.substring(Math.max(fileName.length - 15, 0), fileName.length);
  if (!fileName.includes('.png') && !fileName.includes('.jpg')) {
    console.log('fuck');
    if (imgUrl.includes('.png')) {
      console.log('cum');
      fileName = fileName + '.png';
    } else {
      console.log('monkey');
      fileName = fileName + '.jpg';
    }
  }

  const count = 0;
  const filePath = path.join(__dirname, '..', 'images', fileName);
  const originalFileName = fileName;
  // while (data.images.find(ele => ele.imgPath === filePath) !== undefined) {
  //   fileName = originalFileName.substring(0, originalFileName.findIndex('.')) + String(count) + originalFileName.substring(originalFileName.findIndex('.'), originalFileName.length);
  //   filePath = path.join(__dirname, '..', 'images', fileName);
  //   count++;
  // }

  fs.writeFileSync(filePath, res.body, { flag: 'w' });

  // console.log(`Successfully saved ${imgUrl} to ${filePath}.`)

  // add to db
  data.images.push({
    imgUrl: imgUrl,
    imgPath: filePath
  });
  setData(data);

  return filePath;
}

export function getPlayersInSession(sessionId: number) {
  const data = getData();
  const session = data.sessions.find(ele => ele.sessionId === sessionId);
  const players = session.players.map((ele) => ele.name);
  return players;
}

export function sessionGetState(sessionId: number) {
  const session = getData().sessions.find(ele => ele.sessionId === sessionId);

  return session.state;
}

// Active means not in END state
export function getNumActiveSessions(token: string) {
  const data = getData();

  const sessions = data.sessions;
  let numActiveSessions = 0;
  for (const session of sessions) {
    if (sessionGetState(session.sessionId) !== 'END') {
      numActiveSessions++;
    }
  }

  return numActiveSessions;
}

/**
 *
 * @param {string} action
 * @returns {boolean}
 */
// Helper function to check if action provided is valid
export function isValidAction(action: string): boolean {
  const action_enums = ['NEXT_QUESTION', 'GO_TO_ANSWER', 'GO_TO_FINAL_RESULTS', 'END', ''];

  if (action_enums.includes(action)) {
    return true;
  }
  return false;
}

/**
 *
 * @param {string} action
 * @param {number} sessionId
 * @returns {boolean}
 */
// Helper function to check if action_enum is valid for current state
export function isValidActionOnSessionState(action: string, sessionId: number) {
  // Action provided is not a valid Action enum
  if (isValidAction(action) === false) {
    throw HTTPError(400, 'Action provided is not a valid Action enum - invalid action ENUM');
  }
  // if (sessionGetState(sessionId) === undefined) {
  //   throw HTTPError(400, 'Action provided is not a valid Action enum - session not found');
  // }

  const sessionState = sessionGetState(sessionId);

  const stateShifts = {
    LOBBY: ['NEXT_QUESTION', 'END'],
    QUESTION_COUNTDOWN: ['END'],
    QUESTION_OPEN: ['GO_TO_ANSWER', 'END'],
    QUESTION_CLOSE: ['GO_TO_ANSWER', 'NEXT_QUESTION', 'GO_TO_FINAL_RESULTS', 'END'],
    FINAL_RESULTS: ['END'],
    ANSWER_SHOW: ['NEXT_QUESTION', 'GO_TO_FINAL_RESULTS', 'END'],
    END: [],
  };

  if (stateShifts[sessionState].includes(action)) {
    return true;
  }
  return false;
}

/**
 * Session State Enum
 */
enum SessionState {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END'
}

/**
 * Action Enum
 */
enum Action {
  NEXT_QUESTION = 'NEXT_QUESTION',
  END = 'END',
  GO_TO_ANSWER = 'GO_TO_ANSWER',
  GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS'
}

/**
 *
 * @param {Action} action
 * @param {number} sessionId
 * @returns {string}
 */
// Helper function to update session status
export const FINISH_COUNTDOWN = 0.1 * 1000;

export function performAction(action: Action, sessionId: number) {
  let data = getData();
  const session = data.sessions.find(ele => ele.sessionId === sessionId);
  let sessionStatus = session.state;
  const atQuesIndex = session.atQuestion - 1;
  console.log('atQuesIndex: ' + atQuesIndex);
  const sessionDuration = session.quiz.questions[atQuesIndex].duration * 1000;
  // export const finish countdown
  let indexOfSessionInSessions;
  let timerId;

  if (sessionStatus === SessionState.LOBBY) {
    // data.sessions[indexOfSessionInSessions].questionsGoneThrough = [];
    if (action === Action.NEXT_QUESTION) {
      console.log('Session question duration: ' + sessionDuration);
      sessionStatus = SessionState.QUESTION_COUNTDOWN;
      indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
      data.sessions[indexOfSessionInSessions].state = sessionStatus;
      data.sessions[indexOfSessionInSessions].atQuestion = 1;

      for (const player of data.sessions[indexOfSessionInSessions].players) {
        player.atQuestion = 1;
      }
      console.log('Transition: LOBBY -> QUESTION_COUNTDOWN');
      setData(data);
      timerId = setTimeout(() => {
        data = getData();
        sessionStatus = SessionState.QUESTION_OPEN;
        indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
        data.sessions[indexOfSessionInSessions].state = sessionStatus;
        data.sessions[indexOfSessionInSessions].startTime = Date.now();
        data.sessions[indexOfSessionInSessions].questionsGoneThrough = [];
        const questionId = data.sessions[indexOfSessionInSessions].quiz.questions[atQuesIndex].questionId;
        data.sessions[indexOfSessionInSessions].questionsGoneThrough.push(questionId);

        setData(data);
        console.log('Transition: QUESTION_COUNTDOWN -> QUESTION_OPEN');
      }, FINISH_COUNTDOWN);
      addTimer(timerId);
      timerId = setTimeout(() => {
        data = getData();
        sessionStatus = SessionState.QUESTION_CLOSE;
        indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
        data.sessions[indexOfSessionInSessions].state = sessionStatus;
        setData(data);
      }, sessionDuration);
      console.log(`the timerid = ${timerId}`);
      addTimer(timerId);
    } else if (action === Action.END) {
      sessionStatus = SessionState.END;
      indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
      data.sessions[indexOfSessionInSessions].state = sessionStatus;
      setData(data);
      console.log('Transition: LOBBY -> END');
    } else {

    }
  } else if (sessionStatus === SessionState.QUESTION_COUNTDOWN) {
    if (action === Action.END) {
      sessionStatus = SessionState.END;
      indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
      data.sessions[indexOfSessionInSessions].state = sessionStatus;
      setData(data);
      console.log('Transition: QUESTION_COUNTDOWN -> END');
    } else {

    }
  } else if (sessionStatus === SessionState.QUESTION_OPEN) {
    if (action === Action.GO_TO_ANSWER) {
      sessionStatus = SessionState.ANSWER_SHOW;
      indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
      data.sessions[indexOfSessionInSessions].state = sessionStatus;
      setData(data);
      console.log('Transition: QUESTION_OPEN -> ANSWER_SHOW');
    } else if (action === Action.END) {
      sessionStatus = SessionState.END;
      indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
      data.sessions[indexOfSessionInSessions].state = sessionStatus;
      setData(data);
      console.log('Transition: QUESTION_COUNTDOWN -> END');
    } else {

    }
  } else if (sessionStatus === SessionState.QUESTION_CLOSE) {
    if (action === Action.GO_TO_ANSWER) {
      sessionStatus = SessionState.ANSWER_SHOW;
      indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
      data.sessions[indexOfSessionInSessions].state = sessionStatus;
      setData(data);
      console.log('Transition: QUESTION_CLOSE -> ANSWER_SHOW');
    } else if (action === Action.END) {
      sessionStatus = SessionState.END;
      indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
      data.sessions[indexOfSessionInSessions].state = sessionStatus;
      setData(data);
      console.log('Transition: QUESTION_COUNTDOWN -> END');
    } else if (action === Action.GO_TO_FINAL_RESULTS) {
      sessionStatus = SessionState.FINAL_RESULTS;
      indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
      data.sessions[indexOfSessionInSessions].state = sessionStatus;
      setData(data);
    } else if (action === Action.NEXT_QUESTION) {
      sessionStatus = SessionState.QUESTION_COUNTDOWN;
      indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
      data.sessions[indexOfSessionInSessions].state = sessionStatus;
      data.sessions[indexOfSessionInSessions].atQuestion++; // increment
      const index = data.sessions[indexOfSessionInSessions].atQuestion - 1;
      const questionId = data.sessions[indexOfSessionInSessions].quiz.questions[index].questionId;
      data.sessions[indexOfSessionInSessions].questionsGoneThrough.push(questionId);

      data.sessions[indexOfSessionInSessions].questionsGoneThrough.push(questionId);
      for (const player of data.sessions[indexOfSessionInSessions].players) {
        player.atQuestion++;
      }
      console.log('Transition: QUESTION_CLOSE -> QUESTION_COUNTDOWN');
      setData(data);

      timerId = setTimeout(() => {
        data = getData();
        sessionStatus = SessionState.QUESTION_OPEN;
        indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
        data.sessions[indexOfSessionInSessions].state = sessionStatus;
        setData(data);
        console.log('Transition: QUESTION_COUNTDOWN -> QUESTION_OPEN');
      }, FINISH_COUNTDOWN);
      addTimer(timerId);
      timerId = setTimeout(() => {
        data = getData();
        sessionStatus = SessionState.QUESTION_CLOSE;
        indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
        data.sessions[indexOfSessionInSessions].state = sessionStatus;
        setData(data);
      }, sessionDuration);
      addTimer(timerId);
    } else {

    }
  } else if (sessionStatus === SessionState.ANSWER_SHOW) {
    if (action === Action.END) {
      sessionStatus = SessionState.END;
      indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
      data.sessions[indexOfSessionInSessions].state = sessionStatus;
      setData(data);
      console.log('Transition: ANSWER_SHOW -> END');
    } else if (action === Action.GO_TO_FINAL_RESULTS) {
      sessionStatus = SessionState.FINAL_RESULTS;
      indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
      data.sessions[indexOfSessionInSessions].state = sessionStatus;
      setData(data);
      console.log('Transition: ANSWER_SHOW -> FINAL_RESULTS');
    } else if (action === Action.NEXT_QUESTION) {
      sessionStatus = SessionState.QUESTION_COUNTDOWN;
      indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
      data.sessions[indexOfSessionInSessions].state = sessionStatus;
      data.sessions[indexOfSessionInSessions].atQuestion++; // increment
      for (const player of data.sessions[indexOfSessionInSessions].players) {
        player.atQuestion++;
      }
      console.log('Transition: QUESTION_CLOSE -> QUESTION_COUNTDOWN');

      const index = data.sessions[indexOfSessionInSessions].atQuestion - 1;
      const questionId = data.sessions[indexOfSessionInSessions].quiz.questions[index].questionId;
      data.sessions[indexOfSessionInSessions].questionsGoneThrough.push(questionId);
      setData(data);
      timerId = setTimeout(() => {
        data = getData();
        sessionStatus = SessionState.QUESTION_OPEN;
        indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
        data.sessions[indexOfSessionInSessions].state = sessionStatus;
        setData(data);
        console.log('Transition: QUESTION_COUNTDOWN -> QUESTION_OPEN');
      }, FINISH_COUNTDOWN);
      addTimer(timerId);
      timerId = setTimeout(() => {
        data = getData();
        sessionStatus = SessionState.QUESTION_CLOSE;
        indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
        data.sessions[indexOfSessionInSessions].state = sessionStatus;
        setData(data);
      }, sessionDuration);
      addTimer(timerId);
    } else {

    }
  } else if (sessionStatus === SessionState.FINAL_RESULTS) {
    if (action === Action.END) {
      sessionStatus = SessionState.END;
      indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
      data.sessions[indexOfSessionInSessions].state = sessionStatus;
      setData(data);
      console.log('Transition: QUESTION_COUNTDOWN -> END');
    } else {

    }
  } else {

  }

  // else{
  //   //(sessionStatus === SessionState.END){
  //   return 'no action_enum can be used on end session';
  // }

  return sessionStatus;
}

/**
 *
 * @param {string} token
 * @returns {error: string} if error
 * @returns {quiz } if no error
 */
// Helper function that thrwos error if there is an error with quiz (invalid quiz, or no ownership)
// Throws error, or if no error, returns quiz
export function throwQuizError(token: string, quizId: number) {
  const data = getData();
  // Quiz ID does not refer to a valid quiz
  const quiz = getValidQuiz(quizId);
  if (quiz === undefined) {
    throw HTTPError(400, 'Quiz ID does not refer to a valid quiz');
  }

  // Quiz ID does not refer to a quiz that this user owns
  const tokenObject = data.tokens.find((ele:TokenObject) => ele.token === token);
  if (userOwnsQuiz(quiz, tokenObject.userId) === false) {
    // return { error: "Quiz ID does not refer to a quiz that this user owns"}
    throw HTTPError(400, 'Quiz ID does not refer to a quiz that this user owns');
  }
  return quiz;
}

/**
 *
 * @param {string} token
 * @returns {error: string} if error
 * @returns { } if no error
 */
// Helper function that throws token error if there is an error (401/403)
// Throws error, or if no error, returns void
export function throwTokenError(token: string | string[]): ErrorString {
  if (!checkTokenStructure(token)) {
    throw HTTPError(401, 'Token is not in a valid structure');
  }

  const tokenObject = getData().tokens.find((ele: TokenObject) => ele.token === token);

  if (!tokenObject) {
    throw HTTPError(403, 'User is not currently logged in.'); //  \nToken = ${token}\nAll Tokens = ${JSON.stringify(getData().tokens)}`)
  }
}

/**
 *
 * @param {string} token
 * @returns {error: string} if error
 * @returns {string } 'none' if no error.
 */
// Helper function that checks for token error (401/403)
// Returns error, or 'none' if no error.
export function checkTokenError(token: string): ErrorString {
  if (!checkTokenStructure(token)) {
    return {
      error: 'Token is not in a valid structure'
    };
  }

  const tokenObject = getData().tokens.find((ele: TokenObject) => ele.token === token);

  if (!tokenObject) {
    return {
      error: 'User is not currently logged in' // \nToken = ${token}\nAll Tokens = ${JSON.stringify(getData().tokens)}`
    };
  }

  return { error: 'none' }; // if no error
}

/**
 *
 * @param {questionBody} questionBody
 * @returns {boolean}
 */
// Checks if there exists a correct answer within a question's answers
export function correctAnswerExists(questionBody: QuestionBody) {
  for (const currentAnswer of questionBody.answers) {
    if (currentAnswer.correct === true) {
      return true;
    }
  }
  return false;
}

/**
 *
 * @param {string} name
 * @returns {bool} //true if allowed, false if not
 */
// Helper function that checks if allowed special characters are in a string
export function checkAllowedSpecialCharacters(name: string) {
  return /^[0-9a-zA-Z '-]+$/.test(name);
}

/**
 *
 * @param {}
 * @returns {string} //the color
 */
// Helper function generates a random color as a string
export function randomColour() {
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'brown', 'orange'];
  return { colour: colors[getRandomNumber(0, colors.length - 1)] };
}

/**
   *
   * @param {number} quizId
   * @returns {object}
   * @returns {undefined}
  */
// Helper function to return quiz if quizId exists,
// returns undefined if quiz does not exist
export function getValidQuiz(quizId: number) {
  return getData().quizzes.find((quiz: QuizObject) => quiz.quizId === quizId);
}

/**
   *
   * @param {string} name
   * @returns {boolean}
   */
// Helper function that checks if a quizName is valid
// Returns true if valid, false otherwise.
export function checkQuizName(name: string) {
  // ensure quiz length (3-30), alphanumeric characters and no spaces
  return /^([a-zA-z0-9 ]){3,30}$/.test(name);
}

/**
   *
   * @param {number} authUserId
   * @param {string} name
   * @returns {boolean}
   */
// Helper function that ensures that a quizName isn't already created by user.
// Returns true if quizName does not exist, false otherwise.
export function quizNameNotUsed(authUserId: number, name: string) {
  // must return false if the quiz exists, otherwise !undefined is true
  return !getData().quizzes.find((quiz: QuizObject) => quiz.name === name && quiz.creatorId === authUserId);
}

/**
   *
   * @param {QuizObject} quiz
   * @param {number} authUserId
   * @returns {boolean}
  */
// Helper function to return true if user owns quiz,
// returns false if user does not own quiz or true if they do
export function userOwnsQuiz(quiz: QuizObject, authUserId: number) {
  // //NEW
  // let data = getData();
  // let user = getUser(authUserId);

  // for (const ID of user.quizzesCreated){
  //   if(ID === quiz.quizId){
  //     return true;
  //   }
  // }

  // return false;

  // OLD
  if (quiz.creatorId === authUserId) {
    return true;
  }
  return false;
}

// /**
//  *
//  * @param {string} char (a single character)
//  * @returns {boolean} true/false
//  */
// // Helper function that Checks if a single character is a letter.
// export function isLetter(char: string) {
//   return char.toUpperCase() !== char.toLowerCase();
// }

// /**
//    *
//    * @param {string} digit (a single digit, as a string)
//    * @returns {boolean} true/false
//    */
// // Helper function that Checks if a single character is a digit.
// export function isDigit(char: string) {
//   return '0123456789'.includes(char);
// }

/**
 *
 * @param {string} str
 * @returns {boolean} true/false
 */
// Helper function that Checks if a string contains a number.
export function hasNumber(str: string) {
  return /\d/.test(str);
}

/**
   *
   * @param {string} str
   * @returns {boolean} true/false
   */
// Helper function that Checks if a string contains a letter.
export function hasLetter(str: string) {
  return /[a-zA-Z]/.test(str);
}

/**
 *
 * @param {string} email
 * @returns {object}
 * @returns {undefined}
 */
// Helper function that finds a user in the datastore using the user email.
// Returns the user object, or undefined if not found.
export function getUserWithEmail(email: string) {
  return getData().users.find((user: NewUser) => user.email === email);
}

/**
 *
 * @param {number} authUserId
 * @returns {quiz[]}
 */
// Helper function that finds [quizzes created by a user], based on authUserId
export function getUsersQuizzesByUserId(authUserId: number) {
  const allQuizzes = getData().quizzes;

  const userQuizzes = [];

  for (const quiz of allQuizzes) {
    if (quiz.creatorId === authUserId) {
      userQuizzes.push(quiz);
    }
  }

  return userQuizzes;
}

/**
 * @returns {time: number} //in seconds
 */
// Helper function to get unix time in seconds
export function getUNIXTime() : number {
  const unixTime = Math.round(new Date().getTime() / 1000);
  return unixTime;
}

/**
 *
 * @param {string} token
 * @returns {boolean}
 */
// Helper function that returns true if token is in right format, else false
export function checkTokenStructure(token: string): boolean {
  return /^[0-9]{6}$/.test(token);
}

/**
 * @param min
 * @param max
 * @returns {randomNumber: number}
 */
// Helper function to get random number between min, max inclusive
export function getRandomNumber(min: number, max: number) {
  const randomDecimal = Math.random();

  const randomNumber = Math.floor(randomDecimal * (max - min + 1)) + min;

  return randomNumber;
}

// QuestionNumber starts at 1
export function getPlayerQuestionRankByPlayerId(playerId, questionPosition, session) {
  const playerResponse = session.questionResponses[questionPosition - 1].playerResponses.find(ele => ele.playerId === playerId);

  const currentQuestionPlayerResponses = session.questionResponses[questionPosition - 1].playerResponses;

  let scores = currentQuestionPlayerResponses.map(ele => {
    return {
      playerId: ele.playerId,
      score: getPlayerQuestionScoreByPlayerId(ele.playerId, questionPosition, session)
    };
  });

  scores = scores.sort((a, b) => b.score - a.score);

  return scores.findIndex(ele => ele.playerId === playerId) + 1;
}

// QuestionNumber starts at 1
export function getPlayerQuestionScoreByPlayerId(playerId, questionPosition, session) {
  const playerResponse = session.questionResponses[questionPosition - 1].playerResponses.find(ele => ele.playerId === playerId);

  const answerIds = playerResponse.answerIds;

  const score = getPlayerQuestionScore(answerIds, playerId, questionPosition, session.sessionId, session.quiz.quizId);

  return score;
}

export function getPlayerQuestionScore(answerIds: number[], playerId: number, questionPosition: number, sessionId: number, quizId: number) {
  const data = getData();

  // Find the session that matches the provided player id
  const session =
  getData().sessions.find((session: NewUser) => session.sessionId === sessionId);

  // Find current question
  const quiz = getData().quizzes.find((quiz:QuizObject) => quiz.quizId === quizId);
  const currentQuestion = quiz.questions[questionPosition - 1];
  const currentQuestionResponses = session.questionResponses.find((response) => response.questionId === currentQuestion.questionId);

  // Get all correct answer IDs for current question
  // const validAnswerIds = currentQuestion.answers.filter((answer) => answer.correct).map((answer) => answer.answerId);
  // console.log("current q ", currentQuestion);
  const correctAnswers = currentQuestion.answers.filter((answer) => answer.correct);
  // console.log("correct answers", correctAnswers);
  const validAnswerIds = correctAnswers.map((answer) => answer.answerId);
  // console.log("current q", currentQuestion);
  // for ( const answer of validAnswerIds) {
  //   console.log("answer of validanswerid is ", answer);
  // }
  // for (const answer of answerIds) {
  //   console.log("answer in player answer id", answer);
  // }
  // Check if the given answer IDs are a subset of the valid answer IDs
  // const isCorrect = answerIds.length === validAnswerIds.length && answerIds.every((answerId) => validAnswerIds.includes(answerId));

  const isCorrect = answerIds.every((element) => validAnswerIds.includes(element));

  let score = 0;
  if (isCorrect) {
    // console.log("correct");
    // Find the position (N) of this correct answer based on response time
    const correctResponses = currentQuestionResponses.playerResponses.filter((response) => {
      return response.answerIds.length === validAnswerIds.length && response.answerIds.every((id) => validAnswerIds.includes(id));
    });
    // Step 2: Sort correct responses based on response time
    correctResponses.sort((a, b) => a.timeSubmitted - b.timeSubmitted);

    // Step 3: Find the position (N) of the player's response
    const playerIndex = correctResponses.findIndex((response) => response.playerId === playerId);
    const position = playerIndex + 1;
    // console.log("position", position);

    // const correctResponses = currentQuestionResponses.playerResponse.filter((response) => {
    //   const { answerIds } = response;
    //   return answerIds.length === validAnswerIds.length && answerIds.every((id) => validAnswerIds.includes(id));
    // });
    // const sortedCorrectResponses = correctResponses.sort((a, b) => a.timeSubmitted - b.timeSubmitted);
    // const position = sortedCorrectResponses.findIndex((response) => response.playerId === playerId);
    // Calculate the scaling factor 1/N
    let scalingFactor = 0;
    // if not found, then playerIndex = -1, so position = 0 //(old = >=1. jack, change, 456am)
    if (position > 0) {
      scalingFactor = 1 / position;
    }
    score = currentQuestion.points * scalingFactor;
  }
  // console.log("score", score);
  return Number(score.toFixed(1));
}
export function hasCommonElement(correctAnswerArray: Array, playerAnswerArray: Array) {
  // console.log("comaparing", correctAnswerArray, "2",playerAnswerArray)
  let x = 0;
  for (const element of correctAnswerArray) {
    for (const answer of playerAnswerArray) {
      if (element === answer) {
        x++;
      }
    }
  }
  return x;
}
