import { getData, setData } from './dataStore';
import { hasNumber, hasLetter, getUserWithEmail, getUser, getRandomNumber, checkAllowedSpecialCharacters, checkTokenError, throwTokenError, sha256 } from './helper';
import validator from 'validator';
import { ErrorString, ReturnAdminUserDetails, EmptyObject, ReturnAdminAuthLogin, NewUser, TokenObject, NewUserWithPassHash } from './types';
import HTTPError from 'http-errors';

const NAME_MAX_LENGTH = 20;
const NAME_MIN_LENGTH = 2;
const PASSWORD_MIN_LENGTH = 8;

// ----------------------- ITERATION 1 export functionS ------------------------

/**
 * @param {string} email
 * @param {string} password
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {error: string} on invalid details
 * @returns {null} on valid details
 */
// Called from adminAuthRegister.
// Checks if the parameters passed describes a valid registration.
export function validAdminAuthRegister(email: string, password: string, nameFirst: string, nameLast: string): ErrorString {
  const data = getData();

  // Check if email is used by another user
  for (const user of data.users) {
    if (user.email === email) {
      // const str = data.users.map(user=>`User is ${user.email}. `)
      console.log(`email reg to another user. email = ${email} dbjsn  = ${JSON.stringify(data)}`);
      return {
        error: 'Email is already registered to another user.' // + str,
      };
    }
  }

  // npm js validator.isEmail test
  if (validator.isEmail(email) === false) {
    return {
      error: 'Email is not a valid email (validator.isEmail).'
    };
  }

  // NameFirst or nameLast contains characters other than lowercase letters,
  // uppercase letters, spaces, hyphens, or apostrophes
  if (checkAllowedSpecialCharacters(nameFirst) === false) {
    return {
      error: 'First name contains disallowed special characters'
    };
  }

  if (checkAllowedSpecialCharacters(nameLast) === false) {
    return {
      error: 'Last name contains disallowed special characters'
    };
  }

  // NameFirst or NameLast is less than 2 characters or more than 20 characters
  if (nameFirst.length > NAME_MAX_LENGTH || nameFirst.length < NAME_MIN_LENGTH) {
    return {
      error: 'First Name must be between 2 and 20 characters long inclusive.'
    };
  }

  if (nameLast.length > NAME_MAX_LENGTH || nameLast.length < NAME_MIN_LENGTH) {
    return {
      error: 'Last Name must be between 2 and 20 characters long inclusive.'
    };
  }

  // Password is less than 8 characters
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      error: 'Password must be at least 8 characters long.'
    };
  }

  // Password does not contain at least one number and at least one letter
  if ((hasNumber(password) && hasLetter(password)) === false) {
    return {
      error: 'Password must contain at least 1 number and 1 letter.'
    };
  }

  // Valid = true.
  return { error: 'none' };
}

/**
 * @param {string} email
 * @param {string} password
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {error: string} on error
 * @returns {token: string}
 */
// Register a user with an email, password, and names,
// then return their authUserId value.
export function adminAuthRegister(email: string, password: string, nameFirst: string, nameLast: string) {
  const valid = validAdminAuthRegister(email, password, nameFirst, nameLast);
  if (valid.error !== 'none') {
    // if validAdminAuthRegister does not return true, it returns {error: string }
    return { error: valid.error };
  }

  // generating authUserId
  let authUserId = 100000;
  const data = getData();
  const existingAuthUserIds = [];
  for (const user of data.users) {
    existingAuthUserIds.push(user.authUserId);
  }

  if (existingAuthUserIds.length !== 0) {
    // we set it to the last authUserId in arr, for optimisation.
    // still need to ensure the authUserId doesn't exist, in case
    // data.users gets shuffled by another export function
    authUserId = existingAuthUserIds[existingAuthUserIds.length - 1];
    while (existingAuthUserIds.includes(authUserId) === true) {
      authUserId += 1;
    }
  }

  const newUser: NewUserWithPassHash = {
    nameFirst: nameFirst,
    nameLast: nameLast,
    email: email,
    passwordHash: sha256(password),
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
    authUserId: authUserId,
    isLoggedIn: true,
    quizzesCreated: [],
  };

  // Creating a token-authUserId pair
  const token: string = getRandomNumber(100000, 999999).toString();

  // Modifying datastore
  data.users.push(newUser);
  data.tokens.push({ token: token, userId: authUserId });
  setData(data);

  return {
    token: token
  };
}

