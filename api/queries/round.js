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

        const playerResult = await new sql.Request(transaction)
            .input('MatchId', matchId)
            .query(`
                WITH EligiblePlayers AS (
                SELECT mp.user_id
                FROM MatchParticipants mp
                JOIN MatchParticipantsStatus s ON s.id = mp.match_participants_status_id
                WHERE mp.match_id = @MatchId AND s.status IN ('Playing', 'Creator')
                ),
                PlayerRoundCounts AS (
                SELECT ep.user_id, COUNT(gr.id) AS rounds_played
                FROM EligiblePlayers ep
                LEFT JOIN GameRounds gr ON gr.match_id = @MatchId AND gr.guessing_user_id = ep.user_id
                GROUP BY ep.user_id
                ),
                LeastPlayed AS (
                SELECT user_id
                FROM PlayerRoundCounts
                WHERE rounds_played = (
                    SELECT MIN(rounds_played) FROM PlayerRoundCounts
                )
                )
                SELECT TOP 1 user_id FROM LeastPlayed ORDER BY user_id ASC;
            `);

        const guessingUserId = playerResult.recordset[0].user_id;

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
            roundId: insertResult.recordset[0].id,
            guessingUserId,
            guessingAlias: aliasQuery.recordset[0].alias,
            hint,
        };
    });
};

module.exports = { startRound };
