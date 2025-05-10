const express = require("express");
const path = require("path");

// const app = express();

const app = require("./api/app");

app.use("/static", express.static(path.resolve(__dirname, "app", "static")));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "app", "index.html"));
});

app.get("/create-lobby", (req, res) => {
  res.sendFile(path.resolve(__dirname, "app", "index.html"));
});

app.get("/error", (req, res) => {
  res.sendFile(path.resolve(__dirname, "app", "index.html"));
});

app.listen(3001, () => console.log("Server running..."));
