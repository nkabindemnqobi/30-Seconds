const { formatErrorResponse, getUnexpectedErrorStatus } = require("../utils/formatErrorResponse");
const {
  broadcastToMatch,
  addUserToMatch,
  sendToUser,
  removeUserFromMatch
} = require("../utils/SSEManager");
const {
  getMatchLobbyInformation,
  getMatchIdByJoinCode,
  addUserToLobby,
  startGame,
} = require("../queries/lobby");
const {kickPlayer} = require("../queries/inGame");
const { getUserIdFromGoogleId } = require("../queries/users");

const postLobbyJoin = async (req, res, next) => {
  const joinCode = req.params.joinCode;
  const userJoiningId = await  getUserIdFromGoogleId(req.user.sub);

  try {
    const matchIdResult = await getMatchIdByJoinCode(joinCode);

    if (matchIdResult.length === 0) {
      return next(formatErrorResponse(404, "Lobby not found"));
    }

    const matchId = matchIdResult[0].id;
    await addUserToLobby(userJoiningId, matchId);
    addUserToMatch(joinCode, userJoiningId);

    const resultRows = await getMatchLobbyInformation(matchId);

    broadcastToMatch(
      joinCode,
      {
        message: `A user has joined the lobby!`,
        lobbyData: { ...resultRows, joiningUserId: userJoiningId },
      },
      "player_join"
    );
    res.status(200).json( { ...resultRows, joiningUserId: userJoiningId });
  } catch (error) {
    return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
  }
};

const handleKickPlayer = async (req,res,next) => {
  const callingUserId = await getUserIdFromGoogleId(req.user.sub);
  const kickedUserId = req.body.targetUserId;
  const joinCode = req.params.joinCode;

  if (!callingUserId || !kickedUserId || !joinCode){
    return next(formatErrorResponse(400, "Missing creator userId or target user ID"));
  }

  try {
    const matchIdResult = await getMatchIdByJoinCode(joinCode);

    if (matchIdResult.length === 0) {
      return next(formatErrorResponse(404, "Lobby not found"));
    }
    const matchId= matchIdResult[0].id;
    const kickResult = await kickPlayer({sourceUserId: callingUserId, targetUserId: kickedUserId, matchId: matchId});
    
    if (!kickResult.success){
      return next(formatErrorResponse(400, kickResult.message))
    }
    sendToUser(kickedUserId, {message: `You have been kicked from the match with join code ${joinCode} and cannot join back.`}, eventType = "message")
    removeUserFromMatch(joinCode, kickedUserId);
    const resultRows = await getMatchLobbyInformation(matchId);

    broadcastToMatch(
      joinCode,
      {
        message: `A user has been kicked from the lobby!`,
        lobbyData: { kickSuccess: true, kickMessage: `User with ID ${kickedUserId} has been kicked from the lobby!`, ...resultRows },
      },
      "player_kick"
    );

    res.status(200).json( { kickSuccess: true, kickMessage: ``, ...resultRows });
    
  } catch (error) {
    return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
  }

}

const handleStartGame = async (req, res, next) => {
  try {
    const { joinCode } = req.params;
    const userId = await getUserIdFromGoogleId(req.user.sub);

    if (!joinCode || !userId) {
      return next(formatErrorResponse(400, "Missing joinCode or userId"));
    }
    const result = await startGame({ joinCode, userId });
    broadcastToMatch(joinCode, {
      data: { message: "Game started!", matchId: result.matchId, joinCode: joinCode },
    }, "game_started");
    res.status(200).json({ message: "Game started successfully." });
  } catch (error) {
    return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
  }
};

module.exports = {
  postLobbyJoin,
  handleStartGame,
  handleKickPlayer
};
