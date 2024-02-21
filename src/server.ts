import express, { json, Request, Response } from 'express';
import { echo } from './echo';
import { clear } from './other';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';

import {
  adminAuthLogout, v2adminAuthLogout,
  adminAuthRegister, adminAuthLogin, adminUserDetails, v2adminUserDetails, putAdminUserDetails, v2putAdminUserDetails, adminUserPassword, v2adminUserPassword
} from './auth';
import {
  adminQuizFinalResults, adminQuizFinalResultsCSV,
  adminQuizList, v2adminQuizList, adminQuizCreate, v2adminQuizCreate, adminQuizRemove, v2adminQuizRemove, adminQuizInfo, v2adminQuizInfo, adminQuizNameUpdate, v2adminQuizNameUpdate, adminQuizDescriptionUpdate, v2adminQuizDescriptionUpdate, adminQuizTransfer, v2adminQuizTransfer, adminQuizQuestionCreate, v2adminQuizQuestionCreate, adminQuizQuestionUpdate, v2adminQuizQuestionUpdate, adminQuizQuestionDelete, v2adminQuizQuestionDelete, adminQuizQuestionMove, v2adminQuizQuestionMove, adminQuizQuestionDuplicate, v2adminQuizQuestionDuplicate
} from './quiz';

import { adminTrashView, v2adminTrashView, adminTrashRestore, v2adminTrashRestore, adminTrashDelete, v2adminTrashDelete } from './trash';
import HTTPError from 'http-errors';

import { viewActiveInactiveSessions, sessionPlayerAnswerSubmit, sessionPlayerQuestionResults, sessionStart, sessionPlayerQuestionInfo, sessionPlayerJoin, sessionUpdateState, sessionGetStatus, updateThumbnail, sessionPlayerStatus, sessionFinalResults } from './player';

import { chatViewMessages, chatSendMessage } from './chat';
const path = require('path');
// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for producing the docs that define the API
const file = fs.readFileSync('./swagger.yaml', 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
// app.use('/docs', sui.serve, sui.setup(YAML.parse(file), { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));

export const PORT: number = parseInt(process.env.PORT || config.port);
export const HOST: string = process.env.IP || 'localhost';
// for logging errors (print to terminal)
app.use(morgan('dev'));
// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request

app.get('/echo', (req: Request, res: Response) => {
  const data = req.query.echo as string;
  const response = echo(data);
  return res.json(response);
});

// clear
app.delete('/v1/clear', (req: Request, res: Response) => {
  const response: any = clear();
  res.json(response);
});

// adminQuizCreate (Iteration 1)
app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const name = req.body.name as string;
  const description = req.body.description as string;
  const response: any = adminQuizCreate(token, name, description);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  return res.json(response);
});

// adminQuizCreate (Iteration 1)
app.post('/v2/admin/quiz', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const name = req.body.name as string;
  const description = req.body.description as string;
  const response: any = v2adminQuizCreate(token, name, description);

  // if (response.error === 'Token is not in a valid structure') {
  //   return res.status(401).json(response);
  // }
  // if (response.error === 'User is not currently logged in') {
  //   return res.status(403).json(response);
  // }
  // if ('error' in response) {
  //   return res.status(400).json(response);
  // }

  return res.json(response);
});

// adminTrashView (Iteration 2)
app.get('/v1/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.query.token as string;

  const response:any = adminTrashView(token);
  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }

  res.json(response);
});

// adminTrashView (Iteration 2)
app.get('/v2/admin/quiz/trash', (req: Request, res: Response) => {
  const token: string | string[] = req.headers.token;

  const response: any = v2adminTrashView(token);

  return res.json(response);
});

// adminAuthRegister
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  const email = req.body.email as string;
  const password = req.body.password as string;
  const nameFirst = req.body.nameFirst as string;
  const nameLast = req.body.nameLast as string;

  /// /console.log(`${email}, ${password}, ${nameFirst}, ${nameLast}, `)
  const response:any = adminAuthRegister(email, password, nameFirst, nameLast);

  if ('error' in response) {
    return res.status(400).json(response);
  }
  res.status(200).json(response);
});

// adminAuthLogin
app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const email = req.body.email as string;
  const password = req.body.password as string;
  const response:any = adminAuthLogin(email, password);

  if ('error' in response) {
    return res.status(400).json(response);
  }
  res.status(200).json(response);
});

// ----------------------- ITERATION 1 FUNCTIONS ------------------------

// adminUserDetails
app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const response:any = adminUserDetails(token);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }

  res.json(response);
});

// adminUserDetails
app.get('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const response:any = v2adminUserDetails(token);
  return res.json(response);
});

// adminQuizList
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const response:any = adminQuizList(token);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }

  res.status(200).json(response);
});

// adminQuizList
app.get('/v2/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  const response:any = v2adminQuizList(token);
  res.json(response);
});

// adminQuizRemove
app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token } = JSON.parse(JSON.stringify(req.query));

  const response: any = adminQuizRemove(token, quizId);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }
  return res.status(200).json(response);
});

