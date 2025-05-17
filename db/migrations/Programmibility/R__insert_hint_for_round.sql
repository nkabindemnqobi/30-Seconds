CREATE OR ALTER PROCEDURE dbo.InsertHintForRound
    @RoundID INT,
    @HintText VARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @GuessingItemID INT;
    DECLARE @NextHintOrder INT;
    DECLARE @CurrentHintCount INT;
    DECLARE @MaxHintsAllowed INT = 4; 

    
    SELECT
        @GuessingItemID = gr.guessing_item_id,
        @CurrentHintCount = gr.hint_count 
    FROM dbo.GameRounds gr
    WHERE gr.id = @RoundID;

    IF @GuessingItemID IS NULL
    BEGIN
        
        RAISERROR('GameRound with ID %d not found or it has no associated guessing item.', 16, 1, @RoundID);
        RETURN; 
    END;

    
    IF @CurrentHintCount >= @MaxHintsAllowed
    BEGIN
        PRINT 'INFO: Maximum hints (%d) already reached for GameRound ID %d. No new hint will be added.';
        
        SELECT
            NULL AS inserted_hint_text,
            NULL AS hint_order,
            @CurrentHintCount AS current_round_hint_count, 
            0 AS CanRequestMoreHints, 
            'Maximum hints reached.' AS status_message;
        RETURN;
    END;

    
    BEGIN TRY
        BEGIN TRANSACTION;

        
        SELECT @NextHintOrder = ISNULL(MAX(hint_order), 0) + 1
        FROM dbo.Hints
        WHERE guessing_item_id = @GuessingItemID;

        
        INSERT INTO dbo.Hints (guessing_item_id, hint_text, hint_order)
        VALUES (@GuessingItemID, @HintText, @NextHintOrder);

        
        DECLARE @NewHintCount INT = @CurrentHintCount + 1;
        UPDATE dbo.GameRounds
        SET hint_count = @NewHintCount 
        WHERE id = @RoundID;

        IF @@ROWCOUNT = 0 
        BEGIN
            
            RAISERROR('Failed to update hint_count for GameRound ID %d.', 16, 1, @RoundID);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        COMMIT TRANSACTION;

        
        SELECT
            @HintText AS inserted_hint_text,
            @NextHintOrder AS hint_order,
            @NewHintCount AS new_round_hint_count,
            CASE WHEN @NewHintCount < @MaxHintsAllowed THEN 1 ELSE 0 END AS CanRequestMoreHints, 
            'Hint provided successfully.' AS status_message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW; 
    END CATCH
END;
