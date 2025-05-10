const createError = require("http-errors");
const express = require("express");
const logger = require("morgan");
const cors = require("cors");

const authRouter = require("./routes/google-auth");
const lobbiesRouter = require("./routes/lobbies");
const usersRouter = require("./routes/users");
const createLobby = require("./routes/categories");
const homeRouter = require("./routes/home");
const lobbyRoutes = require("./routes/lobby");

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/auth", authRouter);
app.use("/", authRouter);
app.use("/users", usersRouter);
app.use("/create-lobby", createLobby);
app.use("/home", homeRouter);
app.use("/lobbies", lobbiesRouter);

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500,
    },
  });
});

module.exports = app;
