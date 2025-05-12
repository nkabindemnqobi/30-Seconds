CREATE OR ALTER PROCEDURE dbo.KickUserFromMatch
    @SourceUserID INT,          -- The ID of the user attempting the kick (must be 'Creator')
    @MatchID INT,               -- The ID of the match the users are in
    @TargetUserID INT           -- The ID of the user to be kicked/barred
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TargetUserAlias VARCHAR(20);
    DECLARE @SourceUserAlias VARCHAR(20);
    DECLARE @SourceIsCreator BIT = 0; -- Use BIT for boolean check
    DECLARE @MatchJoinCode VARCHAR(10);
    DECLARE @BannedStatusID INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- == Step 1: Validate Users ==
        SELECT @SourceUserAlias = alias FROM dbo.Users WHERE id = @SourceUserID;
        IF @SourceUserAlias IS NULL
        BEGIN
            RAISERROR('Source user with ID %d does not exist.', 16, 1, @SourceUserID);
        END

        SELECT @TargetUserAlias = alias FROM dbo.Users WHERE id = @TargetUserID;
        IF @TargetUserAlias IS NULL
        BEGIN
            RAISERROR('Target user with ID %d does not exist.', 16, 1, @TargetUserID);
        END

        -- == Step 2: Validate Match ==
        SELECT @MatchJoinCode = m.join_code
        FROM dbo.Matches m
        WHERE m.id = @MatchID;

        IF @MatchJoinCode IS NULL -- Match not found
        BEGIN
            RAISERROR('Match with ID %d not found.', 16, 1, @MatchID);
        END

        -- == Step 3: Check that both users are currently in the specified match ==
        IF NOT EXISTS (SELECT 1 FROM dbo.MatchParticipants WHERE user_id = @SourceUserID AND match_id = @MatchID)
        BEGIN
            RAISERROR('Source user (ID: %d) is not currently in Match ID %d.', 16, 1, @SourceUserID, @MatchID);
        END

        IF NOT EXISTS (SELECT 1 FROM dbo.MatchParticipants WHERE user_id = @TargetUserID AND match_id = @MatchID)
        BEGIN
            RAISERROR('Target user (ID: %d) is not currently in Match ID %d.', 16, 1, @TargetUserID, @MatchID);
        END

        -- == Step 4: Check that the source user has the 'Creator' status *in this specific match* ==
        IF EXISTS (
            SELECT 1
            FROM dbo.MatchParticipants mp
            INNER JOIN dbo.MatchParticipantsStatus mps ON mp.match_participants_status_id = mps.id 
            WHERE mp.user_id = @SourceUserID
              AND mp.match_id = @MatchID 
              AND mps.status = 'Creator'
        )
        BEGIN
            SET @SourceIsCreator = 1;
        END

        IF @SourceIsCreator = 0 
        BEGIN
            RAISERROR('Source user (ID: %d) does not have ''Creator'' status in Match ID %d.', 16, 1, @SourceUserID, @MatchID);
        END

        -- == Step 5: Get the 'Barred' status ID ==
        SELECT @BannedStatusID = id FROM dbo.MatchParticipantsStatus WHERE status = 'Barred';

        IF @BannedStatusID IS NULL
        BEGIN
            RAISERROR('The required match participant status ''Barred'' was not found in the MatchParticipantsStatus table.', 16, 1);
        END

        -- == Step 6: Update the target user's status *specifically for this match* ==
        UPDATE dbo.MatchParticipants
        SET match_participants_status_id = @BannedStatusID
        WHERE user_id = @TargetUserID
          AND match_id = @MatchID;

        -- Check if the update actually affected a row (it should have, based on previous checks)
        IF @@ROWCOUNT = 0
        BEGIN
             -- This case should theoretically not be reached if prior checks passed, but good practice
             RAISERROR('Failed to update target user (ID: %d) status in Match ID %d. User might have been removed concurrently.', 16, 1, @TargetUserID, @MatchID);
        END

        PRINT 'SUCCESS: User ' + @SourceUserAlias + ' (ID: ' + CAST(@SourceUserID AS VARCHAR) + ') has kicked/barred user ' + @TargetUserAlias + ' (ID: ' + CAST(@TargetUserID AS VARCHAR) + ') from Match ' + @MatchJoinCode + ' (ID: ' + CAST(@MatchID AS VARCHAR) + ').';

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
    END CATCH
END;