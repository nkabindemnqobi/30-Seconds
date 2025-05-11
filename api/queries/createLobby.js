const { getPool, sql } = require("../db/pool");
const { executeQuery } = require('../db/query');
const { withTransaction } = require("../db/transaction");
const { v4: uuidv4 } = require("uuid");

async function getAllCategoriesFromDb() {
  const query = 'SELECT * FROM Categories';
  return await executeQuery(query);
}

function generateJoinCode() {
  return uuidv4().slice(0, 8).toUpperCase();
}

async function createLobby({ userId, categoryIds, isPublic, maxParticipants, lobbyName }) {
  const pool = await getPool();

  return await withTransaction(async (transaction) => {
    let joinCode;
    let matchId;

    while (true) {
      joinCode = generateJoinCode();
      const check = await pool.request()
        .input("JoinCode", joinCode)
        .query("SELECT id FROM Matches WHERE join_code = @JoinCode");

      if (check.recordset.length === 0) break;
    }

    const matchRequest = new sql.Request(transaction.connection);
    const matchInsertResult = await matchRequest
      .input("JoinCode", joinCode)
      .input("IsPublic", isPublic ? 1 : 0)
      .input("MaxParticipants", maxParticipants)
      .input("LobbyName", lobbyName)
      .query(`
        INSERT INTO Matches (join_code, is_public, max_participants, lobby_name, status_id)
        OUTPUT INSERTED.id
        VALUES (
          @JoinCode,
          @IsPublic,
          @MaxParticipants,
          @LobbyName,
          (SELECT id FROM MatchStatus WHERE status = 'Lobby')
        );
      `);

    matchId = matchInsertResult.recordset[0].id;

    const bulkInsertCategoriesRequest = new sql.Request(transaction.connection);
    await bulkInsertCategoriesRequest
      .input("MatchId", matchId)
      .input("CategoriesJson", JSON.stringify(categoryIds))
      .query(`
        INSERT INTO CategoriesMatches (match_id, category_id)
        SELECT @MatchId, value
        FROM OPENJSON(@CategoriesJson)
      `);


    const creatorRequest = new sql.Request(transaction.connection);
    await creatorRequest
      .input("MatchId", matchId)
      .input("UserId", userId)
      .query(`
        INSERT INTO MatchParticipants (match_id, user_id, match_participants_status_id)
        VALUES (
          @MatchId,
          @UserId,
          (SELECT id FROM MatchParticipantsStatus WHERE status = 'Creator')
        );
      `);

    return joinCode;
  });
}


module.exports = {
  getAllCategoriesFromDb,
  createLobby,
};
