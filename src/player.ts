import { getData, setData } from './dataStore';
import {
  getValidQuiz, userOwnsQuiz, throwTokenError, throwQuizError,
  getNumActiveSessions, sessionGetState,
  getPlayersInSession, isValidActionOnSessionState,
  performAction, fetchDownloadImage, findSessionOfPlayer,
  getPlayerQuestionScore
} from './helper';
import { TokenObject } from './types';
import HTTPError from 'http-errors';
// This file will be both for organising players, and game-state
// Consts for the state of the session
export const STATE_END = -1;
export const STATE_LOBBY = 0;
export const STATE_QUESTION_COUNTDOWN = 1;
export const STATE_QUESTION_OPEN = 2;
export const STATE_QUESTION_CLOSE = 3;
export const STATE_ANSWER_SHOW = 4;
export const STATE_FINAL_RESULTS = 5;
// Consts for the 'key action' that admins can send that moves between states.
export const GO_TO_NEXT_QUESTION = 10;
export const GO_TO_ANSWER = 11;
export const GO_TO_FINAL_RESULTS = 12;
export const GO_TO_END = 13;

function updateThumbnail(quizId: number, token:string, imgUrl:string) {
  let data = getData();
  throwTokenError(token);
  throwQuizError(token, quizId);
  const filePath = fetchDownloadImage(imgUrl);
  // re-get data since fetchDownloadImage modifies it.
  data = getData();
  data.quizzes[data.quizzes.findIndex(quiz => quiz.quizId === quizId)].thumbnailUrl = imgUrl;
  // data.quizzes[data.quizzes.findIndex(quiz=>quiz.quizId === quizId)].thumbnailPath =  filePath
  setData(data);
  return filePath;
}

function sessionStart(quizId: number, token: string, autoStartNum: number) {
  const data = getData();
  // Error 401/403
  // If there is a token error (401/403) then we throw it here, inside this helper function
  // If no error, does nothing.
  throwTokenError(token);
  const quiz = throwQuizError(token, quizId);
  // autoStartNum is a number greater than 50
  if (autoStartNum > 50) {
    // return {error:"autoStartNum is a number greater than 50" }
    throw HTTPError(400, 'autoStartNum is a number greater than 50');
  }
  // A maximum of 10 sessions that are not in END state currently exist
  if (getNumActiveSessions(token) >= 10) {
    // return { error: "A maximum of 10 sessions that are not in END state currently exist"}
    throw HTTPError(400, 'A maximum of 10 sessions that are not in END state currently exist');
  }
  // The quiz does not have any questions in it
  if (quiz.questions.length === 0) {
    // return {error: "The quiz does not have any questions in it"}
    throw HTTPError(400, 'The quiz does not have any questions in it');
  }
  // duplicate the quiz - this doensn't duplicate the quiz in data.quizzes
  // it copies the quiz object into session.quiz
  const uniqueSessionId = Date.now() + Math.floor(Math.random() * 1000000000);
  const session = {
    sessionId: uniqueSessionId,
    atQuestion: 1,
    quiz: quiz,
    state: 'LOBBY',
    autoStartNum: autoStartNum,
    players: [],
    questionResponses: [],
    chat: [],
    thumbnailUrl: 'http://google.com/some/image/path.jpg',
  };
  data.sessions.push(session);
  setData(data);
  return { sessionId: uniqueSessionId };
}

