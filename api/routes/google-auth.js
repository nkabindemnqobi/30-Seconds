const express = require('express');
const router = express.Router();
const { getAuthUrl } = require("../handlers/google-auth");

router.get('/signin-google', (req, res, next) => {
  const googleResponseDetails = {
    sessionId: req.query["state"],
    authCode: req.query["code"],
  }
  res.send(googleResponseDetails);
});

router.get('/login', (req, res, next) => {
  const authUrl = getAuthUrl();
  res.send(authUrl);
})

module.exports = router;
