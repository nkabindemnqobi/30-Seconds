const { startRound, isMatchOver, calculateAndFinaliseScores, makeGuess } = require('../queries/round');
const { broadcastToMatch, sendToUser } = require('../utils/SSEManager');
const { formatErrorResponse, getUnexpectedErrorStatus } = require('../utils/formatErrorResponse');

const handleStartRound = async (req, res, next) => {
  try {
    const { joinCode } = req.params;

    if (!joinCode) {
      return res.status(400).json({ message: 'Missing join code' });
    }

    const roundInfo = {
      roundId,
      guessingAlias,
      guessingUserId,
      hint,
    } = await startRound(joinCode); // NOW USES PROCS

    broadcastToMatch(joinCode, {
      message: `A new round has started!`,
      roundInfo
    }, 'round_started');

    sendToUser(guessingUserId, {
      data: { hint }
    }, 'your_turn');

    res.status(200).json({ roundId, guessingAlias, hint });
  } catch (error) {
    return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
  }
};


const handleMakeGuess = async (req, res, next) => {
  try {
    const { joinCode } = req.params;
    const { userId, guess } = req.body;

    if (!joinCode || !userId || !guess) {
      return next(formatErrorResponse(400, 'Missing parameters'));
    }

    const result = await makeGuess(joinCode, userId, guess); // TODO: Change this to use proc.

    if (result.correct) { // Assume the answer is correct and the transaction ran as intended
      broadcastToMatch(joinCode, {
        message: `${result.guessingAlias} guessed it right!`,
        item: result.itemName,
        roundId: result.roundId,
        score: result.score
      }, 'round_complete');
      ///////////////////////////////////////////////////
      const joinCode = "PART0730"; // FOR TESTING.
      ///////////////////////////////////////////////////
      const matchConclusionResult = await isMatchOver(joinCode); // Check if the match is over.
      if (matchConclusionResult.isMatchOver === true){
        const scores = await calculateAndFinaliseScores(joinCode); // Calculate the scores for everyone and do some updates.
                                                                    // This is safe to do here since match is 100% completed.
        broadcastToMatch(joinCode, { // Broadcast the results to all players.
          message: `The game has ended!!`,
          scores
        }, 'game_ended');
        
        return res.status(200).json({message: "You have finished the game!"})
      }

    } else {
      broadcastToMatch(joinCode, {
        message: `${result.guessingAlias} guessed it wrong!`,
        item: result.itemName,
        roundId: result.roundId,
      }, 'wrong_guess')
    }

    res.status(200).json(result);
  } catch (error) {
    return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
  }
};

module.exports = {
  handleStartRound,
  handleMakeGuess,
};