function sessionPlayerJoin(sessionId: number, playerName: string) {
  // Name of user entered is not unique (compared to other users who have already joined)
  let existingPlayers = getPlayersInSession(sessionId);
  if (existingPlayers.includes(playerName)) {
    throw HTTPError(400, 'Name of user entered is not unique');
    // return {error:"Name of user entered is not unique"};
  }
  // Session is not in LOBBY state
  const data = getData();
  const currentSession = data.sessions.find(ele => ele.sessionId === sessionId);
  if (sessionGetState(sessionId) !== 'LOBBY') {
    throw HTTPError(400, 'Session is not in LOBBY state');
    // return {error: "Session is not in LOBBY state"};
  }
  // If name entered === '' set name to 5letter+
  while (playerName === '' || existingPlayers.includes(playerName)) {
    let alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let digits = '0123456789';
    playerName = '';
    for (let i = 0; i < 5; i++) {
      const randomNum = Math.floor(Math.random() * (26 - i));
      playerName += alphabet[randomNum];
      alphabet = alphabet.split(alphabet[randomNum]).join('');
    }
    for (let i = 0; i < 3; i++) {
      const randomNum = Math.floor(Math.random() * (10 - i));
      playerName += digits[randomNum];
      digits = digits.split(digits[randomNum]).join('');
    }
  }
  const uniquePlayerId = Date.now() + Math.floor(Math.random() * 1000000000);
  // atQuestion = The current question that has been advanced to in the quiz, where 1 is the first question. If the quiz is in either LOBBY, FINAL_RESULTS, or END state then the value is 0.
  const newPlayer = {
    name: playerName,
    playerId: uniquePlayerId,
    atQuestion: 1
  };// atquestion starts at 1
  const indexOfSessionInSessions = data.sessions.findIndex(ele => ele.sessionId === sessionId);
  data.sessions[indexOfSessionInSessions].players.push(newPlayer);
  setData(data);
  const session = data.sessions[indexOfSessionInSessions];
  existingPlayers = getPlayersInSession(sessionId);
  if (session.autoStartNum !== 0 && existingPlayers.length >= session.autoStartNum && session !== undefined && sessionGetState(currentSession.sessionId) === 'LOBBY') {
    sessionUpdateState(session.quiz.quizId, sessionId, data.tokens[0].token, 'NEXT_QUESTION');
  }
  return { playerId: uniquePlayerId };
}

function sessionUpdateState(quizId: number, sessionId: number, token: string, action: string) {
  let data = getData();
  // Error 401/403
  // If there is a token error (401/403) then we throw it here, inside this helper function
  // If no error, does nothing.
  throwTokenError(token);
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
  // Session Id does not refer to a valid quiz
  const session = data.sessions.find(ele => ele.sessionId === sessionId);
  if (session === undefined) {
    throw HTTPError(400, 'Session ID does not refer to a valid session');
  }
  // Action enum cannot be applied in the current state (see spec for details)
  if (isValidActionOnSessionState(action, sessionId) === false) {
    throw HTTPError(400, `Action enum cannot be applied in the current state: ${action} on ${sessionGetStatus(quizId, sessionId, token).state}`);
  }
  setData(data);
  // below functino modifies datastore so we haveto set() and re-get()
  const sessionUpdatedState = performAction(action, sessionId);
  data = getData();
  const indexOfSessionInSessions = data.sessions.findIndex((ele) => ele.sessionId === sessionId);
  data.sessions[indexOfSessionInSessions].state = sessionUpdatedState;
  setData(data);
  return {};
}

function sessionGetStatus(quizId: number, sessionId: number, token: string) {
  const data = getData();
  // Error 401/403
  // If there is a token error (401/403) then we throw it here, inside this helper function
  // If no error, does nothing.
  throwTokenError(token);
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
  // Session Id does not refer to a valid quiz
  const session = data.sessions.find(ele => ele.sessionId === sessionId);
  if (session === undefined) {
    throw HTTPError(400, 'Session ID does not refer to a valid quiz');
  }
  const sessionObject = {
    state: session.state,
    atQuestion: session.atQuestion,
    players: session.players.map(playerObj => playerObj.name),
    metadata: {
      quizId: session.quiz.quizId,
      name: session.quiz.name,
      timeCreated: session.quiz.timeCreated,
      timeLastEdited: session.quiz.timeLastEdited,
      description: session.quiz.description,
      numQuestions: session.quiz.numQuestions,
      questions: session.quiz.questions,
      duration: session.quiz.duration,
      thumbnailUrl: session.thumbnailUrl,
    }
  };
  // console.log(sessionObject);
  return sessionObject;
}

