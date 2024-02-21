# Iteration 1 assumptions

1. A user can't see other users' quizzes.
2. Users remain logged in (there is no specification for a log-out function).
3. Whitespace is allowed as a character in a password when registering a new admin user.
4. Having just spaces is allowed as a quiz name, as long as it's between 3 and 30 characters long.
5. Users cannot delete/remove their accounts. This means that once a user is registered, the only
way it can be removed from the data store is through running the clear function, which removes all users.
6. When registering, the email is case-insensitive. This means that a client can register themselves as "user123@gmail.com" or "UsEr123@gmail.com", and it would be the same.
7. All users are admin and can create quizzes.
8. The user must be "logged in" before doing anything such as creating quizzes (although they are auto logged-in upon registration).

# Iteration 2 assumptions

1. Quizzes in trash can still be edited, including all question operators such as quiz question update, create, duplicate, delete, etc.
2. If a quiz is created, then sent to trash, another quiz with the same name cannot be created.
3. If duplicating a question results in the duration of the quiz exceeding 3 minutes, then the duplicate function should return an error.
4. The answer colours for a duplicated question is same as the old question.
5. A quiz's timeLastEdited is updated even for operations not specified in the spec such as quiz transfer and restore quiz from trash.

# Iteration 3 assumptions

1. Questions duration should be greater than 0.1 seconds 