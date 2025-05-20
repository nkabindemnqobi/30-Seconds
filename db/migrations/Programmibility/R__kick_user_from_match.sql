IF OBJECT_ID('dbo.KickUserFromMatch', 'P') IS NOT NULL
    DROP PROCEDURE dbo.KickUserFromMatch;
GO

CREATE OR ALTER PROCEDURE dbo.KickUserFromMatch
    @SourceUserID INT,          
    @MatchID INT,               
    @TargetUserID INT           
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TargetUserAlias VARCHAR(20);
    DECLARE @SourceUserAlias VARCHAR(20);
    DECLARE @SourceIsCreator BIT = 0; 
    DECLARE @MatchJoinCode VARCHAR(10);
    DECLARE @BannedStatusID INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        
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

        
        SELECT @MatchJoinCode = m.join_code
        FROM dbo.Matches m
        WHERE m.id = @MatchID;

        IF @MatchJoinCode IS NULL 
        BEGIN
            RAISERROR('Match with ID %d not found.', 16, 1, @MatchID);
        END

        
        IF NOT EXISTS (SELECT 1 FROM dbo.MatchParticipants WHERE user_id = @SourceUserID AND match_id = @MatchID)
        BEGIN
            RAISERROR('Source user (ID: %d) is not currently in Match ID %d.', 16, 1, @SourceUserID, @MatchID);
        END

        IF NOT EXISTS (SELECT 1 FROM dbo.MatchParticipants WHERE user_id = @TargetUserID AND match_id = @MatchID)
        BEGIN
            RAISERROR('Target user (ID: %d) is not currently in Match ID %d.', 16, 1, @TargetUserID, @MatchID);
        END

        
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

        
        SELECT @BannedStatusID = id FROM dbo.MatchParticipantsStatus WHERE status = 'Barred';

        IF @BannedStatusID IS NULL
        BEGIN
            RAISERROR('The required match participant status ''Barred'' was not found in the MatchParticipantsStatus table.', 16, 1);
        END

        
        UPDATE dbo.MatchParticipants
        SET match_participants_status_id = @BannedStatusID
        WHERE user_id = @TargetUserID
          AND match_id = @MatchID;

        
        IF @@ROWCOUNT = 0
        BEGIN
             
             RAISERROR('Failed to update target user (ID: %d) status in Match ID %d. User might have been removed concurrently.', 16, 1, @TargetUserID, @MatchID);
        END

        PRINT 'SUCCESS: User ' + @SourceUserAlias + ' (ID: ' + CAST(@SourceUserID AS VARCHAR) + ') has kicked/barred user ' + @TargetUserAlias + ' (ID: ' + CAST(@TargetUserID AS VARCHAR) + ') from Match ' + @MatchJoinCode + ' (ID: ' + CAST(@MatchID AS VARCHAR) + ').';

        
        COMMIT TRANSACTION;
        RETURN 0; 

    END TRY
    BEGIN CATCH
        
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        
        THROW;
    END CATCH
END;