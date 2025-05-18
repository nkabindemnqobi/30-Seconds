const { sql } = require("../db/pool");
const { executeQuery } = require("../db/query");
const { withTransaction } = require("../db/transaction");
const { generateHint, fetchHintFromDb } = require("../services/aiGenerator");
const { timeoutPromise } = require("../utils/AIFallBackTimeout");

const AI_TIMEOUT = 3000;

const startRound = async (joinCode) => {
  let guessingItemInfo = {};
  try {
    guessingItemInfo = await withTransaction(async ({ transaction }) => {
      const matchQuery = await new sql.Request(transaction)
        .input("JoinCode", joinCode)
        .query(`SELECT id FROM Matches WHERE join_code = @JoinCode`);
      if (matchQuery.recordset.length === 0) {
        throw new Error("Invalid join code");
      }
      const matchId = matchQuery.recordset[0].id;
      const guessingItemResult = await new sql.Request(transaction).input(
        "MatchId",
        matchId
      ).query(`
        SELECT TOP 1
             gi.id as guessingItemId,
             gi.item_name as guessingItemName,
             gi.category_id as guessingItemCategoryId,
             c.name as guessingItemCategory
        FROM dbo.GuessingItems gi
        INNER JOIN dbo.Categories c ON c.id = gi.category_id
        INNER JOIN dbo.CategoriesMatches cm ON cm.category_id = c.id AND cm.match_id = @MatchID
        WHERE gi.id NOT IN (
            SELECT DISTINCT gr.guessing_item_id
            FROM dbo.GameRounds gr
            WHERE gr.match_id = @MatchID AND gr.guessing_item_id IS NOT NULL
        )
        ORDER BY NEWID();
      `);
      if (guessingItemResult.recordset.length === 0) {
        throw new Error("Failed to get guessing item");
      }
      return {
        guessingItemId: guessingItemResult.recordset[0].guessingItemId,
        guessingItemName: guessingItemResult.recordset[0].guessingItemName,
        guessingItemCategory:
          guessingItemResult.recordset[0].guessingItemCategory,
        guessingItemCategoryId:
          guessingItemResult.recordset[0].guessingItemCategoryId,
      };
    });
  } catch (error) {
    throw new Error("Query for guessing item selection has failed.");
  }

  const fallback = {
    hintText: "FAILURE",
    saveHint: null,
  };
  let hint = "";
  try {
    hint = await Promise.race([
      generateHint(
        guessingItemInfo.guessingItemName,
        guessingItemInfo.guessingItemCategory,
        1,
        guessingItemInfo.guessingItemCategoryId
      ),
      timeoutPromise(AI_TIMEOUT, fallback),
    ]);
  } catch (error) {
    console.error("Error generating hint:", error);
  }

  try {
    if (hint === fallback) {
      hint = await fetchHintFromDb(
        guessingItemInfo.guessingItemName,
        guessingItemInfo.guessingItemCategoryId,
        1
      );
    }
  } catch (error) {
    throw new Error("Failure fetching hint from the database");
  }

  const startQuery = `
    EXEC dbo.StartNewGameRound
      @JoinCode = @JoinCode,
      @GuessingItemID = @GuessingItemID
  `;

  const startParams = {
    JoinCode: joinCode,
    GuessingItemID: guessingItemInfo.guessingItemId,
  };

  try {
    const dbResult = await executeQuery(startQuery, startParams);

    if (!dbResult || dbResult.length === 0) {
      throw new Error(
        "StartNewGameRound did not return any data. The join code may be invalid or the procedure failed internally."
      );
    }

    const roundDetails = dbResult[0];
    const roundId = roundDetails.round_id;

    if (!hint.hintText) {
      throw new Error("No hint could be generated or retrieved from fallback.");
    }

    let insertedHintText = hint.hintText;

    if (hint.saveHint) {
      const hintQuery = `
        EXEC dbo.InsertHintForRound
          @RoundID = @RoundID,
          @HintText = @HintText;
      `;
      const hintParams = { RoundID: roundId, HintText: hint.hintText };

      const hintResult = await executeQuery(hintQuery, hintParams);

      if (!hintResult || hintResult.length === 0) {
        throw new Error(
          "Hint was generated but failed to be inserted into the database."
        );
      }

      insertedHintText = hintResult[0].inserted_hint_text;
    }

    return {
      roundId: roundDetails.round_id,
      guessingUserId: roundDetails.guessing_user_id,
      guessingAlias: roundDetails.guessing_user_alias,
      itemCategory: guessingItemInfo.guessingItemCategory,
      hint: insertedHintText,
    };
  } catch (error) {
    console.error(
      `[startRound error for joinCode ${joinCode}]: ${error.message}`
    );
    throw error;
  }
};

