import request from 'sync-request-curl';
import config from './../config.json';
import { IncomingHttpHeaders } from 'http';
import HTTPError from 'http-errors';
import { getData } from '../dataStore';
const port = config.port;
const url = config.url;

// ------------ GENERAL HTTP WRAPPERS ------------------
// NOTE:
// In these functions, we return res instead of JSON.parse(String(res.body))
// This is done so we have access to and can also test the status code
// Make sure you json parse the response body before testing return object

export function getMethod(route: string, qs: any, headers?: any) {
  const res = request(
    'GET',
    `${url}:${port}${route}`,
    {
      qs,
      timeout: 5000,
      headers,
    }
  );

  return res;
}

export function postMethod(route: string, json: any, headers?: any) {
  const res = request(
    'POST',
      `${url}:${port}${route}`,
      {
        json,
        timeout: 5000,
        headers,
      }
  );

  return res;
}

export function putMethod(route: string, json: any, headers?: any) {
  const res = request(
    'PUT',
      `${url}:${port}${route}`,
      {
        json,
        timeout: 5000,
        headers,
      }
  );

  return res;
}

export function deleteMethod(route: string, qs: any, headers?: any) {
  const res = request(
    'DELETE',
    `${url}:${port}${route}`,
    {
      qs,
      timeout: 5000,
      headers,
    }
  );

  return res;
}

// just for debugging printing
function colorizeHTTPMethod(method:any) {
  switch (method.toUpperCase()) {
    case 'POST':
      return `\x1b[32m${method}\x1b[0m`; // Green for POST
    case 'PUT':
      return `\x1b[33m${method}\x1b[0m`; // Yellow for PUT
    case 'GET':
      return `\x1b[36m${method}\x1b[0m`; // Cyan for GET
    case 'DELETE':
      return `\x1b[31m${method}\x1b[0m`; // Red for DELETE
    default:
      return method; // No coloring for other methods
  }
}

// just for debugging printing
function formatNumberWithGreenLastThreeDigits(number:any) {
  const strNumber = String(number);
  const lastThreeDigits = strNumber.slice(-4);

  // Wrap the last three digits in ANSI escape codes for green color
  const formattedNumber = strNumber.slice(0, -4) + `\x1b[32m${lastThreeDigits}\x1b[0m`;

  return formattedNumber;
}

export function requestMethod (method: any, route: string, payload: any, headers: IncomingHttpHeaders = {}, timeout = 50000) {
  let qs = {};
  let json = {};
  if (['GET', 'DELETE'].includes(method.toUpperCase())) {
    // GET/DELETE
    qs = payload;
  } else {
    // PUT/POST
    json = payload;
  }

  // debug
  // const methodCall = `Calling \x1b[32m${colorizeHTTPMethod(method)} - ${url}:${port}${route}\x1b[0m.`.padEnd(120, ' ');
  // const timeStamp = `Time = ${formatNumberWithGreenLastThreeDigits(new Date().getTime())}`;
  // console.log(methodCall + timeStamp);
  // console.log(`Payload = ${JSON.stringify(payload)}.\nHeaders = ${JSON.stringify(headers)}.`);
  // end

  const res = request(method.toUpperCase(), `${url}:${port}${route}`, { qs, json, headers, timeout: timeout });

  let responseBody: any;
  try {
    responseBody = JSON.parse(res.body as string);
  } catch (err: any) {
    if (res.statusCode === 200) {
      // console.log(JSON.stringify(res));
      // console.log(JSON.stringify(res.body));
      throw HTTPError(500,
        `Non-jsonifiable body despite code 200: '${res.body}'.\nCheck that you are not doing res.json(undefined).'`
      );
    }
    responseBody = { error: `Failed to parse JSON: '${err.message}'` };
  }

  const errorMessage = `[${res.statusCode}] ` + responseBody?.error || responseBody || 'Error, no message specified!';

  if (res.statusCode !== 200) {
    // console.log(`\x1b[31mFailed to call\x1b[0m \x1b[32m${colorizeHTTPMethod(method)} - ${url}:${port}${route}\x1b[0m.`.padEnd(120, ' '));
    // console.log(`Payload = ${JSON.stringify(payload)}.\nHeaders = ${JSON.stringify(headers)}.`);
    // console.log(`DB = \x1b[33m${JSON.stringify(getData())}\x1b[0m`);
    throw HTTPError(res.statusCode, errorMessage);
  }

  return responseBody;
}

export function sleepSync(duration: number) {
  // console.log(`we just called sleepsync for ${duration}`)
  const startTime = Date.now();
  while (Date.now() - startTime < duration) {
    // This loop will keep running until 'duration' milliseconds have passed.
    // This creates the effect of blocking execution for 'duration' milliseconds.
  }
}

// ----------------------------------------
