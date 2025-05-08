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

//Assume player is in limbo. We use a different EP for joining team.
const postLobbyJoinTeam = async (req, res) => {
  const joinCode = req.params.joinCode;
  const { userJoiningId, teamId } = req.body;

  if (!joinCode || !userJoiningId || !teamId) {
    console.log(joinCode, userJoiningId, teamId);
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const matchIdQuery = `
    SELECT id FROM matches
    WHERE join_code = @joinCode;
  `;
    const matchIdResult = await executeQuery(matchIdQuery, [
      { name: "joinCode", type: sql.VarChar, value: joinCode },
    ]);

    if (matchIdResult.length === 0) {
      return res.status(404).json({ message: "Lobby not found." });
    }

    const matchId = matchIdResult[0].id;
    console.log(matchId);

    const checkQuery = `
        SELECT id FROM match_participants
        WHERE user_id = @userId AND team_id = @teamId;
      `;
    const existing = await executeQuery(checkQuery, [
      { name: "userId", type: sql.Int, value: userJoiningId },
      { name: "teamId", type: sql.Int, value: teamId },
    ]);

    if (existing.length > 0) {
      console.log(`User ${userJoiningId} already in match ${matchId}`);
      return res.status(409).json({ message: "User already in this lobby." });
    }

    const insertQuery = `
        INSERT INTO match_participants (user_id, team_id)
        VALUES (@userId, @teamId);
      `;
    await executeQuery(insertQuery, [
      { name: "userId", type: sql.Int, value: userJoiningId },
      { name: "teamId", type: sql.Int, value: teamId },
    ]);

    addUserToMatch(joinCode, userJoiningId);

    const matchQuery = `
        SELECT
            m.id AS match_id,
            m.join_code,
            m.is_public,
            m.match_creator_id,
            m.status_id,
            s.status AS match_status,
            m.max_participants,
            m.started_datetime,
            m.completed_datetime
        FROM matches m
        JOIN status s ON m.status_id = s.id
        WHERE m.id = @matchId;
      `;
    const matchInfoResult = await executeQuery(matchQuery, [
      { name: "matchId", type: sql.Int, value: matchId },
    ]);
    const matchInfo = matchInfoResult.length > 0 ? matchInfoResult[0] : null; // Should not be null if we got matchId
    // Fetch list of participants
    const participantsQuery = `
        SELECT mp.user_id, u.alias
        FROM match_participants mp
        JOIN users u ON mp.user_id = u.id
        WHERE mp.team_id = @teamId;
    `;
    const participants = await executeQuery(participantsQuery, [
      { name: "teamId", type: sql.Int, value: teamId },
    ]);

    broadcastToMatch(
      joinCode,
      {
        message: `User ${userJoiningId} joined team ${teamId}`,
        matchInfo: matchInfo,
        participants: participants, // Include the updated participant list
      },
      "lobby_update"
    );

    res.status(200).json({ message: `User successfully joined a team.` });
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

  const sqlQuery = `
        SELECT
            m.id AS match_id, m.join_code, m.is_public, m.match_creator_id, creator.alias AS match_creator_alias, creator.email AS match_creator_email,
            m.status_id, s.status AS match_status, m.max_participants, m.started_datetime, m.completed_datetime,
            tA.id AS team_a_id, tA.captain_id AS team_a_captain_id, uA_cap.alias AS team_a_captain_alias, uA_cap.email AS team_a_captain_email, tA.is_open AS team_a_is_open,
            tB.id AS team_b_id, tB.captain_id AS team_b_captain_id, uB_cap.alias AS team_b_captain_alias, uB_cap.email AS team_b_captain_email, tB.is_open AS team_b_is_open,
            p_user.id AS participant_user_id, p_user.alias AS participant_alias, p_user.email AS participant_email,
            mp.team_id AS participant_team_id, mp.is_barred AS participant_is_barred
        FROM matches m
        JOIN status s ON m.status_id = s.id
        JOIN users creator ON m.match_creator_id = creator.id
        JOIN teams tA ON m.team_a_id = tA.id
        JOIN users uA_cap ON tA.captain_id = uA_cap.id
        JOIN teams tB ON m.team_b_id = tB.id
        JOIN users uB_cap ON tB.captain_id = uB_cap.id
        LEFT JOIN match_participants mp ON (mp.team_id = tA.id OR mp.team_id = tB.id)
        LEFT JOIN users p_user ON mp.user_id = p_user.id
        WHERE m.id = @matchId
        ORDER BY m.id, mp.team_id, p_user.id;
    `;

  try {
    const matchIdQuery = `
    SELECT id FROM matches
    WHERE join_code = @joinCode;
  `;
    const matchIdResult = await executeQuery(matchIdQuery, [
      { name: "joinCode", type: sql.VarChar, value: joinCode },
    ]);

    if (matchIdResult.length === 0) {
      return res.status(404).json({ message: "Lobby not found." });
    }

    const matchId = matchIdResult[0].id;
    console.log(matchId);

    const queryParams = [{ name: "matchId", type: sql.Int, value: matchId }];
    const resultRows = await executeQuery(sqlQuery, queryParams);

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
        lobbyData: formattedData,
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
