const express = require("express");
const path = require("path");

const app = express();

app.use("/static", express.static(path.join(__dirname, "static")));
app.use("/services", express.static(path.join(__dirname, "services")));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});

app.get("/create-lobby", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});

app.get("/error", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});

app.listen(3000, () => console.log("Server running..."));
