const express = require("express");
const { handleStartRound, handleMakeGuess, handleGetHint } = require("../handlers/round");
const { authMiddleware } = require("../middleware/authorization");

const router = express.Router();

router.post("/:joinCode/start-round", authMiddleware,handleStartRound);
router.post('/:joinCode/guess', authMiddleware, handleMakeGuess);
router.get('/:joinCode/get-hint', authMiddleware, handleGetHint);
// router.post("/:joinCode/start-round", handleStartRound);
// router.post('/:joinCode/guess',  handleMakeGuess);
// router.get('/:joinCode/get-hint',  handleGetHint);

module.exports = router;
