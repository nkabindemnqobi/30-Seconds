const activeRoundTimers = new Map(); // lobbycode -> setTimeout
const ROUND_DURATION_MS = 33 * 1000;

const {broadcastToMatch} = require("./SSEManager")
const {setRoundByTimeout, calculateAndFinaliseScores, isMatchOver} = require("../queries/round")

async function handleRoundTimeout(joinCode, roundId, guesserAlias, guesserId) {
  console.log(`Round timer expired for match: ${joinCode}`);
  activeRoundTimers.delete(joinCode);
  try {
    const updateRoundResult = await setRoundByTimeout(joinCode);
    if (updateRoundResult.success === true){
      //console.log("Round has been updated")
      const gameScores = await calculateAndFinaliseScores(joinCode, false);
      broadcastToMatch(
        joinCode,
        {
          message: `Time's up! ${guesserAlias} failed to guess in time.`,
          roundId: roundId,
          guesserId: guesserId,
          gameScores
        },
        "round_timeout"
      );
      const matchConclusionResult = await isMatchOver(joinCode); // Check if the match is over.
      console.log(matchConclusionResult.IsMatchOver)
      
      if (matchConclusionResult.IsMatchOver === true){
        const scores = await calculateAndFinaliseScores(joinCode, true); // Calculate the scores for everyone and do some updates.
                                                                    // This is safe to do here since match is 100% completed.
        broadcastToMatch(joinCode, { // Broadcast the results to all players.
          message: `The game has ended!!`,
          scores
        }, 'game_ended');
        
      }
    }
  } catch (error) {
    //console.log(error);
    throw error
  }
  
}

function startRoundTimer(joinCode, roundId, guesserAlias, guesserId ) {
    if (activeRoundTimers.has(joinCode)) {
      console.warn(`Warning: An existing timer was found for match ${joinCode} while trying to start a new one. Clearing the old timer.`);
      clearRoundTimer(joinCode);
    }
  
    console.log(`Starting a ${ROUND_DURATION_MS / 1000}-second timer for match: ${joinCode}, round: ${roundId}`);
  
    const timerId = setTimeout(() => {
      handleRoundTimeout(joinCode, roundId, guesserAlias, guesserId);
    }, ROUND_DURATION_MS);
  
    activeRoundTimers.set(joinCode, timerId);
    console.log(`Timer started for match ${joinCode} with ID: ${timerId}`);
  }

  function clearRoundTimer(joinCode) {
    if (activeRoundTimers.has(joinCode)) {
      const timerId = activeRoundTimers.get(joinCode);
      clearTimeout(timerId);
      activeRoundTimers.delete(joinCode);
      console.log(`Timer cleared for match: ${joinCode} (Timer ID: ${timerId})`);
    } else {
      console.log(`No active timer found to clear for match: ${joinCode}`);
    }
  }

  module.exports ={
    activeRoundTimers,
    clearRoundTimer,
    startRoundTimer
  }
