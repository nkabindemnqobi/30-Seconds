const formatErrorResponse = require("../utils/formatErrorResponse");
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

const postLobbyJoin = async (req, res) => {
  const joinCode = req.params.joinCode;
  const { userJoiningId } = req.body;

  try {
    const matchIdResult = await getMatchIdByJoinCode(joinCode);
    console.log("matchId Result", matchIdResult);

    if (matchIdResult.length === 0) {
      return res.status(404).json({ message: "Lobby not found." });
    }

    const matchId = matchIdResult[0].id;
    const addUserToLobbyResult = await addUserToLobby(userJoiningId, matchId);
    addUserToMatch(joinCode, userJoiningId);

    const resultRows = await getMatchLobbyInformation(matchId);
    console.log("RESULT ROWS", resultRows)

    broadcastToMatch(
      joinCode,
      {
        message: `A user has joined the lobby!`,
        lobbyData: { ...resultRows, joiningUserId: userJoiningId },
      },
      "player_join"
    );

    res.status(200).json( { ...resultRows, joiningUserId: userJoiningId });
  } catch (err) {
    const { status, error, reason } = formatErrorResponse(err, "join-lobby");
    return res.status(status).json({ error, reason });
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
