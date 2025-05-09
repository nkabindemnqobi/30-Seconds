const express = require('express');
const router = express.Router();
const { getAllPublicLobbies } = require('../handlers/Home');

router.get('/public-lobbies', getAllPublicLobbies);

module.exports = router;