// adminQuizRemove
app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token: string | string[] = req.headers.token;

  const response: any = v2adminQuizRemove(token, quizId);

  return res.json(response);
});
// adminQuizInfo
app.get('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.query.token as string;

  const response:any = adminQuizInfo(token, quizId);
  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.json(response);
});

// adminQuizNameUpdate
app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.body.token as string;
  const name = req.body.name as string;

  const response:any = adminQuizNameUpdate(token, quizId, name);
  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.json(response);
});

// adminQuizInfo
app.get('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token: string | string[] = req.headers.token;

  const response: any = v2adminQuizInfo(token, quizId);

  return res.json(response);
});

// adminQuizNameUpdate
app.put('/v2/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token: string | string[] = req.headers.token;
  const name = req.body.name as string;

  const response: any = v2adminQuizNameUpdate(token, quizId, name);

  return res.json(response);
});

// adminQuizDescriptionUpdate
app.put('/v1/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.body.token as string;
  const description = req.body.description as string;
  const response:any = adminQuizDescriptionUpdate(quizId, token, description);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.status(200).json(response);
});

// adminQuizDescriptionUpdate
app.put('/v2/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token: string | string[] = req.headers.token;
  const description = req.body.description as string;

  const response:any = v2adminQuizDescriptionUpdate(quizId, token, description);
  res.json(response);
});

// ----------------------- ITERATION 2 FUNCTIONS ------------------------

// adminAuthLogout
app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const response:any = adminAuthLogout(token);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.json(response);
});

app.post('/v2/admin/auth/logout', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const response:any = v2adminAuthLogout(token);

  return res.json(response);
});

// putAdminUserDetails
app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const email = req.body.email as string;
  const nameFirst = req.body.nameFirst as string;
  const nameLast = req.body.nameLast as string;

  const response:any = putAdminUserDetails(token, email, nameFirst, nameLast);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.json(response);
});

// putAdminUserDetails
app.put('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const email = req.body.email as string;
  const nameFirst = req.body.nameFirst as string;
  const nameLast = req.body.nameLast as string;

  const response:any = v2putAdminUserDetails(token, email, nameFirst, nameLast);
  return res.json(response);
});

// adminUserPassword
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const oldPassword = req.body.oldPassword as string;
  const newPassword = req.body.newPassword as string;
  const response:any = adminUserPassword(token, oldPassword, newPassword);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.json(response);
});
// adminUserPassword
app.put('/v2/admin/user/password', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const oldPassword = req.body.oldPassword as string;
  const newPassword = req.body.newPassword as string;

  const response:any = v2adminUserPassword(token, oldPassword, newPassword);
  return res.json(response);
});

// adminTrashRestore
app.post('/v1/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.body.token as string;

  const response:any = adminTrashRestore(token, quizId);
  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.json(response);
});

// adminTrashDelete
app.delete('/v1/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token: string = req.query.token as string;
  const quizIds: number[] = JSON.parse(decodeURIComponent(req.query.quizIds as string));

  const response: any = adminTrashDelete(token, quizIds);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.json(response);
});

// adminTrashRestore
app.post('/v2/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token: string | string[] = req.headers.token;

  const response: any = v2adminTrashRestore(token, quizId);

  return res.json(response);
});

// adminTrashDelete
app.delete('/v2/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token: string | string[] = req.headers.token;
  const quizIds: number[] = JSON.parse(decodeURIComponent(req.query.quizIds as string));

  const response: any = v2adminTrashDelete(token, quizIds);

  return res.json(response);
});

// adminQuizTransfer
app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.body.token as string;
  const userEmail = req.body.userEmail as string;

  const response:any = adminQuizTransfer(token, quizId, userEmail);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.status(200).json(response);
});

app.post('/v2/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const userEmail = req.body.userEmail as string;

  const response:any = v2adminQuizTransfer(token, quizId, userEmail);
  return res.json(response);
});

// adminQuizQuestionCreate
app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.body.token as string;
  const questionBody = req.body.questionBody as any;
  const response:any = adminQuizQuestionCreate(quizId, token, questionBody);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  return res.json(response);
});

app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const questionBody = req.body.questionBody as any;
  const response:any = v2adminQuizQuestionCreate(quizId, token, questionBody);

  return res.json(response);
});

// adminQuizQuestionUpdate
app.put('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.body.token as string;
  const questionBody = req.body.questionBody as any;
  const response:any = adminQuizQuestionUpdate(quizId, questionId, token, questionBody);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.status(200).json(response);
});

// adminQuizQuestionUpdate
app.put('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token: string | string[] = req.headers.token;
  const questionBody = req.body.questionBody as any;
  const response:any = v2adminQuizQuestionUpdate(quizId, questionId, token, questionBody);
  return res.json(response);
});

// adminQuizQuestionDelete
app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.query.token as string;
  const response :any = adminQuizQuestionDelete(quizId, questionId, token);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.status(200).json(response);
});

