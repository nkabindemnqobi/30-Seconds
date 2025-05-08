const express = require("express");
const router = express.Router();
const { lobbyConnection, postLobbyJoin } = require("../handlers/Lobby");

router.post("/:joinCode", lobbyConnection);
router.post("/:joinCode/join", postLobbyJoin);

module.exports = router;
