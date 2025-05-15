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

    -- Default to false
    SET @IsMatchOver = 0;

    -- == Get the 'Barred' status ID ==
    SELECT @BarredStatusID = id
    FROM dbo.MatchParticipantsStatus
    WHERE status = 'Barred';

    IF @BarredStatusID IS NULL
    BEGIN
        RAISERROR('The participant status ''Barred'' was not found in the MatchParticipantsStatus table. Cannot accurately determine active participants.', 16, 1);
        RETURN;
    END

    -- == Step 1: Get the matchId from the join_code ==
    SELECT @MatchID = id
    FROM dbo.Matches
    WHERE join_code = @JoinCode;

    IF @MatchID IS NULL
    BEGIN
        -- Join code not found, match effectively cannot be determined to be over or not.
        SET @IsMatchOver = 0;
        RETURN;
    END

    -- == Step 2: SELECT count(DISTINCT user_id) from MatchParticipants for myMatchId, excluding barred users ==
    SELECT @ParticipantCount = COUNT(DISTINCT mp.user_id)
    FROM dbo.MatchParticipants mp
    WHERE mp.match_id = @MatchID
      AND mp.match_participants_status_id != @BarredStatusID; -- Exclude users with the 'Barred' status ID

    -- == Step 3: SELECT count(DISTINCT category_id) from CategoriesMatches for myMatchId ==
    SELECT @CategoryCount = COUNT(DISTINCT cm.category_id)
    FROM dbo.CategoriesMatches cm
    WHERE cm.match_id = @MatchID;

    -- If there are no participants or no categories, the game can't really proceed or be "over" in the normal sense.
    -- Or it might be considered immediately over if expected rounds is 0.
    IF @ParticipantCount = 0 OR @CategoryCount = 0
    BEGIN
        SET @IsMatchOver = 1; 
        RETURN;
    END

    -- == Step 4: Multiply to get the total number of rounds ==
    -- Each non-barred participant guesses for each category once.
    SET @TotalExpectedRounds = @ParticipantCount * @CategoryCount;

    -- == Step 5: SELECT count(*) from GameRounds for myMatchId ==
    SELECT @GameRoundsPlayed = COUNT(id)
    FROM dbo.GameRounds
    WHERE match_id = @MatchID;

    -- == Step 6: If actual rounds played equals total expected rounds, the game is over ==
    IF @TotalExpectedRounds = 0 -- Handles case where no participants or categories resulted in 0 expected rounds.
    BEGIN
        SET @IsMatchOver = 1; -- If 0 rounds were expected, and 0 (or more) played, it's over.
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
    -- If an error occurs and there's an active transaction, roll it back
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Re-throw the error to the calling application
        THROW;
    END CATCH
END;