const { executeQuery } = require("../db/query");
const { withTransaction } = require("../db/transaction");
const { sql } = require("../db/pool");
const { formatMatchWithParticipants } = require("../utils/lobbyInfoFormatter");

async function getMatchLobbyInformation(matchId) {
  if (typeof matchId !== "number") {
    return {
      success: false,
      message: "Invalid input: Match ID must be a number.",
      data: null,
    };
  }
  const getMatchLobbyInfoQuery = `
    DECLARE @BarredStatusID INT;
    SELECT @BarredStatusID = id FROM dbo.MatchParticipantsStatus WHERE status = 'Barred';

    SELECT
      -- Match Details
      m.id AS match_id,
      m.join_code,
      m.lobby_name,
      m.is_public,
      m.max_participants,
      m.started_at,
      m.completed_at,
      m.status_id,          -- Match Status ID
      ms.status AS match_status, -- Match Status string

      mp.id AS match_participant_id,      -- ID from MatchParticipants table
      mp.user_id AS participant_user_id,
      pu.alias AS participant_alias,
      pu.email AS participant_email,
      mp.match_participants_status_id, -- Participant Status ID
      mps.status AS participant_status   -- Participant Status string

    FROM dbo.Matches m
    INNER JOIN dbo.MatchStatus ms ON m.status_id = ms.id

    LEFT JOIN dbo.MatchParticipants mp
      ON m.id = mp.match_id
      AND mp.match_participants_status_id != ISNULL(@BarredStatusID, -1) -- Exclude if status matches 'Barred' ID (-1 is used if 'Barred' status doesn't exist)

    LEFT JOIN dbo.Users pu ON mp.user_id = pu.id
    LEFT JOIN dbo.MatchParticipantsStatus mps ON mp.match_participants_status_id = mps.id

    WHERE m.id = @matchId  -- Parameter for the specific match ID
    ORDER BY m.id, pu.alias; -- Order by match ID, then participant alias for consistent results
  `;

  try {
    const resultRows = await executeQuery(getMatchLobbyInfoQuery, {
      matchId: matchId,
    });
    if (resultRows && resultRows.length > 0) {
      const formattedData = formatMatchWithParticipants(resultRows);
      if (formattedData) {
        return {
          success: true,
          message: "Lobby information fetched successfully.",
          data: formattedData,
        };
      } else {
        return {
          success: false,
          message: "Failed to format lobby data.",
          data: null,
        };
      }
    } else {
      return {
        success: false,
        message: "Match not found or no data returned.",
        data: null,
      };
    }
  } catch (err) {
    return {
      success: false,
      message:
        err.message || "An error occurred while fetching lobby information.",
      data: null,
      error: err,
    };
  }
}

async function getMatchIdByJoinCode(joinCode) {
  const matchIdQuery = `
    SELECT id FROM matches
    WHERE join_code = @joinCode;
  `;
  return await executeQuery(matchIdQuery, { JoinCode: joinCode });
}

async function addUserToLobby(userId, matchId) {
  if (typeof userId !== "number" || typeof matchId !== "number") {
    return {
      success: false,
      message: "Invalid input: User ID and Match ID must be numbers.",
    };
  }

  const directQuery = `
      EXEC dbo.AddUserToMatch
          @UserID = @UserID,
          @MatchID = @MatchID
  `;

  const directParams = {
    UserID: userId,
    MatchID: matchId,
  };
  await executeQuery(directQuery, directParams);
  return { success: true, message: "User processed for match team." };
}

async function startGame({ joinCode, userId }) {
  return await withTransaction(async ({ transaction }) => {
    const matchInfoResult = await new sql.Request(transaction).input(
      "JoinCode",
      joinCode
    ).query(`
        SELECT 
          m.id AS matchId,
          m.status_id AS matchStatusId,
          ms.status AS matchStatus,
          mp.user_id AS creatorId
        FROM Matches m
        JOIN MatchStatus ms ON ms.id = m.status_id
        JOIN MatchParticipants mp ON mp.match_id = m.id
        JOIN MatchParticipantsStatus s ON s.id = mp.match_participants_status_id
        WHERE m.join_code = @JoinCode AND s.status = 'Creator'
      `);

    if (matchInfoResult.recordset.length === 0) {
      throw new Error("Match not found or no creator exists");
    }

    const match = matchInfoResult.recordset[0];

    if (match.creatorId !== userId) {
      throw new Error("Only the creator can start the match");
    }

    if (match.matchStatus !== "Lobby") {
      throw new Error("Match is not in the Lobby stage and cannot be started");
    }

    await new sql.Request(transaction).input("MatchId", match.matchId).query(`
        UPDATE MatchParticipants
        SET match_participants_status_id = (
          SELECT id FROM MatchParticipantsStatus WHERE status = 'Playing'
        )
        WHERE match_id = @MatchId AND match_participants_status_id = (
          SELECT id FROM MatchParticipantsStatus WHERE status = 'WaitingStart'
        )
      `);

    await new sql.Request(transaction).input("MatchId", match.matchId).query(`
        UPDATE Matches
        SET status_id = (SELECT id FROM MatchStatus WHERE status = 'Ongoing'),
            started_at = GETDATE()
        WHERE id = @MatchId
      `);

    return { matchId: match.matchId };
  });
}

module.exports = {
  getMatchLobbyInformation,
  getMatchIdByJoinCode,
  addUserToLobby,
  startGame,
};