/**
 * @param {string} email
 * @param {string} password
 * @returns {error: string} on error
 * @returns {token: string}
 */
// Given a registered user's email and password returns their authUserId value.
export function adminAuthLogin(email: string, password: string): ReturnAdminAuthLogin | ErrorString {
  const data = getData();

  // Checking user exists with email
  const user: NewUserWithPassHash = getUserWithEmail(email);
  if (!user) {
    return {
      error: 'Login failed. There is no user with that email.'
    };
  }

  const indexOfUser = data.users.findIndex((user: NewUserWithPassHash) => user.email === email);

  // Checking password matches to user
  if (user.passwordHash !== sha256(password)) {
    data.users[indexOfUser].numFailedPasswordsSinceLastLogin += 1;
    setData(data);

    return {
      error: 'Login failed. Email and password do not match.'
    };
  }

  // Resetting/incrementing user fields
  data.users[indexOfUser].isLoggedIn = true;
  data.users[indexOfUser].numSuccessfulLogins += 1;
  data.users[indexOfUser].numFailedPasswordsSinceLastLogin = 0;

  // Creating a token-authUserId pair
  const token: string = getRandomNumber(100000, 999999).toString();

  // Modifying datastore
  data.tokens.push({ token: '150000', userId: 99 });
  data.tokens.push({ token: token, userId: getUserWithEmail(email).authUserId });
  setData(data);

  return {
    token: token
  };
}

/**
 * @param {string} token
 * @returns {user:
*              {
  *                  userId: number,
  *                  name: string,
  *                  email: string,
  *                  numSuccessfulLogins: number,
  *                  numFailedPasswordsSinceLastLogin: number
  *              }
  *          }
  */
// Given an admin user's authUserId, return details about the user.
// "name" is the first and last name concatenated with a single
// space between them.
export function v2adminUserDetails(token: string): ReturnAdminUserDetails | ErrorString {
  // Error 401/403
  throwTokenError(token);

  const data = getData();
  const tokenObject = data.tokens.find((ele: TokenObject) => ele.token === token);

  const authUserId: number = tokenObject.userId;
  const authUser = getUser(authUserId);

  // Create an object with user details
  const userDetails = {
    userId: authUser.authUserId,
    name: `${authUser.nameFirst} ${authUser.nameLast}`,
    email: authUser.email,
    numSuccessfulLogins: authUser.numSuccessfulLogins,
    numFailedPasswordsSinceLastLogin: authUser.numFailedPasswordsSinceLastLogin,
  };

  return {
    user: userDetails
  };
}

export function adminUserDetails(token: string): ReturnAdminUserDetails | ErrorString {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const tokenObject = data.tokens.find((ele: TokenObject) => ele.token === token);

  const authUserId: number = tokenObject.userId;
  const authUser = getUser(authUserId);

  // Create an object with user details
  const userDetails = {
    userId: authUser.authUserId,
    name: `${authUser.nameFirst} ${authUser.nameLast}`,
    email: authUser.email,
    numSuccessfulLogins: authUser.numSuccessfulLogins,
    numFailedPasswordsSinceLastLogin: authUser.numFailedPasswordsSinceLastLogin,
  };

  return {
    user: userDetails
  };
}

// ----------------------- ITERATION 2 export functionS ------------------------

/**
 * @param {string} token
 * @returns {error: string} on error
 * @returns { }
 */
// Given a token, logs out the user using the userId of that token.
export function adminAuthLogout(token: string): EmptyObject | ErrorString {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error === 'User is not currently logged in') {
    return { error: 'user already logged out' };
  } else if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const tokenObject = data.tokens.find((ele: TokenObject) => ele.token === token);

  const authUserId: number = tokenObject.userId;

  // Remove token object from tokens
  data.tokens = data.tokens.filter((token: TokenObject) => token.userId !== tokenObject.userId);
  // Update email, nameFirst, nameLast to new values
  const indexOfUserInUsers = data.users.findIndex((user: NewUser) => user.authUserId === authUserId);
  data.users[indexOfUserInUsers].isLoggedIn = false;

  setData(data);
  return { };
}

