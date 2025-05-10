const express = require("express");
const router = express.Router();
const {
  getAuthUrl,
  exchangeCodeForIdToken,
} = require("../handlers/google-auth");
const { handleSSEConnection } = require("../utils/SSEManager");

router.get('/get-token', exchangeCodeForIdToken);

router.get("/login", (req, res, next) => {
  const authUrl = getAuthUrl();
  res.send({ authUrl: authUrl });
});

router.get("/sse/connect/:userId", (req, res) => {
  const userId = req.params.userId; // get from middleware?
  handleSSEConnection(req, res, userId);
});

module.exports = router;
