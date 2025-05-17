const express = require('express');
const router = express.Router();
const { authMiddleware } = require("../middleware/authorization");
const { handleFetchLobbies } = require('../handlers/Home');

// router.get('/lobbies', authMiddleware, async (req, res) => {
// USE THIS FOR NO AUTH
router.get('/lobbies', authMiddleware, handleFetchLobbies);

module.exports = router;