// adminQuizQuestionDelete
app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token: string | string[] = req.headers.token;
  const response :any = v2adminQuizQuestionDelete(quizId, questionId, token);
  res.json(response);
});

// adminQuizQuestionMove
app.put('/v1/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const token:string = req.body.token as string;
  const newPosition:number = req.body.newPosition;
  const quizId :number = parseInt(req.params.quizid);
  const questionId:number = parseInt(req.params.questionid);

  const response:any = adminQuizQuestionMove(quizId, questionId, token, newPosition);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.status(200).json(response);
});

// v2adminQuizQuestionMove
app.put('/v2/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const token:string = req.headers.token as string;
  const newPosition:number = req.body.newPosition;
  const quizId :number = parseInt(req.params.quizid);
  const questionId:number = parseInt(req.params.questionid);

  const response:any = v2adminQuizQuestionMove(quizId, questionId, token, newPosition);

  return res.json(response);
});

// adminQuizQuestionDuplicate
app.post('/v1/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);

  const response:any = adminQuizQuestionDuplicate(quizId, questionId, token);

  if (response.error === 'Token is not in a valid structure') {
    return res.status(401).json(response);
  }
  if (response.error === 'User is not currently logged in') {
    return res.status(403).json(response);
  }
  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.status(200).json(response);
});

app.post('/v2/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);

  const response:any = v2adminQuizQuestionDuplicate(quizId, questionId, token);

  return res.json(response);
});

// ----------------------- ITERATION 3 FUNCTIONS ------------------------
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/csv', express.static(path.join(__dirname, '..', 'csv')));

app.post('/v1/player/join', (req: Request, res: Response) => {
  const sessionId = parseInt(req.body.sessionId);
  const name = req.body.name;
  const response: any = sessionPlayerJoin(sessionId, name);
  return res.json(response);
});

// sessionPlayerStatus
app.get('/v1/player/:playerid', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  const response: any = sessionPlayerStatus(playerId);
  return res.json(response);
});

app.get('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const response: any = chatViewMessages(playerId);

  return res.json(response);
});

app.post('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const msg: string = req.body.message;
  const response: any = chatSendMessage(playerId, msg);

  return res.json(response);
});

app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const imgUrl = req.body.imgUrl;
  const token: string | string[] = req.headers.token;

  const response: any = updateThumbnail(quizId, token, imgUrl);
  return res.json(response);
});

app.get('/v1/admin/quiz/:quizid/sessions', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const response: any = viewActiveInactiveSessions(token, quizId);
  console.log(`response = ${JSON.stringify(response)}`);
  return res.json(response);
});

app.post('/v1/admin/quiz/:quizid/session/start', (req: Request, res:Response) => {
  const quizId = parseInt(req.params.quizid);
  const token: string | string[] = req.headers.token;
  const autoStartNum = req.body.autoStartNum;

  const response: any = sessionStart(quizId, token, autoStartNum);
  // if (response.error === 'Token is not in a valid structure') {
  //   //throw HTTPError(401, response.error);
  //   return res.status(401).json(response);
  // }
  // if (response.error === 'User is not currently logged in') {
  //   //throw HTTPError(403, response.error)
  //   return res.status(403).json(response);
  // }
  // if ('error' in response) {
  //   //throw HTTPError(400, response.error)
  //   return res.status(400).json(response);
  // }
  return res.json(response);
});

app.put('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res:Response) => {
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const token: string | string[] = req.headers.token;
  const action = req.body.action;

  const response: any = sessionUpdateState(quizId, sessionId, token, action);
  return res.json(response);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res:Response) => {
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const token: string | string[] = req.headers.token;

  const response: any = sessionGetStatus(quizId, sessionId, token);
  return res.json(response);
});

app.get('/v1/player/:playerid/question/:questionposition', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);
  const response: any = sessionPlayerQuestionInfo(playerId, questionPosition);
  return res.json(response);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid/results', (req: Request, res:Response) => {
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const token: string | string[] = req.headers.token;

  const response: any = adminQuizFinalResults(quizId, sessionId, token);
  return res.json(response);
});
app.get('/v1/admin/quiz/:quizid/session/:sessionid/results/csv', (req: Request, res: Response) => {
  const sessionId = parseInt(req.params.sessionid);
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const response: any = adminQuizFinalResultsCSV(token, sessionId, quizId);
  return res.json(response);
});

app.put('/v1/player/:playerid/question/:questionposition/answer', (req: Request, res: Response) => {
  const answerIds = (req.body.answerIds as string);
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);

  const response: any = sessionPlayerAnswerSubmit(answerIds, playerId, questionPosition);

  return res.json(response);
});

app.get('/v1/player/:playerid/question/:questionposition/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);

  const response: any = sessionPlayerQuestionResults(playerId, questionPosition);

  return res.json(response);
});

app.get('/v1/player/:playerid/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  const response: any = sessionFinalResults(playerId);

  return res.json(response);
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

// For handling errors
app.use(errorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
