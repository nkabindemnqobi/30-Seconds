const express = require("express");
const { getAllCategories, handleCreateLobby } = require("../handlers/CreateLobby");

const router = express.Router();

router.get('/categories', getAllCategories);
router.post("/", handleCreateLobby);

module.exports = router;
