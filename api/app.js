const createError = require("http-errors");
const express = require("express");
const logger = require("morgan");
const cors = require("cors");

const authRouter = require("./routes/google-auth");
const usersRouter = require("./routes/users");
const createLobby = require("./routes/createLobby");
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
app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", authRouter);
app.use("/", authRouter);
app.use("/users", usersRouter);
app.use("/api/create-lobby", createLobby);
app.use("/api/home", homeRouter);
app.use("/api/lobby", lobbyRoutes);

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
