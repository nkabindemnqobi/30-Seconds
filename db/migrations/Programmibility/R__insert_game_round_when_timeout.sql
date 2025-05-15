CREATE OR ALTER PROCEDURE dbo.HandleGameRoundTimeout
    @JoinCode VARCHAR(10) -- Changed input to JoinCode
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MatchID INT; -- Will be derived from JoinCode
    DECLARE @ActiveRoundID INT;
    DECLARE @GuessingUserID INT;
    DECLARE @UserAlias VARCHAR(20);

    BEGIN TRY
        -- == Step 0: Get MatchID from JoinCode ==
        SELECT @MatchID = id
        FROM dbo.Matches
        WHERE join_code = @JoinCode;

        IF @MatchID IS NULL
        BEGIN
            RAISERROR('Match with Join Code ''%s'' not found. Cannot handle round timeout.', 16, 1, @JoinCode);
            RETURN; -- Exit if match not found, transaction not yet started
        END;

        BEGIN TRANSACTION; -- Start transaction after initial validation

        -- == Step 1: Find the active round for the derived MatchID ==
        -- An active round is one that has not yet ended.
        SELECT TOP 1 -- Should only be one active round per match
            @ActiveRoundID = gr.id,
            @GuessingUserID = gr.guessing_user_id
        FROM dbo.GameRounds gr
        WHERE gr.match_id = @MatchID -- Use derived @MatchID
          AND gr.ended_at IS NULL
        ORDER BY gr.id DESC; -- In case (though unlikely) multiple were somehow left open, take the latest.

        IF @ActiveRoundID IS NULL
        BEGIN
            PRINT 'INFO: No active round found for Match ID ' + CAST(@MatchID AS VARCHAR) + ' (Join Code: ''' + @JoinCode + ''') to mark as timed out. It might have already been completed.';
            IF @@TRANCOUNT > 0 COMMIT TRANSACTION;
            RETURN 0;
        END;

        SELECT @UserAlias = u.alias FROM dbo.Users u WHERE u.id = @GuessingUserID;

        -- == Step 2: Update the active round to reflect the timeout ==
        UPDATE dbo.GameRounds
        SET
            ended_at = GETDATE(),
            points_awarded = 0,         -- No points for a timeout
            time_in_ms = 30000          -- Assume 30 seconds (30000 ms) full time used
        WHERE
            id = @ActiveRoundID;

        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('Failed to update GameRound ID %d for timeout in Match ID %d (Join Code: ''%s''). Round might have been updated or deleted concurrently.', 16, 1, @ActiveRoundID, @MatchID, @JoinCode);
            -- ROLLBACK will be handled by CATCH
        END;

        PRINT 'SUCCESS: GameRound ID ' + CAST(@ActiveRoundID AS VARCHAR) +
              ' for Match ID ' + CAST(@MatchID AS VARCHAR) + ' (Join Code: ''' + @JoinCode + ''')' +
              ' (User: ' + ISNULL(@UserAlias, CAST(@GuessingUserID AS VARCHAR)) + ')' +
              ' marked as timed out.';

        COMMIT TRANSACTION;
        RETURN 0; -- Indicate success

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW; -- Re-throw the error to the calling application
    END CATCH
END;
