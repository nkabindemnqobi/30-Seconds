const express = require("express");
const { handleStartRound, handleMakeGuess } = require("../handlers/round");

const router = express.Router();

router.post("/:joinCode/start-round", handleStartRound);
router.post('/:joinCode/guess', handleMakeGuess);

module.exports = router;
