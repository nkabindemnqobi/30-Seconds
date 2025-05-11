const { formatErrorResponse, getUnexpectedErrorStatus } = require('../utils/formatErrorResponse');
const { getAllCategoriesFromDb, createLobby } = require("../queries/createLobby");
const { addUserToMatch, sendToUser } = require("../utils/SSEManager");

const getAllCategories = async (req, res, next) => {
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

const handleCreateLobby = async (req, res) => {
    try {
        const { userId, categoryIds, isPublic, maxParticipants, lobbyName } = req.body;

        if (
            !userId ||
            !Array.isArray(categoryIds) ||
            categoryIds.length === 0 ||
            typeof isPublic !== "boolean" ||
            typeof maxParticipants !== "number" ||
            maxParticipants < 1 ||
            !lobbyName
        ) {
            return res.status(400).json({ message: "Invalid input" });
        }

        const joinCode = await createLobby({
            userId,
            categoryIds,
            isPublic,
            maxParticipants,
            lobbyName,
        });

        addUserToMatch(joinCode, userId);
        const result = {
            data: {
                message: "Match created successfully.",
                joinCode,
                lobbyName,
            }
        }
        sendToUser(userId, result, "match_created");
        return res.status(201).json({ data: { joinCode: joinCode } });
    } catch (err) {
        const { status, error, reason } = formatErrorResponse(err, "create-lobby");
        return res.status(status).json({ error, reason });
    }
};


module.exports = {
    getAllCategories,
    handleCreateLobby
};
