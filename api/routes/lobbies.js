const express = require("express");
const { createLobby } = require("../queries/lobbies");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { isPublic, matchCreatorId, statusId, maxParticipants, teams } =
      req.body;
    //TODO : show specific errors
    //return record for match created
    if (
      !isPublic ||
      !matchCreatorId ||
      !statusId ||
      !maxParticipants ||
      !Array.isArray(teams)
    ) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    const result = await createLobby(
      isPublic,
      matchCreatorId,
      statusId,
      maxParticipants,
      teams
    );

    res.status(201).json({
      message: "Lobby created successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
