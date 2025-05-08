const express = require("express");
const path = require("path");

const app = express();

app.use("/static", express.static(path.resolve(__dirname,  "static")));
app.use("/handlers", express.static(path.resolve(__dirname,  "handlers")));
app.use("/models", express.static(path.resolve(__dirname,  "models")));

app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "index.html"));
  });
  
app.get("/create-lobby", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});  

app.get("/error", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
}); 

app.get("/login", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});

app.get("/signin-google", (req, res) => {
  console.log(req.query["code"]);
  res.send("Authenticated");
});
  
app.listen( 3000, () => console.log("Server running..."));