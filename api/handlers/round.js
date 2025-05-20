const { startRound, isMatchOver, calculateAndFinaliseScores, makeGuess, getHint } = require('../queries/round');
const { getUserIdFromGoogleId } = require('../queries/users');
const { broadcastToMatch, sendToUser } = require('../utils/SSEManager');
const { formatErrorResponse, getUnexpectedErrorStatus } = require('../utils/formatErrorResponse');
const { startRoundTimer, clearRoundTimer, activeRoundTimers} = require("../utils/roundTimeManager");

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
      hint
    } = await startRound(joinCode);

    await startRoundTimer(joinCode, roundId, guessingAlias, guessingUserId);

    broadcastToMatch(joinCode, {
      message: `A new round has started!`,
      roundInfo, guessingUserId
    }, 'round_started');

    sendToUser(guessingUserId, {
      data: { hint }
    }, 'your_turn');

    res.status(200).json({ roundId, guessingAlias, hint });
  } catch (error) {
      
    if (error.message === 'A round is already in progress.') {
      return next(formatErrorResponse(403, error.message));
    }
    
    return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
  }
};


const handleMakeGuess = async (req, res, next) => {
  try {
    const { joinCode } = req.params;
    const { guess } = req.body;
    const userId = await getUserIdFromGoogleId(req.user.sub);;

    if (!joinCode || !userId || !guess) {
      return next(formatErrorResponse(400, 'Missing parameters'));
    }

    const result = await makeGuess(joinCode, userId, guess); 

    if (result.correct) { 
      clearRoundTimer(joinCode); 
      broadcastToMatch(joinCode, {
        message: `${result.guessingAlias} guessed it right!`,
        item: result.itemName,
        roundId: result.roundId,
        score: result.score
      }, 'round_complete');
      const matchConclusionResult = await isMatchOver(joinCode); 
      if (matchConclusionResult.IsMatchOver === true){
        const scores = await calculateAndFinaliseScores(joinCode, true); 
                                                                    
        broadcastToMatch(joinCode, { 
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
    if (error.message === 'Invalid join code') {
      return next(formatErrorResponse(400, error.message));
    }
    if (error.message === 'No active round in progress') {
      return next(formatErrorResponse(404, error.message));
    }
    if (error.message === 'It is not your turn to guess') {
      return next(formatErrorResponse(403, error.message));
    }
    return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
  }
};

const handleGetHint = async (req, res, next) => {
  try {
    const { joinCode } = req.params;
    const userId = await getUserIdFromGoogleId(req.user.sub);

    if (!joinCode || !userId) {
      return next(formatErrorResponse(400, 'Missing parameters'));
    }

    const result = await getHint(joinCode, userId);
    if (!result.success){
      return res.status(200).json(result);
    }

    broadcastToMatch(joinCode, {
      message: `Another hint requested`,
      item: result.hint,
      roundId: result.roundId,
    }, 'hint_requested')
    return res.status(200).json(result);
    
  } catch (error) {
    if (error.message === 'Invalid join code') {
      return next(formatErrorResponse(400, error.message));
    }
    if (error.message === 'No active round in progress') {
      return next(formatErrorResponse(404, error.message));
    }
    if (error.message === 'Not your turn to request a hint') {
      return next(formatErrorResponse(403, error.message));
    }
    return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
  }
};

module.exports = {
  handleStartRound,
  handleMakeGuess,
  handleGetHint,
};
 
 
