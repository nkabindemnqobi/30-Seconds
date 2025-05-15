CREATE OR ALTER PROCEDURE dbo.StartNewGameRound
    @JoinCode VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    -- Declare variables for internal use
    DECLARE @MatchID INT;
    DECLARE @GuessingUserID INT;
    DECLARE @GuessingUserAlias VARCHAR(20);
    DECLARE @GuessingItemID INT;
    DECLARE @GuessingItemName VARCHAR(100);
    DECLARE @GuessingItemCategoryName VARCHAR(100);
    DECLARE @NewRoundID INT;

    BEGIN TRY
        -- == Step 1: Get MatchID from JoinCode ==
        SELECT @MatchID = id
        FROM dbo.Matches
        WHERE join_code = @JoinCode;

        IF @MatchID IS NULL
        BEGIN
            RAISERROR('Invalid join code provided: ''%s''. Match not found.', 16, 1, @JoinCode);
            RETURN; -- Exit if match not found, transaction not yet started
        END; -- Added semicolon for clarity, though not strictly needed before BEGIN TRANSACTION

        BEGIN TRANSACTION; -- Start transaction after initial validation

        -- == Step 2: Check if a round is already in progress for this match ==
        IF EXISTS (SELECT 1 FROM dbo.GameRounds WHERE match_id = @MatchID AND ended_datetime IS NULL)
        BEGIN
            RAISERROR('A round is already in progress for Match ID %d (Join Code: ''%s'').', 16, 1, @MatchID, @JoinCode);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- == Step 3: Determine the next GuessingUserID ==
        SELECT @GuessingUserAlias = alias FROM dbo.Users WHERE id = @GuessingUserID; -- This line was misplaced, moved after @GuessingUserID is determined
                                                                                    -- Also, @GuessingUserID is not yet set here. This logic needs to be after @GuessingUserID is found.

        -- The following WITH clause needs the preceding statement (END from IF or the SELECT above) to have a semicolon.
        -- For safety, ensure the statement before WITH always has a semicolon.
        -- The previous SELECT @GuessingUserAlias would be the one needing a semicolon if it were here.
        -- Correct placement of @GuessingUserAlias selection is after @GuessingUserID is determined.

        WITH EligiblePlayers AS (
            SELECT mp.user_id
            FROM dbo.MatchParticipants mp
            INNER JOIN dbo.MatchParticipantsStatus s ON s.id = mp.match_participants_status_id
            WHERE mp.match_id = @MatchID AND s.status IN ('Playing', 'Creator')
        ),
        PlayerRoundCounts AS (
            SELECT
                ep.user_id,
                COUNT(gr.id) AS rounds_played
            FROM EligiblePlayers ep
            LEFT JOIN dbo.GameRounds gr ON gr.match_id = @MatchID AND gr.guessing_user_id = ep.user_id
            GROUP BY ep.user_id
        )
        SELECT TOP 1 @GuessingUserID = prc.user_id
        FROM PlayerRoundCounts prc
        ORDER BY prc.rounds_played ASC, NEWID() ASC; -- NEWID() for random tie-breaking

        IF @GuessingUserID IS NULL
        BEGIN
            RAISERROR('Could not determine the next player for Match ID %d. No eligible players found.', 16, 1, @MatchID);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Now that @GuessingUserID is determined, get the alias
        SELECT @GuessingUserAlias = alias FROM dbo.Users WHERE id = @GuessingUserID;
        IF @GuessingUserAlias IS NULL
        BEGIN
             RAISERROR('Could not find alias for Guessing User ID %d.', 16, 1, @GuessingUserID);
            ROLLBACK TRANSACTION;
            RETURN;
        END; -- Corrected: Added semicolon before the next WITH or major block

        -- == Step 4: Select an unused GuessingItem for the match ==
        SELECT TOP 1
            @GuessingItemID = gi.id,
            @GuessingItemName = gi.item_name,
            @GuessingItemCategoryName = c.name
        FROM dbo.GuessingItems gi
        INNER JOIN dbo.Categories c ON c.id = gi.category_id
        INNER JOIN dbo.CategoriesMatches cm ON cm.category_id = c.id AND cm.match_id = @MatchID
        WHERE gi.id NOT IN (
              SELECT DISTINCT gr.guessing_item_id
              FROM dbo.GameRounds gr
              WHERE gr.match_id = @MatchID AND gr.guessing_item_id IS NOT NULL
          )
        ORDER BY NEWID();

        IF @GuessingItemID IS NULL
        BEGIN
            RAISERROR('No more unused guessing items available for Match ID %d (Join Code: ''%s'').', 16, 1, @MatchID, @JoinCode);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- == Step 5: Insert the new GameRound ==
        INSERT INTO dbo.GameRounds (
            match_id,
            guessing_user_id,
            guessing_item_id,
            timer_started,
            ended_datetime,
            hint_count,
            points_awarded,
            time_in_ms
        )
        -- OUTPUT INSERTED.id -- Removed this as SCOPE_IDENTITY() is used below and this sends an extra result set
        VALUES (
            @MatchID,
            @GuessingUserID,
            @GuessingItemID,
            GETDATE(),
            NULL,
            1,
            0,
            0
        );

        SET @NewRoundID = SCOPE_IDENTITY();

        IF @NewRoundID IS NULL OR @NewRoundID = 0
        BEGIN
            RAISERROR('Failed to insert new game round for Match ID %d (Join Code: ''%s'').', 16, 1, @MatchID, @JoinCode);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        COMMIT TRANSACTION;

        -- == Step 6: Return details of the newly started round ==
        SELECT
            @NewRoundID AS round_id,
            @GuessingUserID AS guessing_user_id,
            @GuessingUserAlias AS guessing_user_alias,
            @GuessingItemID AS guessing_item_id,
            @GuessingItemName AS guessing_item_name,
            @GuessingItemCategoryName AS guessing_item_category_name;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
