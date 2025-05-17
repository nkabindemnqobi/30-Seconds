const { sql } = require('../db/pool');
const { withTransaction } = require('../db/transaction');
const { generateHint } = require('../services/aiGenerator');

const startRound = async (joinCode) => {
  return await withTransaction(async ({ transaction }) => {
    const matchQuery = await new sql.Request(transaction)
      .input('JoinCode', joinCode)
      .query(`SELECT id FROM Matches WHERE join_code = @JoinCode`);

    if (matchQuery.recordset.length === 0) {
      throw new Error('Invalid join code');
    }

    const matchId = matchQuery.recordset[0].id;

    const activeRoundResult = await new sql.Request(transaction)
      .input('MatchId', matchId)
      .query(`
                SELECT TOP 1 id
                FROM GameRounds
                WHERE match_id = @MatchId AND ended_datetime IS NULL
            `);

    if (activeRoundResult.recordset.length > 0) {
      throw new Error('A round is already in progress.');
    }

    const roundCountsResult = await new sql.Request(transaction)
      .input('MatchId', matchId)
      .query(`
            WITH EligiblePlayers AS (
              SELECT mp.user_id
              FROM MatchParticipants mp
              JOIN MatchParticipantsStatus s ON s.id = mp.match_participants_status_id
              WHERE mp.match_id = @MatchId AND s.status IN ('Playing', 'Creator')
            )
            SELECT ep.user_id, COUNT(gr.id) AS rounds_played
            FROM EligiblePlayers ep
            LEFT JOIN GameRounds gr ON gr.match_id = @MatchId AND gr.guessing_user_id = ep.user_id
            GROUP BY ep.user_id
          `);

    const allPlayedThree = roundCountsResult.recordset.every(p => p.rounds_played >= 3);

    if (allPlayedThree) {
      const scoresResult = await new sql.Request(transaction)
        .input('MatchId', matchId)
        .query(`
              SELECT guessing_user_id AS user_id, SUM(points_awarded) AS score
              FROM GameRounds
              WHERE match_id = @MatchId
              GROUP BY guessing_user_id
            `);

      const scores = scoresResult.recordset;
      const maxScore = Math.max(...scores.map(s => s.score));
      const minScore = Math.min(...scores.map(s => s.score));

      const winners = scores.filter(s => s.score === maxScore).map(s => s.user_id);
      const losers = scores.filter(s => s.score === minScore).map(s => s.user_id);

      await new sql.Request(transaction)
        .input('MatchId', matchId)
        .query(`
              UPDATE Matches
              SET status_id = (SELECT id FROM MatchStatus WHERE status = 'Completed'),
                  completed_datetime = GETDATE()
              WHERE id = @MatchId
            `);

      const statusIdsResult = await new sql.Request(transaction)
        .query(`
                SELECT id, status FROM MatchParticipantsStatus 
                WHERE status IN ('Won', 'Lost')
              `);

      const statusMap = {};
      for (const row of statusIdsResult.recordset) {
        statusMap[row.status] = row.id;
      }

      const updatePromises = [];

      for (const userId of winners) {
        updatePromises.push(
          new sql.Request(transaction)
            .input('UserId', userId)
            .input('MatchId', matchId)
            .input('StatusId', statusMap['Won'])
            .query(`
                    UPDATE MatchParticipants
                    SET match_participants_status_id = @StatusId
                    WHERE match_id = @MatchId AND user_id = @UserId
                  `)
        );
      }

      for (const userId of losers) {
        updatePromises.push(
          new sql.Request(transaction)
            .input('UserId', userId)
            .input('MatchId', matchId)
            .input('StatusId', statusMap['Lost'])
            .query(`
                    UPDATE MatchParticipants
                    SET match_participants_status_id = @StatusId
                    WHERE match_id = @MatchId AND user_id = @UserId
                  `)
        );
      }

      await Promise.all(updatePromises);

      return {
        gameEnded: true,
        winners,
        losers
      };
    }

    const leastPlayed = roundCountsResult.recordset.reduce((least, curr) =>
      curr.rounds_played < least.rounds_played ? curr : least
    );
    const guessingUserId = leastPlayed.user_id;

    const itemQuery = await new sql.Request(transaction)
      .input('MatchId', matchId)
      .query(`
                SELECT gi.id, gi.item_name, c.name AS category
                FROM GuessingItems gi
                JOIN Categories c ON c.id = gi.category_id
                JOIN CategoriesMatches cm ON cm.category_id = c.id
                WHERE cm.match_id = @MatchId
                AND gi.id NOT IN (
                SELECT guessing_item_id FROM GameRounds WHERE match_id = @MatchId
                )
            `);

    const items = itemQuery.recordset;

    if (!items || items.length === 0) {
      throw new Error('No more unused items left');
    }

    const item = items[Math.floor(Math.random() * items.length)];

    const hint = await generateHint(item.item_name, item.category);

    const insertResult = await new sql.Request(transaction)
      .input('MatchId', matchId)
      .input('UserId', guessingUserId)
      .input('ItemId', item.id)
      .query(`
                INSERT INTO GameRounds (match_id, guessing_user_id, guessing_item_id, timer_started)
                OUTPUT INSERTED.id
                VALUES (@MatchId, @UserId, @ItemId, GETDATE())
            `);

    const aliasQuery = await new sql.Request(transaction)
      .input('UserId', guessingUserId)
      .query(`SELECT alias FROM Users WHERE id = @UserId`);

    return {
      gameEnded: false,
      roundId: insertResult.recordset[0].id,
      guessingUserId,
      guessingAlias: aliasQuery.recordset[0].alias,
      hint,
    };
  });
};

const makeGuess = async (joinCode, userId, guessInput) => {
  return await withTransaction(async ({ transaction }) => {
    const matchQuery = await new sql.Request(transaction)
      .input('JoinCode', joinCode)
      .query(`SELECT id FROM Matches WHERE join_code = @JoinCode`);

    if (matchQuery.recordset.length === 0) {
      throw new Error('Invalid join code');
    }

    const matchId = matchQuery.recordset[0].id;

    const roundQuery = await new sql.Request(transaction)
      .input('MatchId', matchId)
      .query(`
        SELECT TOP 1 gr.id AS roundId, gr.guessing_user_id, gi.item_name, u.alias
        FROM GameRounds gr
        JOIN GuessingItems gi ON gi.id = gr.guessing_item_id
        JOIN Users u ON u.id = gr.guessing_user_id
        WHERE gr.match_id = @MatchId AND gr.ended_datetime IS NULL
      `);

    if (roundQuery.recordset.length === 0) {
      throw new Error('No active round in progress');
    }

    const round = roundQuery.recordset[0];

    if (round.guessing_user_id !== userId) {
      throw new Error('It is not your turn to guess');
    }

    const normalizedGuess = guessInput.toLowerCase().trim();
    const normalizedAnswer = round.item_name.toLowerCase().trim();

    const isCorrect = normalizedGuess === normalizedAnswer;

    if (isCorrect) {
      await new sql.Request(transaction)
        .input('RoundId', round.roundId)
        .query(`
          UPDATE GameRounds
          SET ended_datetime = GETDATE(), points_awarded = 1
          WHERE id = @RoundId
        `);
    }

    return {
      roundId: round.roundId,
      guessingUserId: round.guessing_user_id,
      guessingAlias: round.alias,
      itemName: isCorrect ? round.item_name : undefined,
      correct: isCorrect,
      message: isCorrect ? "Correct guess!" : "Incorrect guess."
    };
  });
};

module.exports = { startRound, makeGuess };
