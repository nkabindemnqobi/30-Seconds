CREATE OR ALTER PROCEDURE dbo.InsertHintForRound
    @RoundID INT,
    @HintText VARCHAR(200) 
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @GuessingItemID INT;
    DECLARE @NextHintOrder INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- == Step 1: Get the GuessingItemID for the given RoundID ==
        SELECT @GuessingItemID = guessing_item_id
        FROM dbo.GameRounds
        WHERE id = @RoundID;

        IF @GuessingItemID IS NULL
        BEGIN
            RAISERROR('GameRound with ID %d not found or it has no associated guessing item.', 16, 1, @RoundID);
            ROLLBACK TRANSACTION;
            RETURN; 
        END

        -- == Step 2: Determine the next hint_order for this GuessingItemID ==
        SELECT @NextHintOrder = ISNULL(MAX(hint_order), 0) + 1
        FROM dbo.Hints
        WHERE guessing_item_id = @GuessingItemID;

        -- == Step 3: Insert the hint into the Hints table with the dynamic order ==
        INSERT INTO dbo.Hints (guessing_item_id, hint_text, hint_order)
        VALUES (@GuessingItemID, @HintText, @NextHintOrder);

        COMMIT TRANSACTION;

        -- == Step 4: Return the inserted hint_text and its order ==
        SELECT @HintText AS inserted_hint_text, @NextHintOrder AS hint_order;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW; 
    END CATCH
END;
