const { executeQuery } = require("../db/query");
const sql = require("mssql");
const { formatErrorResponse, getUnexpectedErrorStatus } = require("../utils/formatErrorResponse");
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
const postLobbyJoinTeam = async (req, res, next) => {
  const joinCode = req.params.joinCode;
  const { userJoiningId, teamPreferenceChar } = req.body;

  if (!joinCode || !userJoiningId || !teamPreferenceChar) {
    console.log(joinCode, userJoiningId, teamPreferenceChar);
    return next(formatErrorResponse(400, "Missing required parameters."));
  }

  try {
    const matchIdResult = await getMatchIdByJoinCode(joinCode);

    if (matchIdResult.length === 0) {
      return next(formatErrorResponse(404, "Lobby not found."));
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
        return next(formatErrorResponse(404, "Match not found."));
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
      return formatErrorResponse(500, `User failed to join a team.`);
    }
  } catch (error) {
    return next(formatErrorResponse(getUnexpectedErrorStatus(error), `Error in postLobbyJoin for user ${userJoiningId} joining ${joinCode} with team_id ${teamId}:`));
  }
};

const postLobbyJoin = async (req, res, next) => {
  const joinCode = req.params.joinCode;
  const { userJoiningId } = req.body;

  try {
    const matchIdResult = await getMatchIdByJoinCode(joinCode);
    console.log(matchIdResult);

    if (matchIdResult.length === 0) {
      return next(formatErrorResponse(404, "Lobby not found"));
    }

    const matchId = matchIdResult[0].id;
    console.log(matchId);
    addUserToMatch(joinCode, userJoiningId);

    const resultRows = await getLobbyInformation(matchId);
    const formattedData = formatMatchWithParticipants(resultRows);

    if (formattedData) {
      res.json(formattedData);
    } else {
      return next(formatErrorResponse(404, "Match not found"));
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
    return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
  }
};

module.exports = {
  postLobbyJoinTeam,
  postLobbyJoin,
};
