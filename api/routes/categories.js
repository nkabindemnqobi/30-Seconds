const express = require('express');
const router = express.Router();
const { getAllCategories } = require('../handlers/CreateLobby');

router.get('/', getAllCategories);

module.exports = router;