// Get the status of a guest player that has already joined a session
function sessionPlayerStatus(playerId:number) {
  const search = findSessionOfPlayer(playerId);
  const sessionId = search[0];
  const playerName = search[1];
  if (sessionId === null || playerName === null) {
    throw HTTPError(400, 'Player ID does not exist.');
  }
  const data = getData();
  const session = data.sessions.find(ele => ele.sessionId === sessionId);
  return {
    state: session.state,
    numQuestions: session.quiz.questions.length,
    atQuestion: session.atQuestion
  };
}

function sessionPlayerQuestionInfo(playerId: number, questionPosition: number) {
  const data = getData();
  const sessionInfo = findSessionOfPlayer(playerId);
  const sessionIdOfPlayer = sessionInfo[0];
  const playerName = sessionInfo[1];
  if (sessionIdOfPlayer === null || playerName === null) {
    throw HTTPError(400, 'Player ID does not exist.');
  }
  const session = data.sessions.find(ele => ele.sessionId === sessionIdOfPlayer);
  if (session.atQuestion !== questionPosition) {
    throw HTTPError(400, 'session is not currently on this question');
  }
  const sessionState = sessionGetState(sessionIdOfPlayer);
  if (sessionState === 'LOBBY' || sessionState === 'END') {
    throw HTTPError(400, 'Session is in LOBBY state');
  }
  // IMPORTANT NOTE - THE QUESTIONS ARE INDEXED FROM 1
  // THE FIRST QUESTION IS 'QUESTIONPOSITINO 1"/"ATPOSITION = 1"
  const qAns = session.quiz.questions[questionPosition - 1].answers;
  // view jack's post on forum, should this have 'correct' field?
  // const processedAnswers = [];// answers.map(({ correct, ...rest }) => rest);
  for (const ans of qAns) {
    delete ans.correct;
  }
  // for (const ans of qAns){
  //     processedAnswers.push({
  //         answerId: ans["answerId"],
  //         answer: ans["answer"],
  //         colour: ans["colour"]
  //     })
  // }
  const result = {
    questionId: session.quiz.questions[questionPosition - 1].questionId,
    question: session.quiz.questions[questionPosition - 1].question,
    duration: session.quiz.questions[questionPosition - 1].duration,
    thumbnailUrl: session.quiz.questions[questionPosition - 1].thumbnailUrl,
    points: session.quiz.questions[questionPosition - 1].points,
    answers: qAns
  };
  return result;
}

