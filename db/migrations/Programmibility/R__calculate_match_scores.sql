CREATE OR ALTER PROCEDURE dbo.CalculateMatchScores
    @JoinCode VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MatchID INT;
    DECLARE @BarredStatusID INT;
    DECLARE @CompletedStatusID INT;

    -- == Get the 'Barred' status ID ==
    SELECT @BarredStatusID = id
    FROM dbo.MatchParticipantsStatus
    WHERE status = 'Barred';

    IF @BarredStatusID IS NULL
    BEGIN
        RAISERROR('The participant status ''Barred'' was not found in the MatchParticipantsStatus table. Cannot accurately determine active participants.', 16, 1);
        RETURN;
    END

    -- == Get the 'Completed' match status ID ==
    SELECT @CompletedStatusID = id
    FROM dbo.MatchStatus
    WHERE status = 'Completed';

    IF @CompletedStatusID IS NULL
    BEGIN
        RAISERROR('The match status ''COMPLETED'' was not found in the MatchStatus table. Cannot accurately determine game status.', 16, 1);
        RETURN;
    END

    -- Get the matchId from the join_code ==
    SELECT @MatchID = id
    FROM dbo.Matches
    WHERE join_code = @JoinCode;

    -- Check if MatchID is valid
    IF NOT EXISTS (SELECT 1 FROM dbo.Matches WHERE id = @MatchID)
    BEGIN
        RAISERROR('Match with ID %d not found.', 16, 1, @MatchID);
        RETURN;
    END

    -- Update the match to be completed.
    UPDATE dbo.Matches SET status_id = @CompletedStatusID WHERE id = @MatchID;

    -- Calculate scores
    SELECT
        u.id AS user_id,
        u.alias AS user_alias,
        ISNULL(SUM(
            -- Calculate base score for the round (points start at 1000, minus 80 for each wrong guess/hint after the first)
            -- Ensure base score is not negative
            (CASE
                WHEN (1000 - ( (gr.hint_count - 1) * 80 )) < 0 THEN 0
                ELSE (1000 - ( (gr.hint_count - 1) * 80 ))
            END)
            *
            -- Calculate time multiplier (time remaining / 30 seconds)
            -- Ensure time remaining is not negative (score becomes 0 if time exceeded)
            (CASE
                WHEN (30000.0 - gr.time_in_ms) < 0 THEN 0.0
                ELSE (30000.0 - gr.time_in_ms) / 30000.0
            END)
        ), 0) AS total_score -- ISNULL for users who might be in MatchParticipants but have no GameRounds
    FROM
        dbo.Users u
    INNER JOIN
        dbo.MatchParticipants mp ON u.id = mp.user_id
    LEFT JOIN
        dbo.GameRounds gr ON mp.user_id = gr.guessing_user_id AND gr.match_id = mp.match_id
    WHERE
        mp.match_id = @MatchID AND mp.match_participants_status_id != @BarredStatusID
    GROUP BY
        u.id, u.alias
    ORDER BY
        total_score DESC;

END;