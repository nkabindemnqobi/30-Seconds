const express = require("express");
const router = express.Router();
const { postLobbyJoinTeam, postLobbyJoin } = require("../handlers/Lobby");

router.post("/:joinCode/join-team", postLobbyJoinTeam);
router.post("/:joinCode", postLobbyJoin); //TODO: Change to a GET.

module.exports = router;
