CREATE OR ALTER PROCEDURE dbo.InsertHintForRound
    @RoundID INT,
    @HintText VARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @GuessingItemID INT;
    DECLARE @NextHintOrder INT;
    DECLARE @CurrentHintCount INT;
    DECLARE @MaxHintsAllowed INT = 10; -- Define the maximum number of hints

    -- == Step 1: Get the GuessingItemID and current hint_count for the given RoundID ==
    SELECT
        @GuessingItemID = gr.guessing_item_id,
        @CurrentHintCount = gr.hint_count -- Get current hint count
    FROM dbo.GameRounds gr
    WHERE gr.id = @RoundID;

    IF @GuessingItemID IS NULL
    BEGIN
        -- RoundID not found or it doesn't have an associated guessing_item_id
        RAISERROR('GameRound with ID %d not found or it has no associated guessing item.', 16, 1, @RoundID);
        RETURN; -- Exit procedure
    END;

    -- == Step 2: Check if the maximum number of hints has already been reached ==
    IF @CurrentHintCount >= @MaxHintsAllowed
    BEGIN
        PRINT 'INFO: Maximum hints (%d) already reached for GameRound ID %d. No new hint will be added.';
        -- Return an object indicating no more hints are allowed
        SELECT
            NULL AS inserted_hint_text,
            NULL AS hint_order,
            @CurrentHintCount AS current_round_hint_count, -- Show the current (maxed out) hint count
            0 AS CanRequestMoreHints, -- Flag indicating no more hints
            'Maximum hints reached.' AS status_message;
        RETURN;
    END;

    -- If we proceed, it means more hints can be provided.
    BEGIN TRY
        BEGIN TRANSACTION;

        -- == Step 3: Determine the next hint_order for this GuessingItemID ==
        SELECT @NextHintOrder = ISNULL(MAX(hint_order), 0) + 1
        FROM dbo.Hints
        WHERE guessing_item_id = @GuessingItemID;

        -- == Step 4: Insert the hint into the Hints table with the dynamic order ==
        INSERT INTO dbo.Hints (guessing_item_id, hint_text, hint_order)
        VALUES (@GuessingItemID, @HintText, @NextHintOrder);

        -- == Step 5: Update the hint_count in the GameRounds table for this round ==
        DECLARE @NewHintCount INT = @CurrentHintCount + 1;
        UPDATE dbo.GameRounds
        SET hint_count = @NewHintCount -- Increment the existing hint_count
        WHERE id = @RoundID;

        IF @@ROWCOUNT = 0 -- Check if the update to GameRounds was successful
        BEGIN
            -- This should not happen if the RoundID was valid in Step 1
            RAISERROR('Failed to update hint_count for GameRound ID %d.', 16, 1, @RoundID);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        COMMIT TRANSACTION;

        -- == Step 6: Return the inserted hint_text, its order, and hint status ==
        SELECT
            @HintText AS inserted_hint_text,
            @NextHintOrder AS hint_order,
            @NewHintCount AS new_round_hint_count,
            CASE WHEN @NewHintCount < @MaxHintsAllowed THEN 1 ELSE 0 END AS CanRequestMoreHints, -- Indicate if more hints can still be requested after this one
            'Hint provided successfully.' AS status_message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW; -- Re-throw the error to the calling application
    END CATCH
END;
