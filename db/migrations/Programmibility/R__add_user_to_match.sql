CREATE OR ALTER PROCEDURE dbo.AddUserToMatch
    @UserID INT,
    @MatchID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaxParticipantsInMatch INT;
    DECLARE @CurrentDistinctParticipantsInMatch INT;
    DECLARE @UserAlias VARCHAR(20); 
    DECLARE @MatchJoinCode VARCHAR(10); 
    DECLARE @UserAlreadyInAnyTeamForThisMatch BIT; 
    DECLARE @WaitingStartID INT; 
    DECLARE @InLobbyStatusID INT;

    BEGIN TRY
        BEGIN TRANSACTION;
        -- == Step 1: Validate User ==
        SELECT @UserAlias = alias FROM dbo.users WHERE id = @UserID;
        IF @UserAlias IS NULL
        BEGIN
            RAISERROR('User with ID %d does not exist.', 16, 1, @UserID);
        END
        
        -- == Step 2: Check that the match is in Lobby state and exists. ==
        SELECT @InLobbyStatusID = id from dbo.MatchStatus ms where ms.status = 'Lobby';

        IF @InLobbyStatusID IS NULL
        BEGIN
            RAISERROR('Lobby status does not exist for matches.', 16, 1, @InLobbyStatusID);
        END
         
        SELECT
            @MatchJoinCode = m.join_code
            FROM dbo.matches m
        WHERE m.id = @MatchID AND m.status_id = @InLobbyStatusID;

        IF @MatchJoinCode IS NULL
        BEGIN
            RAISERROR('Match with ID %d not found or is not in lobby state.', 16, 1, @MatchID);
        END

        -- == Step 3: Check if user already in match. ==
        IF EXISTS (SELECT 1 FROM dbo.MatchParticipants WHERE user_id = @UserID AND match_id = @MatchID)
        BEGIN
            PRINT 'INFO: User ' + @UserAlias + ' (ID: ' + CAST(@UserID AS VARCHAR) + ') is already a participant in the target match. No action taken.';
            COMMIT TRANSACTION;
            RETURN 0;
        END
        -- == Step 4: Check if the lobby is full. ==
        SELECT @CurrentDistinctParticipantsInMatch = COUNT(DISTINCT mp.user_id)
        FROM dbo.MatchParticipants mp
        WHERE mp.match_id = @MatchID;

       SET @UserAlreadyInAnyTeamForThisMatch = 0; 
        IF EXISTS (SELECT 1 FROM dbo.MatchParticipants WHERE user_id = @UserID AND match_id = @MatchID)
        BEGIN
            SET @UserAlreadyInAnyTeamForThisMatch = 1;
        END

        IF @UserAlreadyInAnyTeamForThisMatch = 0 AND @CurrentDistinctParticipantsInMatch >= @MaxParticipantsInMatch
        BEGIN
            RAISERROR('Match %d (Join Code: %s) is full (%d/%d participants). Cannot add new distinct user %s.', 16, 1, @MatchID, @MatchJoinCode, @CurrentDistinctParticipantsInMatch, @MaxParticipantsInMatch, @UserAlias);
        END
        -- == Step 5: Insert user into table with correct match_participant_status_id. ==
        SELECT @WaitingStartID = id from MatchParticipantsStatus where status = 'WaitingStart';

        INSERT INTO dbo.MatchParticipants (user_id, match_id, match_participants_status_id)
        VALUES (@UserID, @MatchID, @WaitingStartID);

        PRINT 'SUCCESS: User ' + @UserAlias + ' (ID: ' + CAST(@UserID AS VARCHAR) + ') added to Match. (Match ID: ' + CAST(@MatchID AS VARCHAR) + ') for Match ' + @MatchJoinCode + ' (ID: ' + CAST(@MatchID AS VARCHAR) + ').';

        COMMIT TRANSACTION;
        RETURN 0;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
        END CATCH
END;