CREATE OR ALTER PROCEDURE dbo.CalculateAndFinalizeMatchScores
    @JoinCode VARCHAR(10),
    @FinalizeMatch BIT -- Input parameter: 1 to finalize, 0 to only calculate scores
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
        -- == Step 0: Get MatchID from JoinCode ==
        SELECT @MatchID = id
        FROM dbo.Matches
        WHERE join_code = @JoinCode;

        IF @MatchID IS NULL
        BEGIN
            RAISERROR('Match with Join Code ''%s'' not found.', 16, 1, @JoinCode);
            RETURN;
        END;

        -- Start transaction only if we might perform updates
        IF @FinalizeMatch = 1
        BEGIN
            BEGIN TRANSACTION;
        END;

        -- == Step 1: Get current match status and 'Completed' status ID ==
        SELECT @CurrentMatchStatusID = m.status_id
        FROM dbo.Matches m
        WHERE m.id = @MatchID;

        IF @CurrentMatchStatusID IS NULL
        BEGIN
            RAISERROR('Match with ID %d (derived from Join Code ''%s'') unexpectedly not found during status check.', 16, 1, @MatchID, @JoinCode);
            IF @FinalizeMatch = 1 AND @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            RETURN;
        END;

        SELECT @CompletedStatusID_Match = id FROM dbo.MatchStatus WHERE status = 'Completed';
        IF @CompletedStatusID_Match IS NULL
        BEGIN
            RAISERROR('MatchStatus ''Completed'' not found. Cannot finalize match if requested.', 16, 1);
            IF @FinalizeMatch = 1 AND @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            RETURN;
        END;

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

        -- == Conditional Finalization Logic ==
        IF @FinalizeMatch = 1
        BEGIN
            -- Check if already completed (again, to ensure no redundant updates if called with Finalize=1 on already completed match)
            IF @CurrentMatchStatusID = @CompletedStatusID_Match
            BEGIN
                PRINT 'INFO: Match ID %d (Join Code ''' + @JoinCode + ''') is already completed. Finalization skipped, returning scores.';
                IF @@TRANCOUNT > 0 COMMIT TRANSACTION; -- Commit as no updates were needed from this block
                SELECT user_id, user_alias, total_score FROM #UserScores ORDER BY total_score DESC;
                DROP TABLE #UserScores;
                RETURN;
            END;

            -- == Step 3 (Finalize): Identify Max and Min Scores ==
            SELECT @MaxScore = MAX(total_score), @MinScore = MIN(total_score) FROM #UserScores;

            IF @MaxScore IS NULL SET @MaxScore = 0;
            IF @MinScore IS NULL SET @MinScore = 0;

            -- == Step 4 (Finalize): Get Participant Status IDs for 'Won' and 'Lost' ==
            SELECT @WonStatusID_Participant = id FROM dbo.MatchParticipantsStatus WHERE status = 'Won';
            SELECT @LostStatusID_Participant = id FROM dbo.MatchParticipantsStatus WHERE status = 'Lost';

            IF @WonStatusID_Participant IS NULL OR @LostStatusID_Participant IS NULL
            BEGIN
                RAISERROR('Participant statuses ''Won'' or ''Lost'' not found. Cannot update participant statuses for finalization.', 16, 1);
                IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
                DROP TABLE #UserScores;
                RETURN;
            END;

            -- == Step 5 (Finalize): Update Matches Table ==
            UPDATE dbo.Matches
            SET status_id = @CompletedStatusID_Match,
                completed_datetime = GETDATE()
            WHERE id = @MatchID;

            -- == Step 6 (Finalize): Update MatchParticipants Table for Winners ==
            UPDATE mp
            SET mp.match_participants_status_id = @WonStatusID_Participant
            FROM dbo.MatchParticipants mp
            INNER JOIN #UserScores us ON mp.user_id = us.user_id
            WHERE mp.match_id = @MatchID AND us.total_score = @MaxScore;

            -- == Step 7 (Finalize): Update MatchParticipants Table for Losers ==
            UPDATE mp
            SET mp.match_participants_status_id = @LostStatusID_Participant
            FROM dbo.MatchParticipants mp
            INNER JOIN #UserScores us ON mp.user_id = us.user_id
            WHERE mp.match_id = @MatchID
              AND us.total_score = @MinScore
              AND mp.match_participants_status_id != @WonStatusID_Participant; -- Avoid overwriting 'Won' if maxScore = minScore

            IF @@TRANCOUNT > 0 COMMIT TRANSACTION;
            PRINT 'INFO: Match ID %d (Join Code ''' + @JoinCode + ''') has been finalized.';
        END
        ELSE
        BEGIN
            -- @FinalizeMatch is 0, just print info that we are only fetching scores
            PRINT 'INFO: FinalizeMatch is false. Only calculating and returning scores for Match ID %d (Join Code ''' + @JoinCode + ''').';
        END;

        -- == Step 8: Return the calculated scores (always happens) ==
        SELECT user_id, user_alias, total_score FROM #UserScores ORDER BY total_score DESC;
        DROP TABLE #UserScores;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 AND @FinalizeMatch = 1 -- Only rollback if a transaction was started
            ROLLBACK TRANSACTION;
        IF OBJECT_ID('tempdb..#UserScores') IS NOT NULL
            DROP TABLE #UserScores;
        THROW;
    END CATCH
END;
