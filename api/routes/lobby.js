const express = require("express");
const router = express.Router();
const { postLobbyJoin , handleStartGame, handleKickPlayer} = require("../handlers/Lobby");
const { authMiddleware } = require("../middleware/authorization");

router.post("/:joinCode", authMiddleware, postLobbyJoin);
router.post("/:joinCode/start", authMiddleware, handleStartGame);
router.post("/:joinCode/barred", authMiddleware, handleKickPlayer);

module.exports = router;
