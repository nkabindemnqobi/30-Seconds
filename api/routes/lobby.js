const express = require("express");
const router = express.Router();
const { postLobbyJoin , handleStartGame} = require("../handlers/Lobby");

router.post("/:joinCode", postLobbyJoin);
router.post("/:joinCode/start", handleStartGame);

module.exports = router;
