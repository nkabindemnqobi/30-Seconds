CREATE OR ALTER PROCEDURE dbo.AddUserToMatch
    @UserID INT,
    @MatchID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Declare necessary variables
    DECLARE @MaxParticipantsInMatch INT;
    DECLARE @CurrentActiveParticipantsInMatch INT; -- Renamed for clarity
    DECLARE @UserAlias VARCHAR(20);
    DECLARE @MatchJoinCode VARCHAR(10);
    -- DECLARE @UserAlreadyInAnyTeamForThisMatch BIT; -- This seems like a remnant and is covered by the direct check
    DECLARE @WaitingStartID INT;
    DECLARE @InLobbyStatusID_MatchStatus INT; -- Renamed for clarity
    DECLARE @BarredStatusID_ParticipantStatus INT; -- To store the ID of 'Barred' status

    BEGIN TRY
        -- == Step 0: Get 'Barred' and 'Lobby' status IDs first for later use ==
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
            -- Parameter for RAISERROR was incorrect, it doesn't take a variable if no %d is present.
            RAISERROR('Critical Error: The match status ''Lobby'' was not found in the MatchStatus table. Cannot verify match state.', 16, 1);
            RETURN;
        END

        BEGIN TRANSACTION; -- Start transaction after initial status lookups

        -- == Step 1: Validate User ==
        SELECT @UserAlias = alias FROM dbo.Users WHERE id = @UserID;
        IF @UserAlias IS NULL
        BEGIN
            RAISERROR('User with ID %d does not exist.', 16, 1, @UserID);
            -- ROLLBACK will be handled by CATCH block
        END;

        -- == Step 2: Check that the match exists, is in 'Lobby' state, and get its details ==
        SELECT
            @MatchJoinCode = m.join_code,
            @MaxParticipantsInMatch = m.max_participants -- Fetch max participants
        FROM dbo.Matches m
        WHERE m.id = @MatchID AND m.status_id = @InLobbyStatusID_MatchStatus;

        IF @MatchJoinCode IS NULL -- This also implies @MaxParticipantsInMatch would be NULL
        BEGIN
            RAISERROR('Match with ID %d not found or is not in ''Lobby'' state.', 16, 1, @MatchID);
            -- ROLLBACK will be handled by CATCH block
        END;

        -- == Step 3: Check if user is already a participant in this match ==
        IF EXISTS (SELECT 1 FROM dbo.MatchParticipants WHERE user_id = @UserID AND match_id = @MatchID)
        BEGIN
            PRINT 'INFO: User ' + @UserAlias + ' (ID: ' + CAST(@UserID AS VARCHAR) + ') is already a participant in Match ID ' + CAST(@MatchID AS VARCHAR) + '. No action taken.';
            -- If user is already in, it's not an error, just no action. Commit to end transaction.
            COMMIT TRANSACTION;
            RETURN 0; -- Indicate success (idempotent)
        END;

        -- == Step 4: Check if the lobby is full (excluding barred participants) ==
        SELECT @CurrentActiveParticipantsInMatch = COUNT(DISTINCT mp.user_id)
        FROM dbo.MatchParticipants mp
        WHERE mp.match_id = @MatchID
          AND mp.match_participants_status_id != @BarredStatusID_ParticipantStatus; -- Exclude barred users

        -- The variable @MaxParticipantsInMatch should now have a value from Step 2.
        IF @MaxParticipantsInMatch IS NULL
        BEGIN
            -- This should not happen if Step 2 succeeded, but as a safeguard:
            RAISERROR('Could not determine maximum participant capacity for Match ID %d.', 16, 1, @MatchID);
        END;

        IF @CurrentActiveParticipantsInMatch >= @MaxParticipantsInMatch
        BEGIN
            RAISERROR('Match ID %d (Join Code: %s) is full with %d active participants (Max: %d). Cannot add new user %s.', 16, 1, @MatchID, @MatchJoinCode, @CurrentActiveParticipantsInMatch, @MaxParticipantsInMatch, @UserAlias);
            -- ROLLBACK will be handled by CATCH block
        END;

        -- == Step 5: Insert user into table with 'WaitingStart' status ==
        SELECT @WaitingStartID = id FROM dbo.MatchParticipantsStatus WHERE status = 'WaitingStart';
        IF @WaitingStartID IS NULL
        BEGIN
            RAISERROR('Critical Error: The participant status ''WaitingStart'' was not found in the MatchParticipantsStatus table. Cannot add user to match.', 16, 1);
            -- ROLLBACK will be handled by CATCH block
        END;

        INSERT INTO dbo.MatchParticipants (user_id, match_id, match_participants_status_id)
        VALUES (@UserID, @MatchID, @WaitingStartID);

        PRINT 'SUCCESS: User ' + @UserAlias + ' (ID: ' + CAST(@UserID AS VARCHAR) + ') added to Match ID ' + CAST(@MatchID AS VARCHAR) + ' (Join Code: ' + @MatchJoinCode + ') with ''WaitingStart'' status.';

        COMMIT TRANSACTION;
        RETURN 0; -- Indicate general success

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW; -- Re-throw the error to the calling application
    END CATCH
END;
