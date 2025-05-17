const express = require("express");
const { getAllCategories, handleCreateLobby } = require("../handlers/CreateLobby");
const { authMiddleware } = require("../middleware/authorization");

const router = express.Router();

router.get('/categories', authMiddleware, getAllCategories);
router.post("/", authMiddleware, handleCreateLobby);

module.exports = router;
