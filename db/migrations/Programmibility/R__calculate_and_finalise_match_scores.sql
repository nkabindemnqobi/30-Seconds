-- This proc is responsible for calculating each player's score, setting their statuses, and updating the match status.
CREATE OR ALTER PROCEDURE dbo.CalculateAndFinalizeMatchScores
    @JoinCode VARCHAR(10) 
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MatchID INT; 

    DECLARE @CompletedStatusID_Match INT;
    DECLARE @WonStatusID_Participant INT;
    DECLARE @LostStatusID_Participant INT;
    DECLARE @CurrentMatchStatusID INT;

    DECLARE @MaxScore INT;
    DECLARE @MinScore INT;

    -- Temporary table to hold calculated scores
    CREATE TABLE #UserScores (
        user_id INT PRIMARY KEY,
        user_alias VARCHAR(20),
        total_score INT 
    );

    BEGIN TRY
        BEGIN TRANSACTION;

        -- == Step 0: Get MatchID from JoinCode ==
        SELECT @MatchID = id
        FROM dbo.Matches
        WHERE join_code = @JoinCode;

        IF @MatchID IS NULL
        BEGIN
            RAISERROR('Match with Join Code ''%s'' not found.', 16, 1, @JoinCode);
            RETURN;
        END

        -- == Step 1: Validate MatchID and check if already completed ==
        SELECT @CurrentMatchStatusID = m.status_id
        FROM dbo.Matches m
        WHERE m.id = @MatchID; 

        IF @CurrentMatchStatusID IS NULL
        BEGIN
            RAISERROR('Match with ID %d (derived from Join Code ''%s'') unexpectedly not found during status check.', 16, 1, @MatchID, @JoinCode);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        SELECT @CompletedStatusID_Match = id FROM dbo.MatchStatus WHERE status = 'Completed';
        IF @CompletedStatusID_Match IS NULL
        BEGIN
            RAISERROR('MatchStatus ''Completed'' not found. Cannot finalize match.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @CurrentMatchStatusID = @CompletedStatusID_Match
        BEGIN
            PRINT 'INFO: Match ID %d (Join Code ''' + @JoinCode + ''') is already completed. Scores will be returned without further updates.';
            -- Populate #UserScores for return if already completed
            INSERT INTO #UserScores (user_id, user_alias, total_score)
            SELECT
                u.id AS user_id,
                u.alias AS user_alias,
                CAST(ROUND(
                    ISNULL(SUM( -- Hint request = -80. Scale by ratio of time used in round.
                        (CASE WHEN (1000 - ((gr.hint_count - 1) * 80)) < 0 THEN 0 ELSE (1000 - ((gr.hint_count - 1) * 80)) END) *
                        (CASE WHEN (30000.0 - gr.time_in_ms) < 0 THEN 0.0 ELSE (30000.0 - gr.time_in_ms) / 30000.0 END)
                    ), 0)
                , 0) AS INT) AS total_score
            FROM dbo.Users u
            INNER JOIN dbo.MatchParticipants mp ON u.id = mp.user_id
            LEFT JOIN dbo.GameRounds gr ON mp.user_id = gr.guessing_user_id AND gr.match_id = mp.match_id
            WHERE mp.match_id = @MatchID
            GROUP BY u.id, u.alias;

            COMMIT TRANSACTION;
            SELECT user_id, user_alias, total_score FROM #UserScores ORDER BY total_score DESC;
            DROP TABLE #UserScores;
            RETURN;
        END

        -- == Step 2: Calculate Scores and store them (rounded to INT) ==
        INSERT INTO #UserScores (user_id, user_alias, total_score)
        SELECT
            u.id AS user_id,
            u.alias AS user_alias,
            CAST(ROUND(
                ISNULL(SUM(
                    (CASE
                        WHEN (1000 - ( (gr.hint_count - 1) * 80 )) < 0 THEN 0
                        ELSE (1000 - ( (gr.hint_count - 1) * 80 ))
                    END)
                    *
                    (CASE
                        WHEN (30000.0 - gr.time_in_ms) < 0 THEN 0.0
                        ELSE (30000.0 - gr.time_in_ms) / 30000.0
                    END)
                ), 0)
            , 0) AS INT) AS total_score
        FROM
            dbo.Users u
        INNER JOIN
            dbo.MatchParticipants mp ON u.id = mp.user_id
        LEFT JOIN
            dbo.GameRounds gr ON mp.user_id = gr.guessing_user_id AND gr.match_id = mp.match_id
        WHERE
            mp.match_id = @MatchID
        GROUP BY
            u.id, u.alias;

        -- == Step 3: Identify Max and Min Scores ==
        SELECT @MaxScore = MAX(total_score), @MinScore = MIN(total_score) FROM #UserScores;

        IF @MaxScore IS NULL SET @MaxScore = 0;
        IF @MinScore IS NULL SET @MinScore = 0;

        -- == Step 4: Get Participant Status IDs for 'Won' and 'Lost' ==
        SELECT @WonStatusID_Participant = id FROM dbo.MatchParticipantsStatus WHERE status = 'Won';
        SELECT @LostStatusID_Participant = id FROM dbo.MatchParticipantsStatus WHERE status = 'Lost';

        IF @WonStatusID_Participant IS NULL OR @LostStatusID_Participant IS NULL
        BEGIN
            RAISERROR('Participant statuses ''Won'' or ''Lost'' not found. Cannot update participant statuses.', 16, 1);
            ROLLBACK TRANSACTION;
            DROP TABLE #UserScores;
            RETURN;
        END

        -- == Step 5: Update Matches Table ==
        UPDATE dbo.Matches
        SET status_id = @CompletedStatusID_Match,
            completed_at = GETDATE()
        WHERE id = @MatchID;

        -- == Step 6: Update MatchParticipants Table for Winners ==
        UPDATE mp
        SET mp.match_participants_status_id = @WonStatusID_Participant
        FROM dbo.MatchParticipants mp
        INNER JOIN #UserScores us ON mp.user_id = us.user_id
        WHERE mp.match_id = @MatchID AND us.total_score = @MaxScore;

        -- == Step 7: Update MatchParticipants Table for Losers ==
        UPDATE mp
        SET mp.match_participants_status_id = @LostStatusID_Participant
        FROM dbo.MatchParticipants mp
        INNER JOIN #UserScores us ON mp.user_id = us.user_id
        WHERE mp.match_id = @MatchID
          AND us.total_score = @MinScore
          AND mp.match_participants_status_id != @WonStatusID_Participant;

        COMMIT TRANSACTION;

        -- == Step 8: Return the calculated scores ==
        SELECT user_id, user_alias, total_score FROM #UserScores ORDER BY total_score DESC;
        DROP TABLE #UserScores;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        IF OBJECT_ID('tempdb..#UserScores') IS NOT NULL
            DROP TABLE #UserScores;
        THROW;
    END CATCH
END;
