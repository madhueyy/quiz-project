import { getData, setData } from './dataStore';

import { getUNIXTime, findSessionOfPlayer } from './helper';
import HTTPError from 'http-errors';
import request from 'sync-request';
import fs from 'fs';
const path = require('path');
import { PORT, HOST } from './server';
import { ChatBody, MessageBody, Session } from './types';

/**
 * @param {number} playerId
 * @returns { messages: [
 *  {
 *    messageBody: string,
 *    playerId: number,
 *    playerName: string,
 *    timeSent: number
 *  }
 * ] }
 */
// Returns all messages that are in the same session as the player
export const chatSendMessage = (playerId: number, message: any) => {
  const data = getData();

  const sessionInfo = findSessionOfPlayer(playerId);
  const sessionIdOfPlayer = sessionInfo[0];
  const playerName = sessionInfo[1];
  if (sessionIdOfPlayer === null || playerName === null) {
    throw HTTPError(400, 'Player ID does not exist.');
  }

  if (message.messageBody.length > 100 || message.messageBody.length < 1) {
    throw HTTPError(400, 'Message body must not be shorter than 1, or longer than 100');
  }

  // otherwise, successfull. no err.Id
  data.sessions[data.sessions.findIndex((ele: Session) => ele.sessionId === sessionIdOfPlayer)].chat.push({
    messageBody: message.messageBody,
    playerId: playerId,
    playerName: playerName,
    timeSent: getUNIXTime()
  });

  setData(data);
};

/**
 * @param {number} playerId
 * @returns {}
 */
// Sends a new chat message to everyone in the session
export const chatViewMessages = (playerId : number) => {
  const data = getData();

  const sessionInfo = findSessionOfPlayer(playerId);
  const sessionIdOfPlayer = sessionInfo[0];
  const playerName = sessionInfo[1];
  if (sessionIdOfPlayer === null || playerName === null) {
    throw HTTPError(400, 'Player ID does not exist.');
  }

  // let sesh = data.sessions.find(ele=>ele.sessionId === sessionIdOfPlayer)
  // console.log()
  const chatLogs = data.sessions.find((ele: Session) => ele.sessionId === sessionIdOfPlayer).chat;

  return {
    messages: chatLogs
  };
};

// export const chatViewMessages = ()
