const express = require('express');
const router = express.Router();
const { getAuthUrl, exchangeCodeForIdToken, tokenCache } = require("../handlers/google-auth");

router.get('/signin-google', async (req, res, next) => {
  const sessionId = req.query["state"];
  const tokenResponse = await exchangeCodeForIdToken(req.query["code"], sessionId);
  if (sessionId && token) {
    tokenCache[sessionId] = token;
  }
  console.log(tokenCache);
  res.send(tokenResponse);
  next();
});

router.get('/login', (req, res, next) => {
  const authUrl = getAuthUrl();
  res.send(authUrl);
  next();
})

app.get('/get-token/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const token = tokenCache[sessionId];

  if (token) {
    res.send(`Token for session ${sessionId}: ${token}`);
  } else {
    res.status(404).send('Token not found');
  }
});

module.exports = router;
