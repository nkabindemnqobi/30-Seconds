const express = require("express");
const logger = require("morgan");
const cors = require("cors");

const authRouter = require("./routes/google-auth");
const usersRouter = require("./routes/users");
const createLobby = require("./routes/createLobby");
const homeRouter = require("./routes/home");
const lobbyRoutes = require("./routes/lobby");
const roundRoutes = require("./routes/round");
const { errorHandler, notFound } = require("./middleware/error");

const app = express();
const notProduction = process.env.NODE_ENV.toLowerCase() !== "production";

if(notProduction) app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  allowedHeaders: "*",
  origin: process.env.ORIGIN,
  credentials: true,
}))

app.use("/api/auth", authRouter);
app.use("/", authRouter);
app.use("/users", usersRouter);
app.use("/api/create-lobby", createLobby);
app.use("/api/home", homeRouter);
app.use("/api/lobby", lobbyRoutes);
app.use("/api/round", roundRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
