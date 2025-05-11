const express = require("express");
const { handleStartRound } = require("../handlers/round");

const router = express.Router();

router.post("/:joinCode/start-round", handleStartRound);

module.exports = router;
