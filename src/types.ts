interface ErrorString {
    error: string;
}

interface BoolError {
  error: boolean;
}

interface TokenObject {
  token: string;
  userId: number;
}

interface QuizObject {
  creatorId: number;
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: Partial<
    {
      questionId: number;
      question: string;
      duration: number;
      points: number;
      answers: {
        answerId: number;
        answer: string;
        colour: string;
        correct: boolean;
      }[];
    }[]
  >;
  duration: number;
  isTrash: boolean;
}

interface NewUser {
  nameFirst: string,
  nameLast: string,
  email: string,
  password: string,
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number,
  authUserId: number,
  isLoggedIn: boolean,
  quizzesCreated: number[],
}

export interface NewUserWithPassHash {
  nameFirst: string,
  nameLast: string,
  email: string,
  passwordHash: string,
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number,
  authUserId: number,
  isLoggedIn: boolean,
  quizzesCreated: number[],
}

interface UserType {
  email: string;
  password: string;
  nameFirst: string;
  nameLast: string;
}

interface QuizType {
  token: string;
  name: string;
  description: string;
}

interface TrashListReturnType {
  quizzes: [
    {
      quizId: number;
      name: string;
    }
  ];
}

interface SingleAnswerType {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

interface SingleQuestionType {
  questionId: number;
  question: string;
  duration: number;
  points: number;
  answers: SingleAnswerType[];
}

interface SingleQuizType {
  creatorId: number;
  name: string;
  description: string;
  quizId: number;
  timeCreated: number;
  timeLastEdited: number;
  quizQuestions: SingleQuestionType[];
  isTrash: boolean;
}

interface ReturnAdminUserDetails {
  user: {
    userId: number,
    name: string,
    email: string,
    numSuccessfulLogins: number,
    numFailedPasswordsSinceLastLogin: number
  }
}

interface ReturnAdminQuizList {
  quizzes: Partial<{ quizId: number; name: string }>[];
}

interface ReturnQuizCreate {
  quizId: number;
}

interface ReturnQuizQuestionCreate {
  questionId: number;
}

interface DuplicateQuizQuestionCreate{
  newQuestionId: number;
}

type EmptyObject = Record<string, never>;

interface ReturnAdminAuthLogin {
  token: string
}

interface ReturnAdminAuthRegister {
  token: string
}

interface QuizInfoReturnType {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: {
    questionId: number;
    question: string;
    duration: number;
    thumbnailUrl: number;
    points: number;
    answers: {
      answerId: number;
      answer: string;
      colour: string;
      correct: boolean;
    }[];
  }[];
  duration: number; // Add the 'duration' property to the interface
}

interface QuestionCreateBody {

    question: string;
    duration: number;
    points: number;
    answers: [{answer: string, correct: boolean}];

}

interface QuestionBody {
  question: string;
  duration: number;
  points: number;
  answers: [{answer: string, correct: boolean}];
}

export interface ChatBody {
  messageBody: string;
  playerId: number;
  playerName: string;
  timeSent: number;
}

export interface MessageBody {
  messages: [ChatBody];
}

interface QuizAnswer {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

interface QuizQuestion {
  questionId: number;
  question: string;
  duration: number;
  thumbnailUrl: string;
  points: number;
  answers: QuizAnswer[];
}

interface Quiz {
  creatorId: number;
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: QuizQuestion[];
  duration: number;
  thumbnailUrl: string;
  thumbnailPath: string;
  isTrash: boolean;
}

interface Player {
  name: string;
  playerId: number;
}

interface PlayerResponse {
  playerId: number;
  answerId: number;
  timesubmitted: number;
  score: number;
}

interface QuestionResponse {
  questionId: number;
  playerResponses: PlayerResponse[];
}

interface ChatMessage {
  messageBody: string;
  playerId: number;
  playerName: string;
  timeSent: number;
}

export interface Session {
  sessionId: number;
  quiz: Quiz;
  state: string;
  startTime: number;
  atQuestion: number;
  questionNumber: number;
  autoStartNum: number;
  players: Player[];
  questionsGoneThrough: number[];
  questionResponses: QuestionResponse[];
  chat: ChatMessage[];
}

export { ErrorString, QuestionCreateBody, DuplicateQuizQuestionCreate, ReturnQuizQuestionCreate, ReturnAdminUserDetails, ReturnAdminQuizList, ReturnQuizCreate, EmptyObject, QuizInfoReturnType, ReturnAdminAuthLogin, ReturnAdminAuthRegister, NewUser, TokenObject, BoolError, TrashListReturnType, SingleAnswerType, SingleQuestionType, SingleQuizType, UserType, QuizType, QuestionBody, QuizObject };
