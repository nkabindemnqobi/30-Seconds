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

    // const checkQueryResult = await checkIfUserInLobby(userJoiningId, teamId);

    // if (checkQueryResult.length > 0) {
    //   console.log(`User ${userJoiningId} already in match ${matchId}`);
    //   return res.status(409).json({ message: "User already in this lobby." });
    // }

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

    // const matchQuery = `
    //     SELECT
    //         m.id AS match_id,
    //         m.join_code,
    //         m.is_public,
    //         m.match_creator_id,
    //         m.status_id,
    //         s.status AS match_status,
    //         m.max_participants,
    //         m.started_datetime,
    //         m.completed_datetime
    //     FROM matches m
    //     JOIN status s ON m.status_id = s.id
    //     WHERE m.id = @matchId;
    //   `;
    // const matchInfoResult = await executeQuery(matchQuery, [
    //   { name: "matchId", type: sql.Int, value: matchId },
    // ]);
    // const matchInfo = matchInfoResult.length > 0 ? matchInfoResult[0] : null; // Should not be null if we got matchId
    // // Fetch list of participants
    // const participantsQuery = `
    //     SELECT mp.user_id, u.alias
    //     FROM match_participants mp
    //     JOIN users u ON mp.user_id = u.id
    //     WHERE mp.team_id = @teamId;
    // `;
    // const participants = await executeQuery(participantsQuery, [
    //   { name: "teamId", type: sql.Int, value: teamId },
    // ]);
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

    // Insert the user into the DB. If it is successful, send out a broadcast. If not, return a simple response indicating the error to
    // the calling client.
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
