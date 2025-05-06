const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');

const authRouter = require('./routes/google-auth');
const usersRouter = require('./routes/users');
const createLobby = require('./routes/categories');
const home = require('./routes/home');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/auth', authRouter);
app.use('/', authRouter);
app.use('/users', usersRouter);
app.use('/create-lobby', createLobby);
app.use('/home', home)

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500
    }
  });
});

module.exports = app;
