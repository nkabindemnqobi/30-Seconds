const { startRound } = require('../queries/round');
const { broadcastToMatch, sendToUser } = require('../utils/SSEManager');
const formatErrorResponse = require('../utils/formatErrorResponse');

const handleStartRound = async (req, res) => {
  try {
    const { joinCode } = req.params;

    if (!joinCode) {
      return res.status(400).json({ message: 'Missing join code' });
    }

    const {
      roundId,
      guessingAlias,
      guessingUserId,
      hint
    } = await startRound(joinCode);

    broadcastToMatch(joinCode, {
      message: `A new round has started!`,
      guessingAlias
    }, 'round_started');

    sendToUser(guessingUserId, {
      data: { hint }
    }, 'your_turn');

    res.status(200).json({ roundId, guessingAlias, hint });
  } catch (err) {
    const { status, error, reason } = formatErrorResponse(err, 'start-round');
    res.status(status).json({ error, reason });
  }
};


module.exports = {
  handleStartRound,
};
