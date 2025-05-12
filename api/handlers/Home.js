const { executeQuery } = require('../db/query');
const { formatErrorResponse, getUnexpectedErrorStatus } = require('../utils/formatErrorResponse');
const { fetchLobbiesQuery } = require('../queries/home');

const fetchLobbies = async (req, res, next) => {
    const { status, isPublic, creatorAlias } = req.query;

    try {
        const result = await fetchLobbiesQuery({ status, isPublic, creatorAlias });
        if (!result || result.length === 0) {
            return next(formatErrorResponse(404, 'No lobbies found'));
        }

        const lobbiesMap = new Map();

        for (const row of result) {
            const {
                matchId, joinCode, lobbyName, startedDatetime, categoryId,
                categoryName, creatorAlias, maxParticipants,
                participantCount, bannedUserId, bannedUserAlias,
            } = row;

            if (!lobbiesMap.has(matchId)) {
                lobbiesMap.set(matchId, {
                    matchId,
                    lobbyName,
                    joinCode,
                    startedDatetime,
                    creatorAlias,
                    maxParticipants,
                    participantCount,
                    categories: [],
                    bannedUsers: [],
                });
            }

            const lobby = lobbiesMap.get(matchId);

            if (!lobby.categories.some(c => c.id === categoryId)) {
                lobby.categories.push({ id: categoryId, name: categoryName });
            }

            if (bannedUserId && !lobby.bannedUsers.some(u => u.id === bannedUserId)) {
                lobby.bannedUsers.push({ id: bannedUserId, alias: bannedUserAlias });
            }
        }
        res.status(200).json(Array.from(lobbiesMap.values()));
    } catch (error) {
        return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
    }
};

module.exports = {
    fetchLobbies,
};
