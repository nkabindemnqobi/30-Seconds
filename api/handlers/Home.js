const { startGame } = require('../queries/lobby');
const { getUserIdFromGoogleId } = require('../queries/users');
const { broadcastToMatch } = require('../utils/SSEManager');
const { formatErrorResponse, getUnexpectedErrorStatus } = require('../utils/formatErrorResponse');

const handleStartGame = async (req, res, next) => {
    try {
        const { joinCode } = req.params;
        const userId = getUserIdFromGoogleId(req.user.sub);

        if (typeof joinCode !== 'string' || typeof userId !== 'number') {
            return next(formatErrorResponse(400, "Missing joinCode or userId"));
        }

        const result = await startGame({ joinCode, userId });

        broadcastToMatch(joinCode, {
            data: { message: "Game started!", matchId: result.matchId }
        }, "game_started");

        res.status(200).json({ message: "Game started successfully." });
    } catch (error) {
        return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
    }
};

module.exports = { handleStartGame };
