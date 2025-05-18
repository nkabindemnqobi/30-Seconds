IF OBJECT_ID('dbo.StartNewGameRound', 'P') IS NOT NULL
    DROP PROCEDURE dbo.StartNewGameRound;
GO

CREATE OR ALTER PROCEDURE dbo.StartNewGameRound
    @JoinCode VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    
    DECLARE @MatchID INT;
    DECLARE @GuessingUserID INT;
    DECLARE @GuessingUserAlias VARCHAR(20);
    DECLARE @GuessingItemID INT;
    DECLARE @GuessingItemName VARCHAR(100);
    DECLARE @GuessingItemCategoryName VARCHAR(100);
    DECLARE @NewRoundID INT;

    BEGIN TRY
        
        SELECT @MatchID = id
        FROM dbo.Matches
        WHERE join_code = @JoinCode;

        IF @MatchID IS NULL
        BEGIN
            RAISERROR('Invalid join code provided: ''%s''. Match not found.', 16, 1, @JoinCode);
            RETURN; 
        END;

        BEGIN TRANSACTION; 

        
        
        IF EXISTS (SELECT 1 FROM dbo.GameRounds WHERE match_id = @MatchID AND ended_at IS NULL)
        BEGIN
            RAISERROR('A round is already in progress for Match ID %d (Join Code: ''%s'').', 16, 1, @MatchID, @JoinCode);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        
        
        WITH EligiblePlayers AS (
            SELECT mp.user_id
            FROM dbo.MatchParticipants mp
            INNER JOIN dbo.MatchParticipantsStatus s ON s.id = mp.match_participants_status_id
            WHERE mp.match_id = @MatchID AND s.status IN ('Playing', 'Creator')
        ),
        PlayerRoundCounts AS (
            SELECT
                ep.user_id,
                COUNT(gr.id) AS rounds_played
            FROM EligiblePlayers ep
            LEFT JOIN dbo.GameRounds gr ON gr.match_id = @MatchID AND gr.guessing_user_id = ep.user_id
            GROUP BY ep.user_id
        )
        SELECT TOP 1 @GuessingUserID = prc.user_id
        FROM PlayerRoundCounts prc
        ORDER BY prc.rounds_played ASC, NEWID() ASC; 

        IF @GuessingUserID IS NULL
        BEGIN
            RAISERROR('Could not determine the next player for Match ID %d. No eligible players found.', 16, 1, @MatchID);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        
        SELECT @GuessingUserAlias = alias FROM dbo.Users WHERE id = @GuessingUserID;
        IF @GuessingUserAlias IS NULL
        BEGIN
             RAISERROR('Could not find alias for Guessing User ID %d.', 16, 1, @GuessingUserID);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        
        SELECT TOP 1
            @GuessingItemID = gi.id,
            @GuessingItemName = gi.item_name,
            @GuessingItemCategoryName = c.name
        FROM dbo.GuessingItems gi
        INNER JOIN dbo.Categories c ON c.id = gi.category_id
        INNER JOIN dbo.CategoriesMatches cm ON cm.category_id = c.id AND cm.match_id = @MatchID
        WHERE gi.id NOT IN (
                SELECT DISTINCT gr.guessing_item_id
                FROM dbo.GameRounds gr
                WHERE gr.match_id = @MatchID AND gr.guessing_item_id IS NOT NULL
            )
        ORDER BY NEWID();

        IF @GuessingItemID IS NULL
        BEGIN
            RAISERROR('No more unused guessing items available for Match ID %d (Join Code: ''%s'').', 16, 1, @MatchID, @JoinCode);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        
        INSERT INTO dbo.GameRounds (
            match_id,
            guessing_user_id,
            guessing_item_id,
            timer_started_at,
            ended_at,
            hint_count,         
            points_awarded,
            time_in_ms
        )
        VALUES (
            @MatchID,
            @GuessingUserID,
            @GuessingItemID,
            GETDATE(),          
            NULL,               
            0,                  
            0,                  
            0                   
        );

        SET @NewRoundID = SCOPE_IDENTITY();

        IF @NewRoundID IS NULL OR @NewRoundID = 0
        BEGIN
            RAISERROR('Failed to insert new game round for Match ID %d (Join Code: ''%s'').', 16, 1, @MatchID, @JoinCode);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        COMMIT TRANSACTION;

        
        SELECT
            @NewRoundID AS round_id,
            @GuessingUserID AS guessing_user_id,
            @GuessingUserAlias AS guessing_user_alias,
            @GuessingItemID AS guessing_item_id,
            @GuessingItemName AS guessing_item_name,
            @GuessingItemCategoryName AS guessing_item_category_name;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW; 
    END CATCH
END;
