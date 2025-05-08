const { executeQuery } = require("../db/query");
const sql = require("mssql");
const formatErrorResponse = require("../utils/formatErrorResponse");

const lobbies = new Map();

const lobbyConnection = async (req, res) => {
  console.log(req.params.joinCode);
  const joinCode = req.params.joinCode;

  // REQUIRED FOR SSE
  //TODO: make reusable somewhere else
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.write('event: connected\ndata: {"status": "OK"}\n\n');

  if (!lobbies.has(joinCode)) {
    lobbies.set(joinCode, new Set());
  }

  const lobbyMembers = lobbies.get(joinCode);
  lobbyMembers.add(res);

  req.on("close", () => {
    lobbyMembers.delete(res);
    if (lobbyMembers.size === 0) {
      lobbies.delete(joinCode);
    }
  });
};

//Assume player is in limbo. We use a different EP for joining team.
const postLobbyJoin = async (req, res) => {
  const joinCode = req.params.joinCode;
  const userJoiningId = req.body.id;

  if (!joinCode || !userJoiningId) {
    console.log(joinCode, userJoiningId);
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const matchIdQuery = `
    SELECT id FROM matches
    WHERE join_code = @joinCode;
  `;
    const matchIdResult = await executeQuery(matchIdQuery, [
      { name: "joinCode", type: sql.VarChar, value: joinCode },
    ]);

    if (matchIdResult.length === 0) {
      return res.status(404).json({ message: "Lobby not found." });
    }

    const matchId = matchIdResult[0].id;
    console.log(matchId);

    const checkQuery = `
        SELECT id FROM match_participants
        WHERE user_id = @userId AND match_id = @matchId;
      `;
    const existing = await executeQuery(checkQuery, [
      { name: "userId", type: sql.Int, value: userJoiningId },
      { name: "matchId", type: sql.Int, value: matchId },
    ]);

    if (existing.length > 0) {
      return res.status(409).json({ message: "User already in this lobby." });
    }

    const insertQuery = `
        INSERT INTO match_participants (user_id, match_id)
        VALUES (@userId, @matchId);
      `;
    await executeQuery(insertQuery, [
      { name: "userId", type: sql.Int, value: userJoiningId },
      { name: "matchId", type: sql.Int, value: matchId },
    ]);

    const matchQuery = `
        SELECT
            m.id AS match_id,
            m.join_code,
            m.is_public,
            m.match_creator_id,
            m.status_id,
            s.status AS match_status,
            m.max_participants,
            m.started_datetime,
            m.completed_datetime
        FROM matches m
        JOIN status s ON m.status_id = s.id
        WHERE m.id = @matchId;
      `;
    const matchInfo = await executeQuery(matchQuery, [
      { name: "matchId", type: sql.Int, value: matchId },
    ]);

    broadcastToLobby(joinCode, {
      message: "User joined",
      matchInfo: matchInfo[0],
    });

    res.status(200).json({ message: "User successfully joined the lobby." });
  } catch (err) {
    const { status, error, reason } = formatErrorResponse(err, "Join Lobby");
    res.status(status).json({ error, reason });
  }
};

function broadcastToLobby(joinCode, data) {
  if (lobbies.has(joinCode)) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    lobbies.get(joinCode).forEach((lobbyMember) => {
      lobbyMember.write(message);
    });
  }
}

module.exports = {
  postLobbyJoin,
  lobbyConnection,
};
