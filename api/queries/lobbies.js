const { executeQuery } = require("../db/query");
const {formatMatchWithParticipants} = require("../utils/lobbyInfoFormatter");

async function createLobby(
  isPublic,
  matchCreatorId,
  statusId,
  maxParticipants,
  teams
) {
  const isPublicValue = isPublic === 1 || isPublic === true ? 1 : 0;
  const teamsJson = JSON.stringify(teams);
  const query = `
      EXEC AddMatchWithTeams
          @IsPublic = @IsPublic,
          @MatchCreatorId = @MatchCreatorId,
          @StatusId = @StatusId,
          @MaxParticipants = @MaxParticipants,
          @Teams = @TeamList;
    `;

  const params = {
    IsPublic: isPublicValue,
    MatchCreatorId: matchCreatorId,
    StatusId: statusId,
    MaxParticipants: maxParticipants,
    TeamList: teamsJson,
  };

  await executeQuery(query, params);
}

async function getMatchLobbyInformation(matchId) {
  if (typeof matchId !== "number") {
      console.error("Invalid matchId provided to getMatchLobbyInfo.");
      return {
          success: false,
          message: "Invalid input: Match ID must be a number.",
          data: null
      };
  }
  const getMatchLobbyInfoQuery = `
      SELECT
          -- Match Details
          m.id AS match_id,
          m.join_code,
          m.lobby_name,
          m.is_public,
          m.max_participants,
          m.started_datetime,
          m.completed_datetime,
          m.status_id,          -- Match Status ID
          ms.status AS match_status, -- Match Status string

          -- Participant Details (LEFT JOIN to include the match even if no participants yet)
          mp.id AS match_participant_id,      -- ID from MatchParticipants table
          mp.user_id AS participant_user_id,
          pu.alias AS participant_alias,
          pu.email AS participant_email,
          mp.match_participants_status_id, -- Participant Status ID
          mps.status AS participant_status   -- Participant Status string

      FROM dbo.Matches m
      INNER JOIN dbo.MatchStatus ms ON m.status_id = ms.id

      LEFT JOIN dbo.MatchParticipants mp ON m.id = mp.match_id
      LEFT JOIN dbo.Users pu ON mp.user_id = pu.id
      LEFT JOIN dbo.MatchParticipantsStatus mps ON mp.match_participants_status_id = mps.id

      WHERE m.id = @matchId  -- Parameter for the specific match ID
      ORDER BY m.id, pu.id;  -- Consistent ordering
  `;

  try {
      const resultRows = await executeQuery(getMatchLobbyInfoQuery, { matchId: matchId });
      console.log(resultRows);

      if (resultRows && resultRows.length > 0) {
          const formattedData = formatMatchWithParticipants(resultRows);
          if (formattedData) {
              return { success: true, message: "Lobby information fetched successfully.", data: formattedData };
          } else {
               return { success: false, message: "Failed to format lobby data.", data: null };
          }
      } else {
          return { success: false, message: "Match not found or no data returned.", data: null };
      }
  } catch (err) {
      console.error("Error in getMatchLobbyInformation for matchId " + matchId + ":", err);
      return { success: false, message: err.message || "An error occurred while fetching lobby information.", data: null, error: err };
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
    console.error("Invalid userId or matchId provided to addUserToLobby.");
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
    MatchID: matchId
  };
  await executeQuery(directQuery, directParams);
  console.log(
    `Attempt to add user ${userId} to match ${matchId} successful (or user was already in team).`
  );
  return { success: true, message: "User processed for match team." };
}

module.exports = {
  createLobby,
  getMatchLobbyInformation,
  getMatchIdByJoinCode,
  addUserToLobby,
};
