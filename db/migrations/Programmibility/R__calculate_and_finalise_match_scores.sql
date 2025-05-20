IF OBJECT_ID('dbo.CalculateAndFinalizeMatchScores', 'P') IS NOT NULL
    DROP PROCEDURE dbo.CalculateAndFinalizeMatchScores;
GO

CREATE OR ALTER PROCEDURE dbo.CalculateAndFinalizeMatchScores
    @JoinCode VARCHAR(10),
    @FinalizeMatch BIT 
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

    
    CREATE TABLE #UserScores (
        user_id INT PRIMARY KEY,
        user_alias VARCHAR(50),
        total_score INT
    );

    BEGIN TRY
        
        SELECT @MatchID = id
        FROM dbo.Matches
        WHERE join_code = @JoinCode;

        IF @MatchID IS NULL
        BEGIN
            RAISERROR('Match with Join Code ''%s'' not found.', 16, 1, @JoinCode);
            RETURN;
        END;

        
        IF @FinalizeMatch = 1
        BEGIN
            BEGIN TRANSACTION;
        END;

        
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
                        
                        
                        WHEN gr.ended_at IS NULL OR gr.timer_started_at IS NULL THEN 0.0
                        
                        
                        WHEN (30.0 - DATEDIFF(second, gr.timer_started_at, gr.ended_at)) < 0 THEN 0.0
                        ELSE (30.0 - DATEDIFF(second, gr.timer_started_at, gr.ended_at)) / 30.0
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

        
        IF @FinalizeMatch = 1
        BEGIN
            
            IF @CurrentMatchStatusID = @CompletedStatusID_Match
            BEGIN
                PRINT 'INFO: Match ID %d (Join Code ''' + @JoinCode + ''') is already completed. Finalization skipped, returning scores.';
                IF @@TRANCOUNT > 0 COMMIT TRANSACTION; 
                SELECT user_id, user_alias, total_score FROM #UserScores ORDER BY total_score DESC;
                DROP TABLE #UserScores;
                RETURN;
            END;

            
            SELECT @MaxScore = MAX(total_score), @MinScore = MIN(total_score) FROM #UserScores;

            IF @MaxScore IS NULL SET @MaxScore = 0;
            IF @MinScore IS NULL SET @MinScore = 0;

            
            SELECT @WonStatusID_Participant = id FROM dbo.MatchParticipantsStatus WHERE status = 'Won';
            SELECT @LostStatusID_Participant = id FROM dbo.MatchParticipantsStatus WHERE status = 'Lost';

            IF @WonStatusID_Participant IS NULL OR @LostStatusID_Participant IS NULL
            BEGIN
                RAISERROR('Participant statuses ''Won'' or ''Lost'' not found. Cannot update participant statuses for finalization.', 16, 1);
                IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
                DROP TABLE #UserScores;
                RETURN;
            END;

            
            UPDATE dbo.Matches
            SET status_id = @CompletedStatusID_Match,
                completed_at = GETDATE() 
            WHERE id = @MatchID;

            
            UPDATE mp
            SET mp.match_participants_status_id = @WonStatusID_Participant
            FROM dbo.MatchParticipants mp
            INNER JOIN #UserScores us ON mp.user_id = us.user_id
            WHERE mp.match_id = @MatchID AND us.total_score = @MaxScore;

            
            UPDATE mp
            SET mp.match_participants_status_id = @LostStatusID_Participant
            FROM dbo.MatchParticipants mp
            INNER JOIN #UserScores us ON mp.user_id = us.user_id
            WHERE mp.match_id = @MatchID
              AND us.total_score = @MinScore
              AND mp.match_participants_status_id != @WonStatusID_Participant; 

            IF @@TRANCOUNT > 0 COMMIT TRANSACTION;
            PRINT 'INFO: Match ID %d (Join Code ''' + @JoinCode + ''') has been finalized.';
        END
        ELSE
        BEGIN
            
            PRINT 'INFO: FinalizeMatch is false. Only calculating and returning scores for Match ID %d (Join Code ''' + @JoinCode + ''').';
        END;

        
        SELECT user_id, user_alias, total_score FROM #UserScores ORDER BY total_score DESC;
        DROP TABLE #UserScores;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 AND @FinalizeMatch = 1 
            ROLLBACK TRANSACTION;
        IF OBJECT_ID('tempdb..#UserScores') IS NOT NULL
            DROP TABLE #UserScores;
        THROW;
    END CATCH
END;