function sessionPlayerAnswerSubmit(answerIds: number[], playerId: number, questionPosition: number) {
  const data = getData();
  // Find the session that matches the provided player id
  const session = data.sessions.find((ele) => ele.players.some((player) => player.playerId === playerId));
  // Error 400, invalid player id
  if (!session) {
    throw HTTPError(400, 'Invalid player ID');
  }
  // Error 400, question position is not valid for the session this player is in
  const numQuestions = session.quiz.numQuestions;
  if (questionPosition < 1 || questionPosition > numQuestions) {
    throw HTTPError(400, 'Invalid question position');
  }
  // Error 400, session is not in QUESTION_OPEN state
  if (session.state !== 'QUESTION_OPEN') {
    throw HTTPError(400, 'Session is not currently accepting answers');
  }
  // Error 400, session is not yet up to this question
  if (session.atQuestion !== questionPosition) {
    throw HTTPError(400, 'Session is not yet up to this question');
  }
  // Error 400, less than 1 answer ID submitted
  if (answerIds.length < 1) {
    throw HTTPError(400, 'Less than 1 answer ID was submitted');
  }
  // If duplicate answer IDs are provided
  if (answerIds.length !== new Set(answerIds).size) {
    throw HTTPError(400, 'There are duplicate answer IDs provided');
  }
  // Find current question
  const currentQuestion = session.quiz.questions[questionPosition - 1];
  // Get all valid answer IDs for current question
  const validAnswerIds = currentQuestion.answers.map((answer) => answer.answerId);
  // Check the given answer IDs are a subset of the valid answer IDs
  const isSubset = answerIds.every((answerId) => validAnswerIds.includes(answerId));
  // If answer IDs are not a subset of valid answer IDs
  if (!isSubset) {
    throw HTTPError(400, 'Answer IDs are not valid for this particular question');
  }
  // Update session's question responses with the player's answer
  const playerResponse = {
    playerId: playerId,
    answerIds: answerIds,
    timeSubmitted: Date.now(),
  };
  const questionResponse = {
    questionId: currentQuestion.questionId,
    playerResponses: []
  };
  const index = (data.sessions).findIndex((session) => session.players.some((player) => player.playerId === playerId));
  const currentQuestionResponse = data.sessions[index].questionResponses.find((element) => element.questionId === currentQuestion.questionId);
  if (currentQuestionResponse === undefined) {
    questionResponse.playerResponses.push(playerResponse);
    data.sessions[index].questionResponses.push(questionResponse);
  } else {
    currentQuestionResponse.playerResponses.push(playerResponse);
  }
  setData(data);
  return {};
}

function sessionPlayerQuestionResults(playerId: number, questionPosition: number) {
  const data = getData();
  // Find the session that matches the provided player id
  const session = data.sessions.find((ele) => ele.players.some((player) => player.playerId === playerId));
  // Error 400, invalid player id
  if (!session) {
    throw HTTPError(400, 'Invalid player ID');
  }
  // Error 400, question position is not valid for the session this player is in
  const numQuestions = session.quiz.numQuestions;
  if (questionPosition < 1 || questionPosition > numQuestions) {
    throw HTTPError(400, 'Invalid question position');
  }
  // Error 400, session is not in ANSWER_SHOW state
  if (session.state !== 'ANSWER_SHOW') {
    throw HTTPError(400, 'Session is not in ANSWER_SHOW state');
  }
  // Error 400, session is not yet up to this question
  if (session.atQuestion !== questionPosition) {
    throw HTTPError(400, 'Session is not yet up to this question');
  }
  return getPlayerQuestionResults(session, playerId, questionPosition);
}

function getPlayerQuestionResults(session: any, playerId: number, questionPosition: number) {
  // Get given question from current session's quiz
  const question = session.quiz.questions[questionPosition - 1];
  // Correct answers array
  const correctAnswers = question.answers
    .filter((answer) => answer.correct === true)
    .map((answer) => ({ answerId: answer.answerId, playersCorrect: [] }));
  let totalTime = 0;
  const playersCorrect = [];
  const questionResponse = session.questionResponses[questionPosition - 1];
  // No players have responded
  if (!questionResponse) {
    const questionCorrectBreakdown = correctAnswers.map((correctAnswer) => ({
      answerId: correctAnswer.answerId,
      playersCorrect: [],
    }));
    const responseDetailsNoResponses = {
      questionId: question.questionId,
      questionCorrectBreakdown: questionCorrectBreakdown,
      averageAnswerTime: 0,
      percentCorrect: 0,
    };
    return responseDetailsNoResponses;
  }
  for (const playerResponse of questionResponse.playerResponses) {
    totalTime = totalTime + (playerResponse.timeSubmitted - session.startTime);
    // Checking each answerId of player's responses
    for (const answerId of playerResponse.answerIds) {
      // If player's response includes any correct answers
      if (correctAnswers.some((correctAnswer) => correctAnswer.answerId === answerId)) {
        const playerName = session.players.find((currentPlayer) => currentPlayer.playerId === playerId).name;
        playersCorrect.push(playerName);
        // Get player name for each correct answer
        const correctAnswer = correctAnswers.find((answer) => answer.answerId === answerId);
        if (correctAnswer) {
          correctAnswer.playersCorrect.push(playerName);
        }
      }
    }
  }
  const questionCorrectBreakdown = correctAnswers.map((correctAnswer) => ({
    answerId: correctAnswer.answerId,
    playersCorrect: correctAnswer.playersCorrect,
  }));
  let percentCorrect = (playersCorrect.length / session.players.length) * 100;
  if (playersCorrect.length > 1) {
    percentCorrect /= playersCorrect.length;
  }
  const responseDetails = {
    questionId: question.questionId,
    questionCorrectBreakdown: questionCorrectBreakdown,
    averageAnswerTime: Math.ceil(totalTime / questionResponse.playerResponses.length),
    percentCorrect: percentCorrect,
  };
  return responseDetails;
}

