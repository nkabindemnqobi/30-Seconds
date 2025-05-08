const express = require("express");
const router = express.Router();
const {
  getAuthUrl,
  exchangeCodeForIdToken,
  tokenCache,
} = require("../handlers/google-auth");
const { handleSSEConnection } = require("../utils/SSEManager");

router.get("/signin-google", async (req, res, next) => {
  const sessionId = req.query["state"];
  const tokenResponse = await exchangeCodeForIdToken(
    req.query["code"],
    sessionId
  );
  if (sessionId && tokenResponse) {
    tokenCache[sessionId] = tokenResponse;
  }
  res.send(tokenResponse);
});

router.get("/login", (req, res, next) => {
  const authUrl = getAuthUrl();
  res.send(authUrl);
  next();
});

router.get("/get-token/:sessionId", (req, res) => {
  const sessionId = req.params.sessionId;
  const token = tokenCache[sessionId];

  if (token) {
    res.send(token);
  } else {
    res.status(404).send("Token not found");
  }
});

router.get("/sse/connect/:userId", (req, res) => {
  const userId = req.params.userId; // get from middleware?
  handleSSEConnection(req, res, userId);
});

module.exports = router;
