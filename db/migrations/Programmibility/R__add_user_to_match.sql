CREATE OR ALTER PROCEDURE dbo.AddUserToMatch
    @UserID INT,
    @MatchID INT
AS
BEGIN
    SET NOCOUNT ON;

    
    DECLARE @MaxParticipantsInMatch INT;
    DECLARE @CurrentActiveParticipantsInMatch INT; 
    DECLARE @UserAlias VARCHAR(20);
    DECLARE @MatchJoinCode VARCHAR(10);
    
    DECLARE @WaitingStartID INT;
    DECLARE @InLobbyStatusID_MatchStatus INT; 
    DECLARE @BarredStatusID_ParticipantStatus INT; 

    BEGIN TRY
        
        SELECT @BarredStatusID_ParticipantStatus = id
        FROM dbo.MatchParticipantsStatus
        WHERE status = 'Barred';

        IF @BarredStatusID_ParticipantStatus IS NULL
        BEGIN
            RAISERROR('Critical Error: The participant status ''Barred'' was not found in the MatchParticipantsStatus table. Cannot accurately check lobby capacity.', 16, 1);
            RETURN;
        END

        SELECT @InLobbyStatusID_MatchStatus = id
        FROM dbo.MatchStatus ms
        WHERE ms.status = 'Lobby';

        IF @InLobbyStatusID_MatchStatus IS NULL
        BEGIN
            
            RAISERROR('Critical Error: The match status ''Lobby'' was not found in the MatchStatus table. Cannot verify match state.', 16, 1);
            RETURN;
        END

        BEGIN TRANSACTION; 

        
        SELECT @UserAlias = alias FROM dbo.Users WHERE id = @UserID;
        IF @UserAlias IS NULL
        BEGIN
            RAISERROR('User with ID %d does not exist.', 16, 1, @UserID);
            
        END;

        
        SELECT
            @MatchJoinCode = m.join_code,
            @MaxParticipantsInMatch = m.max_participants 
        FROM dbo.Matches m
        WHERE m.id = @MatchID AND m.status_id = @InLobbyStatusID_MatchStatus;

        IF @MatchJoinCode IS NULL 
        BEGIN
            RAISERROR('Match with ID %d not found or is not in ''Lobby'' state.', 16, 1, @MatchID);
            
        END;

        
        IF EXISTS (SELECT 1 FROM dbo.MatchParticipants WHERE user_id = @UserID AND match_id = @MatchID)
        BEGIN
            PRINT 'INFO: User ' + @UserAlias + ' (ID: ' + CAST(@UserID AS VARCHAR) + ') is already a participant in Match ID ' + CAST(@MatchID AS VARCHAR) + '. No action taken.';
            
            COMMIT TRANSACTION;
            RETURN 0; 
        END;

        
        SELECT @CurrentActiveParticipantsInMatch = COUNT(DISTINCT mp.user_id)
        FROM dbo.MatchParticipants mp
        WHERE mp.match_id = @MatchID
          AND mp.match_participants_status_id != @BarredStatusID_ParticipantStatus; 

        
        IF @MaxParticipantsInMatch IS NULL
        BEGIN
            
            RAISERROR('Could not determine maximum participant capacity for Match ID %d.', 16, 1, @MatchID);
        END;

        IF @CurrentActiveParticipantsInMatch >= @MaxParticipantsInMatch
        BEGIN
            RAISERROR('Match ID %d (Join Code: %s) is full with %d active participants (Max: %d). Cannot add new user %s.', 16, 1, @MatchID, @MatchJoinCode, @CurrentActiveParticipantsInMatch, @MaxParticipantsInMatch, @UserAlias);
            
        END;

        
        SELECT @WaitingStartID = id FROM dbo.MatchParticipantsStatus WHERE status = 'WaitingStart';
        IF @WaitingStartID IS NULL
        BEGIN
            RAISERROR('Critical Error: The participant status ''WaitingStart'' was not found in the MatchParticipantsStatus table. Cannot add user to match.', 16, 1);
            
        END;

        INSERT INTO dbo.MatchParticipants (user_id, match_id, match_participants_status_id)
        VALUES (@UserID, @MatchID, @WaitingStartID);

        PRINT 'SUCCESS: User ' + @UserAlias + ' (ID: ' + CAST(@UserID AS VARCHAR) + ') added to Match ID ' + CAST(@MatchID AS VARCHAR) + ' (Join Code: ' + @MatchJoinCode + ') with ''WaitingStart'' status.';

        COMMIT TRANSACTION;
        RETURN 0; 

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW; 
    END CATCH
END;
