const { startRound, isMatchOver, calculateScores, makeGuess } = require('../queries/round');
const { broadcastToMatch, sendToUser } = require('../utils/SSEManager');
const { formatErrorResponse, getUnexpectedErrorStatus } = require('../utils/formatErrorResponse');

const handleStartRound = async (req, res, next) => {
  try {
    const { joinCode } = req.params;

    if (!joinCode) {
      return res.status(400).json({ message: 'Missing join code' });
    }

    const {
      gameEnded,
      roundId,
      guessingAlias,
      guessingUserId,
      hint,
      winners,
      losers
    } = await startRound(joinCode);

    if (gameEnded) {
      broadcastToMatch(joinCode, {
        message: 'Game over!',
        winners,
        losers
      }, 'game_ended');

      return res.status(200).json({
        message: 'Game complete',
        winners,
        losers
      });
    }

    broadcastToMatch(joinCode, {
      message: `A new round has started!`,
      guessingAlias
    }, 'round_started');

    sendToUser(guessingUserId, {
      data: { hint }
    }, 'your_turn');

    res.status(200).json({ roundId, guessingAlias, hint });
  } catch (error) {
    return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
  }
};

//This is a mocked endpoint for the round submission
const handleAnswerSubmission = async (req, res, next) => {
    // Assume that we receive a post of a guess.
    // Assume that the answer was correct and we have created the round item.
    const joinCode = "PART0730";
    try {
      const matchConclusionResult = await isMatchOver(joinCode);
      if (matchConclusionResult.isMatchOver === true){
        const scores = await calculateScores(joinCode);
        broadcastToMatch(joinCode, {
          message: `The game has ended!!`,
          scores
        }, 'game_ended');
        
        return res.status(200).json({message: "You have finished the game!"})
      }
    } catch (error) {
      
    }
    // We check if this is the last round.
    //  We do this by getting the count of the match_cat and match_part by matchId. If count round by matchId equal to that then game over.
    //  If we see that the game has ended, we broad cast the results.
    // ELSE
    //  We carry on to the next round.
    // TODO: FIGURE OUT HOW IT WORKS ON THE TIMER.

    
}


const handleMakeGuess = async (req, res, next) => {
  try {
    const { joinCode } = req.params;
    const { userId, guess } = req.body;

    if (!joinCode || !userId || !guess) {
      return next(formatErrorResponse(400, 'Missing parameters'));
    }

    const result = await makeGuess(joinCode, userId, guess);

    if (result.correct) {
      broadcastToMatch(joinCode, {
        message: `${result.guessingAlias} guessed it right!`,
        item: result.itemName,
        roundId: result.roundId,
        score: result.score
      }, 'round_complete');
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
