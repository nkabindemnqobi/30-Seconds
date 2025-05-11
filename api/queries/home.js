const { executeQuery } = require("../db/query");

async function fetchAllPublicLobbies() {
    const sqlQuery = `
    SELECT 
        m.id AS matchId,
        m.join_code AS joinCode,
        m.started_datetime AS startedDatetime,
        u.alias AS creatorAlias,
        m.max_participants AS maxParticipants,
        (
            SELECT COUNT(*) 
            FROM MatchParticipants mp 
            WHERE mp.match_id = m.id
            AND mp.match_participants_status_id IN (
                SELECT id FROM MatchParticipantsStatus WHERE status IN ('Creator', 'WaitingStart')
            )
        ) AS participantCount,
        c.id AS categoryId,
        c.name AS categoryName,
        bu.id AS bannedUserId,
        bu.alias AS bannedUserAlias
    FROM Matches m
    JOIN CategoriesMatches cm ON cm.match_id = m.id
    JOIN Categories c ON c.id = cm.category_id
    JOIN MatchParticipants mp_creator ON mp_creator.match_id = m.id
    JOIN Users u ON u.id = mp_creator.user_id
    JOIN MatchParticipantsStatus s_creator ON s_creator.id = mp_creator.match_participants_status_id AND s_creator.status = 'Creator'
    LEFT JOIN MatchParticipants mp_banned ON mp_banned.match_id = m.id AND mp_banned.match_participants_status_id = (
        SELECT id FROM MatchParticipantsStatus WHERE status = 'Barred'
    )
    LEFT JOIN Users bu ON bu.id = mp_banned.user_id
    WHERE m.is_public = 1
    AND m.status_id = (SELECT id FROM MatchStatus WHERE status = 'Lobby');
    `;

    return await executeQuery(sqlQuery);
}

module.exports = {
    fetchAllPublicLobbies,
};
