const { formatErrorResponse, getUnexpectedErrorStatus } = require("../utils/formatErrorResponse");
const { formatMatchWithParticipants } = require("../utils/lobbyInfoFormatter");
const {
  broadcastToMatch,
  addUserToMatch,
} = require("../utils/SSEManager");
const {
  getMatchLobbyInformation,
  getMatchIdByJoinCode,
  addUserToLobby,
  startGame
} = require("../queries/lobby");

const postLobbyJoin = async (req, res, next) => {
  const joinCode = req.params.joinCode;
  const { userJoiningId } = req.body;

  try {
    const matchIdResult = await getMatchIdByJoinCode(joinCode);
    console.log("matchId Result", matchIdResult);

    if (matchIdResult.length === 0) {
      return next(formatErrorResponse(404, "Lobby not found"));
    }

    const matchId = matchIdResult[0].id;
    const addUserToLobbyResult = await addUserToLobby(userJoiningId, matchId);
    addUserToMatch(joinCode, userJoiningId);

    const resultRows = await getLobbyInformation(matchId);
    const formattedData = formatMatchWithParticipants(resultRows);
    console.log("RESULT ROWS", resultRows)

    if (formattedData) {
      res.json(formattedData);
    } else {
      return next(formatErrorResponse(404, "Match not found"));
    }

    broadcastToMatch(
      joinCode,
      {
        message: `A user has joined the lobby!`,
        lobbyData: { ...resultRows, joiningUserId: userJoiningId },
      },
      "player_join"
    );
    res.status(200).json( { ...resultRows, joiningUserId: userJoiningId });
  } catch (error) {
    return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
  }
};

const handleStartGame = async (req, res) => {
  try {
    const { joinCode } = req.params;
    const { userId } = req.body;

    if (!joinCode || !userId) {
      return res.status(400).json({ message: "Missing joinCode or userId" });
    }

    const result = await startGame({ joinCode, userId });

    broadcastToMatch(joinCode, {
      data: { message: "Game started!", matchId: result.matchId },
    }, "game_started");

    return res.status(200).json({ message: "Game started successfully." });
  } catch (err) {
    const { status, error, reason } = formatErrorResponse(err, "start-game");
    return res.status(status).json({ error, reason });
  }
};

module.exports = {
  postLobbyJoin,
  handleStartGame,
};
