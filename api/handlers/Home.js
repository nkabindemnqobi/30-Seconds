const { fetchLobbiesQuery } = require('../queries/home');
const { formatErrorResponse, getUnexpectedErrorStatus } = require('../utils/formatErrorResponse');

const fetchLobbies = async ({ status, isPublic, creatorAlias }) => {
    try {
        const result = await fetchLobbiesQuery({ status, isPublic, creatorAlias });
        if (!result || result.length === 0) {
            return result;
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
        return Array.from(lobbiesMap.values());
    } catch (error) {
        throw error;
    }
};

module.exports = { fetchLobbies };
