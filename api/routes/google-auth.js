const express = require('express');
const router = express.Router();
const { getAuthUrl, exchangeCodeForIdToken } = require("../handlers/google-auth");

router.get('/get-token', async (req, res, next) => {
  const code = req.query["code"];
  const tokenResponse = code ? await exchangeCodeForIdToken(code) : null;
  res.send(tokenResponse);
});

router.get('/login', (req, res, next) => {
  const authUrl = getAuthUrl();
  res.send({ authUrl: authUrl });
})

module.exports = router;
