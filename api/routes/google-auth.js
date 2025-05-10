const express = require('express');
const router = express.Router();
const { getAuthUrl, exchangeCodeForIdToken } = require("../handlers/google-auth");

router.get('/get-token', exchangeCodeForIdToken);

router.get('/login', (req, res, next) => {
  const authUrl = getAuthUrl();
  res.send({ authUrl: authUrl });
})

module.exports = router;
