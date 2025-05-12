const { executeQuery } = require("../db/query");
const { sql } = require("../db/pool");

async function kickPlayer({sourceUserId, targetUserId, matchId}) {
  if (
    typeof sourceUserId !== "number" ||
    typeof matchId !== "number" ||
    typeof targetUserId !== "number"
  ) {
    console.error(
      "Invalid userId, matchId, targetUserId provided to addUserToLobby."
    );
    return {
      success: false,
      message: "Invalid input: User ID and Match ID must be numbers.",
    };
  }

  const query = `
      EXEC dbo.KickUserFromMatch
          @SourceUserID = @SourceUserID,
          @MatchID = @MatchID,
          @TargetUserID = @TargetUserID
        `;
  const params = {
    SourceUserID: sourceUserId,
    TargetUserID: targetUserId,
    MatchID: matchId,
  };

  const result = await executeQuery(query, params);


    return {
      success: true,
      message: `User with userID ${targetUserId} has been successfully kicked and banned from the lobby.`,
    };
}

module.exports = {
    kickPlayer
}
