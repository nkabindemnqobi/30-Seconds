CREATE OR ALTER PROCEDURE dbo.AddUserToMatch
    @UserID INT,            -- The ID of the user to add
    @MatchID INT            -- The ID of the match the user is joining
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaxParticipantsInMatch INT;
    DECLARE @CurrentDistinctParticipantsInMatch INT;
    DECLARE @UserAlias VARCHAR(20); 
    DECLARE @MatchJoinCode VARCHAR(10); 
    DECLARE @UserAlreadyInAnyTeamForThisMatch BIT; 
    DECLARE @WaitingStartID INT; 

    BEGIN TRY
        BEGIN TRANSACTION;

        -- == Step 1: Validate User ==
        SELECT @UserAlias = alias FROM dbo.users WHERE id = @UserID;
        IF @UserAlias IS NULL
        BEGIN
            RAISERROR('User with ID %d does not exist.', 16, 1, @UserID);
            END

        -- == Step 2: Validate Match and retrieve its details ==
        SELECT
            @MatchJoinCode = m.join_code
            FROM dbo.matches m
        WHERE m.id = @MatchID;

        IF @MatchJoinCode IS NULL -- Match not found
        BEGIN
            RAISERROR('Match with ID %d not found.', 16, 1, @MatchID);
            END

        IF EXISTS (SELECT 1 FROM dbo.MatchParticipants WHERE user_id = @UserID AND match_id = @MatchID)
        BEGIN
            PRINT 'INFO: User ' + @UserAlias + ' (ID: ' + CAST(@UserID AS VARCHAR) + ') is already a participant in the target match. No action taken.';
            COMMIT TRANSACTION;
            RETURN 0; -- Indicate success (no change needed)
        END

        -- == Step 4: Check Max Participants for the match ==
        -- Count distinct users who are members of this specific match.
        SELECT @CurrentDistinctParticipantsInMatch = COUNT(DISTINCT mp.user_id)
        FROM dbo.MatchParticipants mp
        WHERE mp.match_id = @MatchID;

       SET @UserAlreadyInAnyTeamForThisMatch = 0; 
        IF EXISTS (SELECT 1 FROM dbo.MatchParticipants WHERE user_id = @UserID AND match_id = @MatchID)
        BEGIN
            SET @UserAlreadyInAnyTeamForThisMatch = 1;
        END

        -- If the user is a NEW distinct participant for this match AND the match is already full
        IF @UserAlreadyInAnyTeamForThisMatch = 0 AND @CurrentDistinctParticipantsInMatch >= @MaxParticipantsInMatch
        BEGIN
            RAISERROR('Match %d (Join Code: %s) is full (%d/%d participants). Cannot add new distinct user %s.', 16, 1, @MatchID, @MatchJoinCode, @CurrentDistinctParticipantsInMatch, @MaxParticipantsInMatch, @UserAlias);
        END

        -- == Step 5: Get the WaitingStart status ID ==
        SELECT @WaitingStartID = id from MatchParticipantsStatus where status = 'WaitingStart'; -- Corrected: Use single quotes for string literal

        -- == Step 6: Add the user to the determined target match ==
        INSERT INTO dbo.MatchParticipants (user_id, match_id, match_participants_status_id)
        VALUES (@UserID, @MatchID, @WaitingStartID);

        PRINT 'SUCCESS: User ' + @UserAlias + ' (ID: ' + CAST(@UserID AS VARCHAR) + ') added to Match. (Match ID: ' + CAST(@MatchID AS VARCHAR) + ') for Match ' + @MatchJoinCode + ' (ID: ' + CAST(@MatchID AS VARCHAR) + ').';

        -- Commit the transaction if all operations were successful
        COMMIT TRANSACTION;
        RETURN 0; -- Indicate general success

    END TRY
    BEGIN CATCH
        -- If an error occurs and there's an active transaction, roll it back
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Re-throw the error to the calling application
        -- THROW retains original error number, state, and message.
        THROW;
        END CATCH
END;