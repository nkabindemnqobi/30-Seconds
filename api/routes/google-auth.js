const express = require('express');
const router = express.Router();
const { getAuthUrl, exchangeCodeForIdToken } = require("../handlers/google-auth");

router.get('/signin-google', async (req, res, next) => {
  const tokenResponse = await exchangeCodeForIdToken(req.query["code"], req.query["state"]);
  res.send(tokenResponse);
});

router.get('/login', (req, res, next) => {
  const authUrl = getAuthUrl();
  res.send(authUrl);
})

module.exports = router;
