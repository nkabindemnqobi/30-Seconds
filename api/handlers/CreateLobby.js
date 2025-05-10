const { getAllCategoriesFromDb, createLobby } = require("../queries/createLobby");
const formatErrorResponse = require('../utils/formatErrorResponse');
const { addUserToMatch, sendToUser } = require("../utils/SSEManager");

const getAllCategories = async (req, res) => {
    try {
        const result = await getAllCategoriesFromDb();

        if (!result || result.length === 0) {
            return res.status(404).json({ message: 'No categories found' });
        }

        res.status(200).json(result);
    } catch (err) {
        const { status, error, reason } = formatErrorResponse(err, 'categories');
        res.status(status).json({ error, reason });
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
