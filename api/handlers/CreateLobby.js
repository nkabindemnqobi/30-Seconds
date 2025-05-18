const { formatErrorResponse, getUnexpectedErrorStatus } = require('../utils/formatErrorResponse');
const { getAllCategoriesFromDb, createLobby } = require("../queries/createLobby");
const { addUserToMatch, sendToUser } = require("../utils/SSEManager");
const { getUserIdFromGoogleId } = require('../queries/users');
const {getMatchIdByJoinCode, getMatchLobbyInformation} = require("../queries/lobby");

const getAllCategories = async (_, res, next) => {
    try {
        const result = await getAllCategoriesFromDb();
 
        if (!result || result.length === 0) {
            return next(formatErrorResponse(404, 'No categories found'));
        }
       
        res.status(200).json(result);
    } catch (error) {
        return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
    }
};
 
const handleCreateLobby = async (req, res, next) => {
    try {

        const userId = await getUserIdFromGoogleId(req.user.sub);
        const { categoryIds, isPublic, maxParticipants, lobbyName } = req.body;
        
        if (
            !userId ||
            !Array.isArray(categoryIds) ||
            categoryIds.length === 0 ||
            typeof isPublic !== "boolean" ||
            typeof maxParticipants !== "number" || 
            maxParticipants < 1 ||
            !lobbyName 
        ) {
            return next(formatErrorResponse(400, "Invalid input"));
        }
 
        const joinCode = await createLobby({
            userId,
            categoryIds,
            isPublic,
            maxParticipants,
            lobbyName,
        });
 
        addUserToMatch(joinCode, userId);
        const matchIdResult = await getMatchIdByJoinCode(joinCode);

        if (matchIdResult.length === 0) {
        return next(formatErrorResponse(404, "Lobby not found"));
        }

        const matchId = matchIdResult[0].id;
        const resultRows = await getMatchLobbyInformation(matchId);

        const result = {
            data: {
                message: "Match created successfully.",
                joinCode,
                lobbyName,
            }
        }
        sendToUser(userId, resultRows, "match_created");
        res.status(201).json({ data: resultRows });
    } catch (error) {
        return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
    }
};
 
module.exports = {
    getAllCategories,
    handleCreateLobby
};
 
