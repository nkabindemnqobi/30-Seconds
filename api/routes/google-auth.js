const express = require("express");
const router = express.Router();
const {
  getAuthUrl,
  exchangeCodeForIdToken,
} = require("../handlers/google-auth");
const { handleSSEConnection } = require("../utils/SSEManager");
const { authMiddleware } = require("../middleware/authorization");

router.get('/get-token', exchangeCodeForIdToken);

router.get("/login", (req, res, next) => {
  const authUrl = getAuthUrl();
  res.send({ authUrl: authUrl });
});

router.get("/sse/connect/:userId", authMiddleware, (req, res) => {
// router.get("/sse/connect/:userId", (req, res) => { USE THIS FOR NO AUTH.
  /*
   req.user = { email: <email>, sub: <googleId>, name: <name> }
  */
  const userId = req.params.userId;
  handleSSEConnection(req, res, userId);
});

module.exports = router;
