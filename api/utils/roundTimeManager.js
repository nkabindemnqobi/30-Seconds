const activeRoundTimers = new Map(); 
const ROUND_DURATION_MS = 33 * 1000;

const {broadcastToMatch} = require("./SSEManager")
const {setRoundByTimeout, calculateAndFinaliseScores, isMatchOver} = require("../queries/round")

async function handleRoundTimeout(joinCode, roundId, guesserAlias, guesserId) {
  activeRoundTimers.delete(joinCode);
  try {
    const updateRoundResult = await setRoundByTimeout(joinCode, roundId);
    if (updateRoundResult.success === true){
      const gameScores = await calculateAndFinaliseScores(joinCode, false);
      broadcastToMatch(
        joinCode,
        {
          message: `Time's up! ${guesserAlias} failed to guess in time.`,
          roundId: roundId,
          correctAnswer: updateRoundResult.data,
          guesserId: guesserId,
          gameScores
        },
        "round_timeout"
      );
      const matchConclusionResult = await isMatchOver(joinCode); 
      
      if (matchConclusionResult.IsMatchOver === true){
        const scores = await calculateAndFinaliseScores(joinCode, true); 
                                                                    
        broadcastToMatch(joinCode, { 
          message: `The game has ended!!`,
          scores
        }, 'game_ended');
        
      }
    }
  } catch (error) {
    
    throw error
  }
  
}

function startRoundTimer(joinCode, roundId, guesserAlias, guesserId ) {
    if (activeRoundTimers.has(joinCode)) {
      console.warn(`Warning: An existing timer was found for match ${joinCode} while trying to start a new one. Clearing the old timer.`);
      clearRoundTimer(joinCode);
    }
  
    const timerId = setTimeout(() => {
      handleRoundTimeout(joinCode, roundId, guesserAlias, guesserId);
    }, ROUND_DURATION_MS);
  
    activeRoundTimers.set(joinCode, timerId);
  }

  function clearRoundTimer(joinCode) {
    if (activeRoundTimers.has(joinCode)) {
      const timerId = activeRoundTimers.get(joinCode);
      clearTimeout(timerId);
      activeRoundTimers.delete(joinCode);
    } else {
      //no active timers
    }
  }

  module.exports ={
    activeRoundTimers,
    clearRoundTimer,
    startRoundTimer
  }