function sessionFinalResults(playerId:number) {
  const data = getData();
  // Find the session that matches the provided player id
  const session = data.sessions.find((ele) => ele.players.some((player) => player.playerId === playerId));
  // Error 400, invalid player id
  if (!session) {
    throw HTTPError(400, 'Invalid player ID');
  }
  const sessionId = session.sessionId;
  const quizId = session.quiz.quizId;
  // Error 400, session is not in FINAL_RESULTS state
  if (session.state !== 'FINAL_RESULTS') {
    throw HTTPError(400, 'Session is not FINAL_RESULTS state');
  }
  const usersRankedByScore = [];
  const questionResults = [];
  // Initialising each player to have score 0
  for (const player of session.players) {
    usersRankedByScore.push(
      {
        name: player.name,
        score: 0
      }
    );
  }
  let questionPosition = 0;
  for (const question in session.quiz.questions) {
    questionPosition++;
    const responseDetails = getPlayerQuestionResults(session, playerId, questionPosition);
    questionResults.push(responseDetails);
    // No players have responded
    if (responseDetails.averageAnswerTime === 0) {
      return {
        usersRankedByScore: usersRankedByScore,
        questionResults: questionResults
      };
    }
    const questionId = session.quiz.questions[questionPosition - 1].questionId;
    const questionIndex = session.questionResponses.findIndex((response) => response.questionId === questionId);
    // Get score of each player
    for (const player of session.questionResponses[questionIndex].playerResponses) {
      const playerId = player.playerId;
      const playerName = session.players.find(player => player.playerId === playerId).name;
      const user = usersRankedByScore.find((currentUser) => currentUser.name === playerName);
      user.score += getPlayerQuestionScore(player.answerIds, playerId, questionPosition, sessionId, quizId);
    }
  }
  usersRankedByScore.sort((a, b) => b.score - a.score);
  return {
    usersRankedByScore: usersRankedByScore,
    questionResults: questionResults
  };
}

function viewActiveInactiveSessions(token: string, quizId: number) {
  // throwTokenError(token);
  // let quiz = throwQuizError(token, quizId)
  const data = getData();
  let sessionActiveSessions = data.sessions.filter(ele => ele.quiz.quizId === quizId && ele.state !== 'END').map(ele => ele.sessionId);
  sessionActiveSessions = sessionActiveSessions.sort((a, b) => a - b);
  let sessionInActiveSessions = data.sessions.filter(ele => ele.quiz.quizId === quizId && ele.state === 'END').map(ele => ele.sessionId);
  sessionInActiveSessions = sessionInActiveSessions.sort((a, b) => a - b);
  const result = {
    activeSessions: sessionActiveSessions,
    inactiveSessions: sessionInActiveSessions
  };
  return result;
}
export {
  sessionStart,
  sessionPlayerJoin,
  sessionUpdateState,
  sessionGetStatus,
  sessionPlayerStatus,
  sessionPlayerQuestionInfo,
  sessionPlayerAnswerSubmit,
  sessionPlayerQuestionResults,
  sessionFinalResults,
  updateThumbnail,
  viewActiveInactiveSessions
};
