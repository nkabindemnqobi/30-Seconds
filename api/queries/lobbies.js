const { executeQuery } = require("../db/query");

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

async function getLobbyInformation(matchId) {
  const query = `
    SELECT
      m.id AS match_id,
      m.join_code,
      m.is_public,
      m.lobby_name,
      m.match_creator_id,
      creator.alias AS match_creator_alias,
      creator.email AS match_creator_email,
      m.status_id,
      ms.status AS match_status,
      m.max_participants,
      m.started_datetime,
      m.completed_datetime,
      p.id AS participant_user_id,
      p.alias AS participant_alias,
      p.email AS participant_email,
      mps.status AS participant_status
    FROM Matches m
    JOIN MatchStatus ms ON ms.id = m.status_id
    JOIN MatchParticipants mp ON mp.match_id = m.id
    JOIN Users p ON p.id = mp.user_id
    JOIN MatchParticipantsStatus mps ON mps.id = mp.match_participants_status_id
    JOIN Users creator ON creator.id = (
      SELECT user_id
      FROM MatchParticipants
      WHERE match_id = m.id AND match_participants_status_id = (
        SELECT id FROM MatchParticipantsStatus WHERE status = 'Creator'
      )
    )
    WHERE m.id = @MatchId
    ORDER BY p.id;
  `;

  return await executeQuery(query, { MatchId: matchId });
}


async function getMatchIdByJoinCode(joinCode) {
  const matchIdQuery = `
    SELECT id FROM matches
    WHERE join_code = @joinCode;
  `;
  return await executeQuery(matchIdQuery, { JoinCode: joinCode });
}

async function addUserToLobby(
  userId,
  matchId,
  teamPreferenceChar,
  isBarred = false
) {
  if (typeof userId !== "number" || typeof matchId !== "number") {
    console.error("Invalid userId or matchId provided to addUserToLobby.");
    return {
      success: false,
      message: "Invalid input: User ID and Match ID must be numbers.",
    };
  }
  if (teamPreferenceChar !== "A" && teamPreferenceChar !== "B") {
    console.error("Invalid teamPreferenceChar provided to addUserToLobby.");
    return {
      success: false,
      message: 'Invalid input: Team preference must be "A" or "B".',
    };
  }

  const directQuery = `
      EXEC dbo.AddUserToMatchTeam
          @UserID = @UserID,
          @MatchID = @MatchID,
          @TeamPreference = @TeamPreference,
          @IsBarred = @IsBarred;
  `;

  const directParams = {
    UserID: userId,
    MatchID: matchId,
    TeamPreference: teamPreferenceChar,
    IsBarred: isBarred,
  };
  await executeQuery(directQuery, directParams);
  console.log(
    `Attempt to add user ${userId} to match ${matchId}, team ${teamPreferenceChar} successful (or user was already in team).`
  );
  return { success: true, message: "User processed for match team." };
}

// NOT USED... YET
async function checkIfUserInLobby(userId, teamId) {
  const checkQuery = `
        SELECT id FROM match_participants
        WHERE user_id = @userId AND team_id = @teamId;
      `;
  const params = { UserId: userId, TeamId: teamId };

  await executeQuery(checkQuery, params);
}

module.exports = {
  createLobby,
  getLobbyInformation,
  getMatchIdByJoinCode,
  addUserToLobby,
  checkIfUserInLobby,
};
