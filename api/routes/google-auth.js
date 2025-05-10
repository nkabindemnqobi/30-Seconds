const express = require("express");
const router = express.Router();
const {
  getAuthUrl,
  exchangeCodeForIdToken,
} = require("../handlers/google-auth");
const { handleSSEConnection } = require("../utils/SSEManager");

router.get("/get-token", async (req, res, next) => {
  const code = req.query["code"];
  const tokenResponse = code ? await exchangeCodeForIdToken(code) : null;
  res.send(tokenResponse);
});

router.get("/login", (req, res, next) => {
  const authUrl = getAuthUrl();
  res.send({ authUrl: authUrl });
});

router.get("/sse/connect/:userId", (req, res) => {
  const userId = req.params.userId; // get from middleware?
  handleSSEConnection(req, res, userId);
});

module.exports = router;
