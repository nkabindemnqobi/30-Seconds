const { executeQuery } = require('../db/query');

async function getAllPublicLobbies(req, res) {
    const sqlQuery = `
        SELECT 
            m.id AS matchId,
            m.join_code AS joinCode,
            m.started_datetime AS startedDatetime,
            c.id AS categoryId,
            c.name AS categoryName,
            u.alias AS creatorAlias,
            m.max_participants AS maxParticipants,
            (
                SELECT COUNT(*) 
                FROM MatchParticipants mp 
                WHERE mp.user_id IS NOT NULL AND mp.team_id IN (m.team_a_id, m.team_b_id)
            ) AS participantCount,
            bu.id AS bannedUserId,
            bu.alias AS bannedUserAlias
        FROM Matches m
        JOIN CategoriesMatches cm ON m.id = cm.match_id
        JOIN Categories c ON cm.category_id = c.id
        JOIN Users u ON u.id = m.match_creator_id
        LEFT JOIN MatchParticipants bmp ON bmp.team_id IN (m.team_a_id, m.team_b_id) AND bmp.is_barred = 1
        LEFT JOIN Users bu ON bu.id = bmp.user_id
        WHERE m.is_public = 1;
    `;


    try {
        const result = await executeQuery(sqlQuery);

        const lobbiesMap = new Map();

        for (const row of result) {
            const {
                matchId, joinCode, startedDatetime, categoryId,
                categoryName, creatorAlias, maxParticipants,
                participantCount, bannedUserId, bannedUserAlias,
            } = row;

            if (!lobbiesMap.has(matchId)) {
                lobbiesMap.set(matchId, {
                    matchId,
                    joinCode,
                    startedDatetime,
                    creatorAlias,
                    maxParticipants,
                    participantCount,
                    categories: [],
                    bannedUsers: [],
                });
            }

            const lobby = lobbiesMap.get(matchId);

            if (!lobby.categories.some(c => c.id === categoryId)) {
                lobby.categories.push({ id: categoryId, name: categoryName });
            }

            if (bannedUserId && !lobby.bannedUsers.some(u => u.id === bannedUserId)) {
                lobby.bannedUsers.push({ id: bannedUserId, alias: bannedUserAlias });
            }
        }

        res.json(Array.from(lobbiesMap.values()));
    } catch (err) {
        console.error('Error fetching lobbies:', err);
        res.status(500).send('Failed to fetch public lobbies');
    }
}

module.exports = {
    getAllPublicLobbies,
};
