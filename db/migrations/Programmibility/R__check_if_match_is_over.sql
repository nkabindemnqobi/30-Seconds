CREATE OR ALTER PROCEDURE dbo.CheckIfMatchIsOver
    @JoinCode VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MatchID INT;
    DECLARE @ParticipantCount INT;
    DECLARE @CategoryCount INT;
    DECLARE @TotalExpectedRounds INT;
    DECLARE @GameRoundsPlayed INT;
    DECLARE @BarredStatusID INT;
    DECLARE @IsMatchOver BIT;

    BEGIN TRY
        BEGIN TRANSACTION;

    
    SET @IsMatchOver = 0;

    
    SELECT @BarredStatusID = id
    FROM dbo.MatchParticipantsStatus
    WHERE status = 'Barred';

    IF @BarredStatusID IS NULL
    BEGIN
        RAISERROR('The participant status ''Barred'' was not found in the MatchParticipantsStatus table. Cannot accurately determine active participants.', 16, 1);
        RETURN;
    END

    
    SELECT @MatchID = id
    FROM dbo.Matches
    WHERE join_code = @JoinCode;

    IF @MatchID IS NULL
    BEGIN
        
        SET @IsMatchOver = 0;
        RETURN;
    END

    
    SELECT @ParticipantCount = COUNT(DISTINCT mp.user_id)
    FROM dbo.MatchParticipants mp
    WHERE mp.match_id = @MatchID
      AND mp.match_participants_status_id != @BarredStatusID; 

    
    SELECT @CategoryCount = COUNT(DISTINCT cm.category_id)
    FROM dbo.CategoriesMatches cm
    WHERE cm.match_id = @MatchID;

    
    
    IF @ParticipantCount = 0 OR @CategoryCount = 0
    BEGIN
        SET @IsMatchOver = 1; 
        RETURN;
    END

    
    
    SET @TotalExpectedRounds = @ParticipantCount * @CategoryCount;

    
    SELECT @GameRoundsPlayed = COUNT(id)
    FROM dbo.GameRounds
    WHERE match_id = @MatchID;

    
    IF @TotalExpectedRounds = 0 
    BEGIN
        SET @IsMatchOver = 1; 
    END
    ELSE IF @GameRoundsPlayed >= @TotalExpectedRounds
    BEGIN
        SET @IsMatchOver = 1;
    END
    ELSE
    BEGIN
        SET @IsMatchOver = 0;
    END
    COMMIT TRANSACTION;
    SELECT @IsMatchOver AS IsMatchOver;
    
    END TRY
    BEGIN CATCH
    
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        
        THROW;
    END CATCH
END;