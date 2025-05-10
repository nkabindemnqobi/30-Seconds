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
  getLobbyInformation,
  getMatchIdByJoinCode,
  addUserToLobby,
} = require("../queries/lobbies");

//Assume player is in limbo. We use a different EP for joining team.
const postLobbyJoinTeam = async (req, res) => {
  const joinCode = req.params.joinCode;
  const { userJoiningId, teamPreferenceChar } = req.body;

  if (!joinCode || !userJoiningId || !teamPreferenceChar) {
    console.log(joinCode, userJoiningId, teamPreferenceChar);
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const matchIdResult = await getMatchIdByJoinCode(joinCode);

    if (matchIdResult.length === 0) {
      return res.status(404).json({ message: "Lobby not found." });
    }

    const matchId = matchIdResult[0].id;
    console.log(matchId);

    const addUserToLobbyResult = addUserToLobby(
      userJoiningId,
      matchId,
      teamPreferenceChar
    );

    if (addUserToLobbyResult.success === true) {
      addUserToMatch(joinCode, userJoiningId);

      const resultRows = await getLobbyInformation(matchId);
      const formattedData = formatMatchWithParticipants(resultRows);

      if (formattedData) {
        res.json(formattedData);
      } else {
        res.status(404).json({ error: "Match not found" });
      }

      broadcastToMatch(
        joinCode,
        {
          message: `A user has a team!`,
          lobbyData: { ...formattedData, joiningUserId: userJoiningId },
        },
        "player_join_team"
      );
      res.status(200).json({ message: `User successfully joined a team.` });
    } else {
      res.status(500).json({ message: `User failed to join a team.` });
    }
  } catch (err) {
    const { status, error, reason } = formatErrorResponse(err, "Join Lobby");
    console.error(
      `Error in postLobbyJoin for user ${userJoiningId} joining ${joinCode} with team_id ${teamId}:`,
      err
    );
    res.status(status).json({ error, reason });
  }
};

const postLobbyJoin = async (req, res) => {
  const joinCode = req.params.joinCode;
  const { userJoiningId } = req.body;

  try {
    const matchIdResult = await getMatchIdByJoinCode(joinCode);
    console.log(matchIdResult);

    if (matchIdResult.length === 0) {
      return res.status(404).json({ message: "Lobby not found." });
    }

    const matchId = matchIdResult[0].id;
    console.log(matchId);
    addUserToMatch(joinCode, userJoiningId);

    const resultRows = await getLobbyInformation(matchId);
    const formattedData = formatMatchWithParticipants(resultRows);

    if (formattedData) {
      res.json(formattedData);
    } else {
      res.status(404).json({ error: "Match not found" });
    }

    broadcastToMatch(
      joinCode,
      {
        message: `A user has joined the lobby!`,
        lobbyData: { ...formattedData, joiningUserId: userJoiningId },
      },
      "player_join"
    );
  } catch (error) {
    console.error("Error fetching match data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  postLobbyJoinTeam,
  postLobbyJoin,
};
