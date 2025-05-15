const express = require('express');
const router = express.Router();
const { authMiddleware } = require("../middleware/authorization");
const { handleFetchLobbies } = require('../handlers/Home');

router.get('/lobbies', authMiddleware, handleFetchLobbies);

module.exports = router;