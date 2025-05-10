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
  const getLobbyInformationQuery = `
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

  return await executeQuery(getLobbyInformationQuery, { MatchId: matchId });
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
