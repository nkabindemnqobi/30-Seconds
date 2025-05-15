const express = require("express");
const { handleStartRound, handleMakeGuess, handleGetHint } = require("../handlers/round");
const { authMiddleware } = require("../middleware/authorization");

const router = express.Router();

router.post("/:joinCode/start-round", authMiddleware,handleStartRound);
router.post('/:joinCode/guess', authMiddleware, handleMakeGuess);
router.get('/:joinCode/get-hint', authMiddleware, handleGetHint);

module.exports = router;
