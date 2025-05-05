const express = require('express');
const router = express.Router();
const { getAllCategories } = require('../handlers/CreateLobby');

router.get('/categories', getAllCategories);

module.exports = router;