const makeGuess = async (joinCode, userId, guessInput) => {
  return await withTransaction(async ({ transaction }) => {
    const matchQuery = await new sql.Request(transaction)
      .input("JoinCode", joinCode)
      .query(`SELECT id FROM Matches WHERE join_code = @JoinCode`);

    if (matchQuery.recordset.length === 0) {
      throw new Error("Invalid join code");
    }

    const matchId = matchQuery.recordset[0].id;
    const roundQuery = await new sql.Request(transaction).input(
      "MatchId",
      matchId
    ).query(`
        SELECT TOP 1 gr.id AS roundId, gr.guessing_user_id, gi.item_name, u.alias
        FROM GameRounds gr
        JOIN GuessingItems gi ON gi.id = gr.guessing_item_id
        JOIN Users u ON u.id = gr.guessing_user_id
        WHERE gr.match_id = @MatchId AND gr.ended_at IS NULL
      `);

    if (roundQuery.recordset.length === 0) {
      throw new Error("No active round in progress");
    }

    const round = roundQuery.recordset[0];

    if (round.guessing_user_id !== userId) {
      throw new Error("It is not your turn to guess");
    }

    const normalizedGuess = guessInput.toLowerCase().trim();
    const normalizedAnswer = round.item_name.toLowerCase().trim();

    const isCorrect = normalizedGuess === normalizedAnswer;

    if (isCorrect) {
      await new sql.Request(transaction).input("RoundId", round.roundId).query(`
          UPDATE GameRounds
          SET ended_at = GETDATE(), points_awarded = 1
          WHERE id = @RoundId
        `);
    }

    return {
      roundId: round.roundId,
      guessingUserId: round.guessing_user_id,
      guessingAlias: round.alias,
      itemName: isCorrect ? round.item_name : undefined,
      correct: isCorrect,
      message: isCorrect ? "Correct guess!" : "Incorrect guess.",
    };
  });
};

const isMatchOver = async (joinCode) => {
  const query = `
      EXEC dbo.CheckIfMatchIsOver
            @JoinCode = @JoinCode
      `;
  const params = { JoinCode: joinCode };

  const isMatchOverResult = await executeQuery(query, params);
  if (isMatchOverResult[0]) {
    return isMatchOverResult[0];
  } else {
    throw new Error(
      "Stored procedure did not return a result. Possible invalid join code or logic issue."
    );
  }
};

const calculateAndFinaliseScores = async (joinCode, finalizeMatch) => {
  const query = `
        EXEC dbo.CalculateAndFinalizeMatchScores
              @JoinCode = @JoinCode,
              @FinalizeMatch = @FinalizeMatch
        `;
  const params = { JoinCode: joinCode, FinalizeMatch: finalizeMatch };

  const calculateMatchScoresResult = await executeQuery(query, params);
  if (calculateMatchScoresResult.length !== 0) {
    return calculateMatchScoresResult;
  } else {
    throw new Error(
      "Stored procedure did not return a result. Possible invalid join code or logic issue."
    );
  }
};

const getHint = async (joinCode, userId) => {
  const matchResult = await executeQuery(
    "SELECT id FROM Matches WHERE join_code = @joinCode",
    { joinCode }
  );

  if (!matchResult || matchResult.length === 0) {
    throw new Error("Invalid join code");
  }

  const matchId = matchResult[0].id;

  const getActiveRoundQuery = `
    SELECT TOP 1 
      gr.id AS roundId,
      gr.guessing_user_id,
      gi.item_name,
      gi.category_id,
      c.name AS category,
      gr.hint_count as hintCount
    FROM GameRounds gr
    JOIN GuessingItems gi ON gi.id = gr.guessing_item_id
    JOIN Categories c ON gi.category_id = c.id
    WHERE gr.match_id = @matchId AND gr.ended_at IS NULL
  `;

  const roundResult = await executeQuery(getActiveRoundQuery, { matchId });

  if (!roundResult || roundResult.length === 0) {
    throw new Error("No active round in progress");
  }

  const round = roundResult[0];

  if (round.guessing_user_id !== userId) {
    throw new Error("Not your turn to request a hint");
  }
  ////////////////////////////////////
  const fallback = {
    hintText: "FAILURE",
    saveHint: null,
  };
  let hint = "";
  try {
    hint = await Promise.race([
      generateHint(
        round.item_name,
        round.category,
        round.hintCount,
        round.category_id
      ),
      timeoutPromise(AI_TIMEOUT, fallback),
    ]);
  } catch (error) {
    console.error("Error generating hint:", error);
  }

  try {
    if (hint === fallback) {
      hint = await fetchHintFromDb(
        round.item_name,
        round.category_id,
        round.hintCount+2
      );
    }
  } catch (error) {
    throw new Error("Failure fetching hint from the database");
  }

  if (!hint.hintText) {
    throw new Error("No hint could be generated or retrieved.");
  }

  let insertedHint = hint.hintText;

    const hintQuery = `
      EXEC dbo.InsertHintForRound
        @RoundID = @RoundID,
        @HintText = @HintText
    `;
    const hintParams = {
      RoundID: round.roundId,
      HintText: hint.hintText,
    };

    const hintResult = await executeQuery(hintQuery, hintParams);

    if (!hintResult || hintResult.length === 0) {
      throw new Error(
        "Hint generated but failed to be stored in the database."
      );
    }

    const hintDetails = hintResult[0];

    if (
      hintDetails.CanRequestMoreHints === 0 &&
      hintDetails.status_message !== "Hint provided successfully."
    ) {
      return {
        roundId: round.roundId,
        hint: null,
        success: false,
      };
    }

    insertedHint = hintDetails.inserted_hint_text;

  return {
    roundId: round.roundId,
    hint: insertedHint,
    success: true,
  };
};

const setRoundByTimeout = async (joinCode, roundId) => {
  const query = `
      EXEC dbo.HandleGameRoundTimeout
          @JoinCode = @JoinCode,
          @RoundID = @RoundID
      `;
  const params = { JoinCode: joinCode, RoundID: roundId };

  try {
    const result = await executeQuery(query, params);
    return { success: true, data: result[0].item_name };
  } catch (error) {
    console.error(
      `[setRoundByTimeout] Error executing dbo.HandleGameRoundTimeout for joinCode '${joinCode}':`,
      error.message
    );
    throw error;
  }
};

module.exports = {
  startRound,
  makeGuess,
  calculateAndFinaliseScores,
  isMatchOver,
  setRoundByTimeout,
  getHint,
};