/**
 * @param {string} token
 * @returns {error: string} on error
 * @returns { }
 */
// Given a token, logs out the user using the userId of that token.
export function v2adminAuthLogout(token: string): EmptyObject | ErrorString {
  // Error 401/403
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error === 'User is not currently logged in') {
    throw HTTPError(400, 'user already logged out');
  } else if (tokenError.error !== 'none') {
    throw HTTPError(401, tokenError.error);
  }
  const data = getData();
  const tokenObject = data.tokens.find((ele: TokenObject) => ele.token === token);

  const authUserId: number = tokenObject.userId;

  // Remove token object from tokens
  data.tokens = data.tokens.filter((token: TokenObject) => token.userId !== tokenObject.userId);
  // Update email, nameFirst, nameLast to new values
  const indexOfUserInUsers = data.users.findIndex((user: NewUser) => user.authUserId === authUserId);
  data.users[indexOfUserInUsers].isLoggedIn = false;

  setData(data);
  return { };
}

/**
 * @param {string} token
 * @param {string} email
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {error: string} on error
 * @returns { }
 */
// Given a set of properties, update those properties of this logged in admin user.
export function v2putAdminUserDetails(token: string, email: string, nameFirst: string, nameLast: string): EmptyObject | ErrorString {
  // Error 401/403
  throwTokenError(token);

  const data = getData();
  const tokenObject = data.tokens.find((ele: TokenObject) => ele.token === token);

  const authUserId: number = tokenObject.userId;

  // If the email being passed in already exists then return error.
  if ((getData().users.some((user: NewUser) => user.email === email))) {
    throw HTTPError(400, 'Email already in use');
  }

  // npm js validator.isEmail test
  if (validator.isEmail(email) === false) {
    throw HTTPError(400, 'Email is not a valid email (validator.isEmail).');
  }

  if (checkAllowedSpecialCharacters(nameFirst) === false) {
    throw HTTPError(400, 'First name contains disallowed special characters');
  }

  // NameLast contains characters other than lowercase letters, uppercase letters, spaces, hyphens, or apostrophes
  if (checkAllowedSpecialCharacters(nameLast) === false) {
    throw HTTPError(400, 'Last name contains disallowed special characters');
  }

  // NameFirst or NameLast is less than 2 characters or more than 20 characters
  if (nameFirst.length > NAME_MAX_LENGTH || nameFirst.length < NAME_MIN_LENGTH) {
    throw HTTPError(400, 'First Name must be between 2 and 20 characters long inclusive.');
  }

  // NameFirst or NameLast is less than 2 characters or more than 20 characters
  if (nameLast.length > NAME_MAX_LENGTH || nameLast.length < NAME_MIN_LENGTH) {
    throw HTTPError(400, 'Last Name must be between 2 and 20 characters long inclusive.');
  }

  // Update email, nameFirst, nameLast to new values
  const indexOfUserInUsers = data.users.findIndex((user: NewUser) => user.authUserId === authUserId);
  data.users[indexOfUserInUsers].email = email;
  data.users[indexOfUserInUsers].nameFirst = nameFirst;
  data.users[indexOfUserInUsers].nameLast = nameLast;

  setData(data);
  return { };
}

/**
 * @param {string} token
 * @param {string} email
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {error: string} on error
 * @returns { }
 */
