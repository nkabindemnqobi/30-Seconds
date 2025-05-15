const { sql } = require("../db/pool");
const { executeQuery } = require("../db/query");
const { withTransaction } = require("../db/transaction");
const { generateHint } = require("../services/aiGenerator");

const startRound = async (joinCode) => {
    
    const startQuery = `
        EXEC dbo.StartNewGameRound
            @JoinCode = @JoinCode;
        `;

    const startParams = { JoinCode: joinCode };
  
    try {
      const dbResult = await executeQuery(startQuery, startParams);
  
      if (dbResult && dbResult.length > 0) {
        const roundDetails = dbResult[0]; // The proc returns a single row with round details
        const roundId = roundDetails.round_id;

        const hint = await generateHint(roundDetails.guessing_item_name, roundDetails.guessing_item_category_name);

        const hintQuery = `
        EXEC dbo.InsertHintForRound
            @RoundID = @RoundID,
            @HintText = @HintText
        `;

        const hintParams = { RoundID: roundId, HintText: hint};

        const hintResult = await executeQuery(hintQuery, hintParams);

        if (hintResult && hintResult.length > 0){
            const hintDetails = hintResult[0];
            return {
                hint: hintDetails.inserted_hint_text,
                roundId: roundDetails.round_id,
                guessingUserId: roundDetails.guessing_user_id,
                guessingAlias: roundDetails.guessing_user_alias,
                itemCategory: roundDetails.guessing_item_category_name,
              };
        }
        else{
            throw new Error(
                "There was an error in generating the hint and storing it in the database."
              );
        }
      } else {
        throw new Error(
          "StartNewGameRound stored procedure did not return the expected round data. This might indicate an issue with the join code or an internal logic error in the procedure if no specific error was raised."
        );
      }
    } catch (error) {
      console.error(
        `Database error in callStartNewGameRound for join code '${joinCode}':`,
        error.message
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
    //console.log(joinCode, userId, guessInput, matchId);
    const roundQuery = await new sql.Request(transaction).input(
      "MatchId",
      matchId
    ).query(`
        SELECT TOP 1 gr.id AS roundId, gr.guessing_user_id, gi.item_name, u.alias
        FROM GameRounds gr
        JOIN GuessingItems gi ON gi.id = gr.guessing_item_id
        JOIN Users u ON u.id = gr.guessing_user_id
        WHERE gr.match_id = @MatchId AND gr.ended_datetime IS NULL
      `);

    if (roundQuery.recordset.length === 0) {
      throw new Error("No active round in progress");
    }

    const round = roundQuery.recordset[0];

    const normalizedGuess = guessInput.toLowerCase().trim();
    const normalizedAnswer = round.item_name.toLowerCase().trim();

    const isCorrect = normalizedGuess === normalizedAnswer;

    if (isCorrect) {
      await new sql.Request(transaction).input("RoundId", round.roundId).query(`
          UPDATE GameRounds
          SET ended_datetime = GETDATE(), points_awarded = 1
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
    //console.log("IS MATCH OVER RESULT:      ",isMatchOverResult[0]);
    return isMatchOverResult[0];
  } else {
    throw new Error(
      "Stored procedure did not return a result. Possible invalid join code or logic issue."
    );
  }
};

const calculateAndFinaliseScores = async (joinCode) => {
  const query = `
        EXEC dbo.CalculateAndFinalizeMatchScores
              @JoinCode = @JoinCode
        `;
  const params = { JoinCode: joinCode };

  const calculateMatchScoresResult = await executeQuery(query, params);
  if (calculateMatchScoresResult.length !== 0) {
    return calculateMatchScoresResult; // This should be an arr of objects.
  } else {
    throw new Error(
      "Stored procedure did not return a result. Possible invalid join code or logic issue."
    );
  }
};

module.exports = { startRound, makeGuess, calculateAndFinaliseScores, isMatchOver };
