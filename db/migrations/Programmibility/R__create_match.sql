-- CREATE OR ALTER PROCEDURE AddMatchWithTeams
--     @Teams NVARCHAR(MAX),
--     @IsPublic BIT,
--     @MatchCreatorId INT,
--     @StatusId INT,
--     @MaxParticipants INT
-- AS
-- BEGIN
--     SET NOCOUNT ON;

--     DECLARE @MatchId INT;
--     DECLARE @JoinCode VARCHAR(6);
--     DECLARE @Chars AS VARCHAR(36) = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

--     SET @JoinCode = '';
--     WHILE (@JoinCode = '' OR EXISTS (SELECT 1 FROM Matches WHERE join_code = @JoinCode))
--     BEGIN
--         SET @JoinCode = '';
--         WHILE LEN(@JoinCode) < 6
--         BEGIN
--             SET @JoinCode = @JoinCode + SUBSTRING(@Chars, (ABS(CHECKSUM(NEWID())) % 36) + 1, 1);
--         END;
--     END;

--     INSERT INTO Matches (join_code, is_public, match_creator_id, status_id, max_participants)
--     VALUES (@JoinCode, @IsPublic, @MatchCreatorId, @StatusId, @MaxParticipants);

--     SET @MatchId = SCOPE_IDENTITY();

--     CREATE TABLE #NewTeams (TeamId INT);

--     INSERT INTO Teams (captain_id, is_open, team_name)
--     OUTPUT inserted.id INTO #NewTeams (TeamId)
--     SELECT 
--         CASE WHEN JSON_VALUE(value, '$.captainId') = 'null' THEN NULL ELSE JSON_VALUE(value, '$.captainId') END AS CaptainId,
--         1 AS is_open,
--         JSON_VALUE(value, '$.teamName') AS TeamName
--     FROM OPENJSON(@Teams);

--     INSERT INTO MatchTeams (match_id, team_id)
--     SELECT @MatchId, TeamId
--     FROM #NewTeams;

--     DROP TABLE #NewTeams;
-- END;