// Given a set of properties, update those properties of this logged in admin user.
export function putAdminUserDetails(token: string, email: string, nameFirst: string, nameLast: string): EmptyObject | ErrorString {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const tokenObject = data.tokens.find((ele: TokenObject) => ele.token === token);

  const authUserId: number = tokenObject.userId;

  // If the email being passed in already exists then return error.
  if ((getData().users.some((user: NewUser) => user.email === email))) {
    return { error: 'Email already in use' };
  }

  // npm js validator.isEmail test
  if (validator.isEmail(email) === false) {
    return {
      error: 'Email is not a valid email (validator.isEmail).'
    };
  }

  if (checkAllowedSpecialCharacters(nameFirst) === false) {
    return {
      error: 'First name contains disallowed special characters'
    };
  }

  // NameLast contains characters other than lowercase letters, uppercase letters, spaces, hyphens, or apostrophes
  if (checkAllowedSpecialCharacters(nameLast) === false) {
    return {
      error: 'Last name contains disallowed special characters'
    };
  }

  // NameFirst or NameLast is less than 2 characters or more than 20 characters
  if (nameFirst.length > NAME_MAX_LENGTH || nameFirst.length < NAME_MIN_LENGTH) {
    return {
      error: 'First Name must be between 2 and 20 characters long inclusive.'
    };
  }

  // NameFirst or NameLast is less than 2 characters or more than 20 characters
  if (nameLast.length > NAME_MAX_LENGTH || nameLast.length < NAME_MIN_LENGTH) {
    return {
      error: 'Last Name must be between 2 and 20 characters long inclusive.'
    };
  }

  // Update email, nameFirst, nameLast to new values
  const indexOfUserInUsers = data.users.findIndex((user: NewUser) => user.authUserId === authUserId);
  data.users[indexOfUserInUsers].email = email;
  data.users[indexOfUserInUsers].nameFirst = nameFirst;
  data.users[indexOfUserInUsers].nameLast = nameLast;

  setData(data);
  return { };
}

/**
 * @param {string} token
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {error: string} on error
 * @returns { }
 */
// Given a token, oldPassword and newPassword, if conditions for newPassword met, change password
export function v2adminUserPassword(token: string, oldPassword: string, newPassword: string): EmptyObject | ErrorString {
  // Error 401/403
  throwTokenError(token);

  const data = getData();
  const tokenObject = data.tokens.find((ele: TokenObject) => ele.token === token);

  const authUserId: number = tokenObject.userId;
  const authUser = getUser(authUserId);

  if (sha256(oldPassword) !== authUser.passwordHash) {
    throw HTTPError(400, 'Old Password is not correct');
  }

  if (newPassword === oldPassword) {
    throw HTTPError(400, 'New Password and Old Passwords cannot be the same');
  }

  if (newPassword.length < 8) {
    throw HTTPError(400, 'New Password is lesser than 8 characters');
  }

  // Password does not contain at least one number and at least one letter
  if ((hasNumber(newPassword) && hasLetter(newPassword)) === false) {
    throw HTTPError(400, 'New Password must contain at least 1 number and 1 letter');
  }

  const indexOfUserInUsers = data.users.findIndex((user: NewUser) => user.authUserId === authUserId);
  data.users[indexOfUserInUsers].passwordHash = sha256(newPassword);

  setData(data);
  return { };
}

/**
 * @param {string} token
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {error: string} on error
 * @returns { }
 */
// Given a token, oldPassword and newPassword, if conditions for newPassword met, change password
export function adminUserPassword(token: string, oldPassword: string, newPassword: string): EmptyObject | ErrorString {
  // Error 401/403
  const tokenError : ErrorString = checkTokenError(token);
  if (tokenError.error !== 'none') {
    return { error: tokenError.error };
  }

  const data = getData();
  const tokenObject = data.tokens.find((ele: TokenObject) => ele.token === token);

  const authUserId: number = tokenObject.userId;
  const authUser = getUser(authUserId);

  if (sha256(oldPassword) !== authUser.passwordHash) {
    return { error: 'Old Password is not correct' };
  }

  if (newPassword === oldPassword) {
    return { error: 'New Password and Old Passwords cannot be the same' };
  }

  if (newPassword.length < 8) {
    return { error: 'New Password is lesser than 8 characters' };
  }

  // Password does not contain at least one number and at least one letter
  if ((hasNumber(newPassword) && hasLetter(newPassword)) === false) {
    return {
      error: 'New Password must contain at least 1 number and 1 letter.'
    };
  }

  const indexOfUserInUsers = data.users.findIndex((user: NewUser) => user.authUserId === authUserId);
  data.users[indexOfUserInUsers].passwordHash = sha256(newPassword);

  setData(data);
  return { };
}
