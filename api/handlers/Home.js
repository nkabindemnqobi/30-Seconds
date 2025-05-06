const { executeQuery } = require('../db/query');
const formatErrorResponse = require('../utils/formatErrorResponse');

const getAllPublicLobbies = async (req, res) => {
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

        if (!result || result.length === 0) {
            return res.status(404).json({ message: 'No public lobbies found' });
        }

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

        res.status(200).json(Array.from(lobbiesMap.values()));
    } catch (err) {
        const { status, error, reason } = formatErrorResponse(err, 'Public Lobbies');
        res.status(status).json({ error, reason });
    }
};

module.exports = {
    getAllPublicLobbies,
};
