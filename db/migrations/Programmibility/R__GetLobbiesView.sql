IF OBJECT_ID('dbo.PublicLobbyView', 'V') IS NOT NULL
    DROP VIEW dbo.PublicLobbyView;
GO

CREATE VIEW PublicLobbyView AS
SELECT 
    m.id AS matchId,
    m.join_code AS joinCode,
    m.lobby_name AS lobbyName,
    m.started_at AS startedAt,
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
    bu.alias AS bannedUserAlias,
    m.is_public AS isPublic,
    m.status_id AS matchStatusId,
    m.completed_at
FROM Matches m
JOIN CategoriesMatches cm ON cm.match_id = m.id
JOIN Categories c ON c.id = cm.category_id
JOIN MatchParticipants mp_creator ON mp_creator.match_id = m.id
JOIN Users u ON u.id = mp_creator.user_id
JOIN MatchParticipantsStatus s_creator 
    ON s_creator.id = mp_creator.match_participants_status_id 
    AND s_creator.status = 'Creator'
LEFT JOIN MatchParticipants mp_banned 
    ON mp_banned.match_id = m.id 
    AND mp_banned.match_participants_status_id = (
        SELECT id FROM MatchParticipantsStatus WHERE status = 'Barred'
    )
LEFT JOIN Users bu ON bu.id = mp_banned.user_id;