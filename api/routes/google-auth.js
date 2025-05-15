const express = require("express");
const router = express.Router();
const {
  getAuthUrl,
  exchangeCodeForIdToken,
} = require("../handlers/google-auth");
const { handleSSEConnection } = require("../utils/SSEManager");

router.get('/get-token', exchangeCodeForIdToken);

router.get("/login", (req, res) => {
  const authUrl = getAuthUrl();
  res.send(authUrl);
});

router.get("/sse/connect/:googleId", handleSSEConnection);

module.exports = router;
