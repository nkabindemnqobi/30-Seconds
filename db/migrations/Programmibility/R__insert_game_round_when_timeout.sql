CREATE OR ALTER PROCEDURE dbo.HandleGameRoundTimeout
    @JoinCode VARCHAR(10),
    @RoundID INT = NULL 
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MatchID INT;
    DECLARE @ActiveRoundID INT;
    DECLARE @GuessingUserID INT;
    DECLARE @UserAlias VARCHAR(20);
    DECLARE @GuessingItemName VARCHAR(100); 
    DECLARE @GuessingItemID INT; 

    BEGIN TRY
        
        SELECT @MatchID = id
        FROM dbo.Matches
        WHERE join_code = @JoinCode;

        IF @MatchID IS NULL
        BEGIN
            RAISERROR('Match with Join Code ''%s'' not found. Cannot handle round timeout.', 16, 1, @JoinCode);
            RETURN;
        END;

        BEGIN TRANSACTION;

        
        
        
        SELECT TOP 1
            @ActiveRoundID = gr.id,
            @GuessingUserID = gr.guessing_user_id,
            @GuessingItemID = gr.guessing_item_id 
        FROM dbo.GameRounds gr
        WHERE gr.match_id = @MatchID
          AND gr.ended_datetime IS NULL 
        ORDER BY gr.id DESC;

        IF @ActiveRoundID IS NULL
        BEGIN
            PRINT 'INFO: No active round found for Match ID ' + CAST(@MatchID AS VARCHAR) + ' (Join Code: ''' + @JoinCode + ''') to mark as timed out. It might have already been completed.';
            IF @@TRANCOUNT > 0 COMMIT TRANSACTION; 
            RETURN 0;
        END;

        
        SELECT @UserAlias = u.alias FROM dbo.Users u WHERE u.id = @GuessingUserID;

        
        UPDATE dbo.GameRounds
        SET
            ended_datetime = GETDATE(), 
            points_awarded = 0,
            time_in_ms = 30000
        WHERE
            id = @ActiveRoundID; 

        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('Failed to update GameRound ID %d for timeout in Match ID %d (Join Code: ''%s''). Round might have been updated or deleted concurrently.', 16, 1, @ActiveRoundID, @MatchID, @JoinCode);
            
        END;

        PRINT 'SUCCESS: GameRound ID ' + CAST(@ActiveRoundID AS VARCHAR) +
              ' for Match ID ' + CAST(@MatchID AS VARCHAR) + ' (Join Code: ''' + @JoinCode + ''')' +
              ' (User: ' + ISNULL(@UserAlias, CAST(@GuessingUserID AS VARCHAR)) + ')' +
              ' marked as timed out.';

        
        IF @GuessingItemID IS NOT NULL
        BEGIN
            SELECT @GuessingItemName = gi.item_name
            FROM dbo.GuessingItems gi
            WHERE gi.id = @GuessingItemID;

            IF @GuessingItemName IS NULL
            BEGIN
                PRINT 'WARNING: Could not find guessing item name for Item ID ' + CAST(@GuessingItemID AS VARCHAR) + ' associated with Round ID ' + CAST(@ActiveRoundID AS VARCHAR) + '.';
            END;
        END
        ELSE
        BEGIN
            PRINT 'WARNING: GuessingItemID was not found for the active round. Cannot return item details.';
        END;


        COMMIT TRANSACTION;

        
        IF @GuessingItemID IS NOT NULL
        BEGIN
            SELECT *
            FROM dbo.GuessingItems
            WHERE id = @GuessingItemID;
        END
        ELSE
        BEGIN
            SELECT *
            FROM dbo.GuessingItems
            WHERE 1 = 0; 
        END;

        RETURN 0; 

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
