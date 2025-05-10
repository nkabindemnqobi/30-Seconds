CREATE OR ALTER PROCEDURE dbo.AddUserToMatchTeam
    @UserID INT,             -- The ID of the user to add
    @MatchID INT,            -- The ID of the match the user is joining
    @TeamPreference CHAR(1), -- 'A' for Team A of the match, 'B' for Team B
    @IsBarred BIT = 0        -- Optional: Whether the user is barred from this team, defaults to 0 (false)
AS
BEGIN
    -- Prevents a message from being sent to the client for each statement.
    SET NOCOUNT ON;

    -- Declare variables for internal use
    DECLARE @TargetTeamId INT;
    DECLARE @MatchTeamAId INT;
    DECLARE @MatchTeamBId INT;
    DECLARE @MaxParticipantsInMatch INT;
    DECLARE @CurrentDistinctParticipantsInMatch INT;
    DECLARE @UserAlias VARCHAR(20); -- For informative messages
    DECLARE @MatchJoinCode VARCHAR(10); -- For informative messages

    BEGIN TRY
        -- Start a transaction to ensure atomicity
        BEGIN TRANSACTION;

        -- == Step 1: Validate User ==
        SELECT @UserAlias = alias FROM dbo.users WHERE id = @UserID;
        IF @UserAlias IS NULL
        BEGIN
            RAISERROR('User with ID %d does not exist.', 16, 1, @UserID);
            -- No need to rollback here, THROW in CATCH block will handle it if transaction is active
        END

        -- == Step 2: Validate Match and retrieve its details ==
        SELECT
            @MatchTeamAId = m.team_a_id,
            @MatchTeamBId = m.team_b_id,
            @MaxParticipantsInMatch = m.max_participants,
            @MatchJoinCode = m.join_code
        FROM dbo.matches m
        WHERE m.id = @MatchID;

        IF @MatchJoinCode IS NULL -- Match not found
        BEGIN
            RAISERROR('Match with ID %d not found.', 16, 1, @MatchID);
        END

        -- == Step 3: Determine the Target Team ID based on preference ==
        IF @TeamPreference = 'A'
        BEGIN
            SET @TargetTeamId = @MatchTeamAId;
        END
        ELSE IF @TeamPreference = 'B'
        BEGIN
            SET @TargetTeamId = @MatchTeamBId;
        END
        ELSE
        BEGIN
            RAISERROR('Invalid @TeamPreference value. Must be ''A'' or ''B''.', 16, 1);
        END

        IF @TargetTeamId IS NULL
        BEGIN
            -- This could happen if team_a_id or team_b_id is NULL in the matches table for the given match.
            -- Depending on schema constraints, this might indicate a data integrity issue.
            RAISERROR('Target team (A or B) is not defined for Match ID %d. Check match configuration.', 16, 1, @MatchID);
        END

        -- == Step 4: Validate if the target team actually exists in the teams table ==
        -- (This is a good integrity check, though FK constraints should ideally enforce this)
        IF NOT EXISTS (SELECT 1 FROM dbo.teams WHERE id = @TargetTeamId)
        BEGIN
            RAISERROR('Critical Error: Target Team ID %d (derived from Match %d for Team %s) does not exist in the teams table. Check data integrity.', 16, 1, @TargetTeamId, @MatchID, @TeamPreference);
        END

        -- == Step 5: Check if user is already in the specific target team ==
        IF EXISTS (SELECT 1 FROM dbo.match_participants WHERE user_id = @UserID AND team_id = @TargetTeamId)
        BEGIN
            PRINT 'INFO: User ' + @UserAlias + ' (ID: ' + CAST(@UserID AS VARCHAR) + ') is already a participant in the target team (Team ID: ' + CAST(@TargetTeamId AS VARCHAR) + '). No action taken.';
            -- Commit the transaction as the state is already achieved (idempotent success)
            COMMIT TRANSACTION;
            RETURN 0; -- Indicate success (no change needed)
        END

        -- == Step 6: Check Max Participants for the match ==
        -- Count distinct users who are members of EITHER Team A or Team B of this specific match.
        SELECT @CurrentDistinctParticipantsInMatch = COUNT(DISTINCT mp.user_id)
        FROM dbo.match_participants mp
        WHERE mp.team_id IN (@MatchTeamAId, @MatchTeamBId);

        -- Check if the current user is already part of *any* team in this match.
        -- If they are, adding them to another team in the same match doesn't increase the *distinct user count* for max_participants.
        DECLARE @UserAlreadyInAnyTeamForThisMatch BIT = 0;
        IF EXISTS (SELECT 1 FROM dbo.match_participants WHERE user_id = @UserID AND team_id IN (@MatchTeamAId, @MatchTeamBId))
        BEGIN
            SET @UserAlreadyInAnyTeamForThisMatch = 1;
        END

        -- If the user is a NEW distinct participant for this match AND the match is already full
        IF @UserAlreadyInAnyTeamForThisMatch = 0 AND @CurrentDistinctParticipantsInMatch >= @MaxParticipantsInMatch
        BEGIN
            RAISERROR('Match %d (Join Code: %s) is full (%d/%d participants). Cannot add new distinct user %s.', 16, 1, @MatchID, @MatchJoinCode, @CurrentDistinctParticipantsInMatch, @MaxParticipantsInMatch, @UserAlias);
        END

        -- == Step 7: Add the user to the determined target team ==
        INSERT INTO dbo.match_participants (user_id, team_id, is_barred)
        VALUES (@UserID, @TargetTeamId, @IsBarred);

        PRINT 'SUCCESS: User ' + @UserAlias + ' (ID: ' + CAST(@UserID AS VARCHAR) + ') added to Team ' + @TeamPreference + ' (Team ID: ' + CAST(@TargetTeamId AS VARCHAR) + ') for Match ' + @MatchJoinCode + ' (ID: ' + CAST(@MatchID AS VARCHAR) + ').';

        -- Commit the transaction if all operations were successful
        COMMIT TRANSACTION;
        RETURN 0; -- Indicate general success

    END TRY
    BEGIN CATCH
        -- If an error occurs and there's an active transaction, roll it back
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Re-throw the error to the calling application
        THROW;
        RETURN 1; -- Indicate failure (though THROW will usually prevent this from being reached)
    END CATCH
END;