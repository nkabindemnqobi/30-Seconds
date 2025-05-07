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

module.exports = { createLobby };
