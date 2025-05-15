const activeRoundTimers = new Map(); // lobbycode -> steTimeout
const ROUND_DURATION_MS = 30 * 1000;

async function handleRoundTimeout(joinCode) {
  console.log(`Round timer expired for match: ${joinCode}`);
  activeRoundTimers.delete(joinCode);
  // Update the game round.
  //    await db.query("UPDATE GameRounds SET ended_datetime = GETDATE(), points_awarded = 0, time_in_ms = @duration WHERE id = @currentRoundId AND match_id = (SELECT id FROM Matches WHERE join_code = @joinCode)", { duration: ROUND_DURATION_MS, currentRoundId: /* get current round ID for joinCode */, joinCode });

  // Get the current guesser thru another query or through query above.
  // const currentGuesser = await getCurrentGuesserForMatch(joinCode);
  broadcastToMatch(
    joinCode,
    {
      message: `Time's up! ${
        currentGuesser.alias || "The player"
      } failed to guess in time.`,
      roundId: 1,
      guesserId: currentGuesser.id,
      scoreAwarded: 0,
    },
    "round_timeout"
  );

  const matchOverDetails = await isMatchOver(joinCode); 
  //    if (matchOverDetails.isMatchOver) {
  //        // Handle game end
  //    }
}

function startRoundTimer(joinCode, roundId) {
    if (activeRoundTimers.has(joinCode)) {
      console.warn(`Warning: An existing timer was found for match ${joinCode} while trying to start a new one. Clearing the old timer.`);
      clearRoundTimer(joinCode);
    }
  
    console.log(`Starting a ${ROUND_DURATION_MS / 1000}-second timer for match: ${joinCode}, round: ${roundId}`);
  
    const timerId = setTimeout(() => {
      handleRoundTimeout(joinCode);
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
