// @ts-nocheck
// @ts-ignore
import { setData, getData, clearAllTimers } from './dataStore';
import { sleepSync } from './tests/test-helper';
import fs from 'fs';
const path = require('path');

function clearFolder(folderName) {
  const folderPath = path.join(__dirname, '..', folderName);

  /* istanbul ignore next */
  if (fs.existsSync(folderPath) === false) {
    /* istanbul ignore next */
    fs.mkdirSync(folderPath, (err) => {
      console.log(`err: ${err}`);
    });
  } else {
    const files = fs.readdirSync(folderPath);

    files.forEach((file) => {
      const fileFullPath = path.join(folderPath, file);
      fs.unlinkSync(fileFullPath);
      // console.log(`Deleted file ${fileFullPath}`)
    });
  }
}

/**
 *
 * @returns { }
 */
// Reset the state of the application back to the start.
function clear() {
  // let time = new Date().getTime();

  clearAllTimers();

  setData({
    tokens: [],
    users: [],
    quizzes: [],
    sessions: [],
    images: []
  });

  clearFolder('images');
  clearFolder('csv');

  return { };
}

export { clear };
