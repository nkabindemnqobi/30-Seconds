const { executeQuery } = require("../db/query");
const sql = require("mssql");
const formatErrorResponse = require("../utils/formatErrorResponse");
const { formatMatchWithParticipants } = require("../utils/lobbyInfoFormatter");
const {
  broadcastToMatch,
  matchMemberships,
  addUserToMatch,
  removeUserFromMatch,
} = require("../utils/SSEManager");
const {
  createLobby,
  getMatchLobbyInformation,
  getMatchIdByJoinCode,
  addUserToLobby,
} = require("../queries/lobbies");

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
  } catch (error) {
    console.error("Error fetching match data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  postLobbyJoin,
};
