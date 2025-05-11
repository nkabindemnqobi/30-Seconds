const express = require("express");
const router = express.Router();
const { postLobbyJoinTeam, postLobbyJoin } = require("../handlers/Lobby");

router.post("/:joinCode", postLobbyJoin);

module.exports = router;
