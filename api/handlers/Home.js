const { fetchAllPublicLobbies } = require('../queries/home');
const formatErrorResponse = require('../utils/formatErrorResponse');

const getAllPublicLobbies = async (req, res) => {
    try {
        const result = await fetchAllPublicLobbies();

        if (!result || result.length === 0) {
            return res.status(404).json({ message: 'No public lobbies found' });
        }

        const lobbiesMap = new Map();

        for (const row of result) {
            const {
                matchId, joinCode, startedDatetime, categoryId,
                categoryName, creatorAlias, maxParticipants,
                participantCount, bannedUserId, bannedUserAlias,
            } = row;

            if (!lobbiesMap.has(matchId)) {
                lobbiesMap.set(matchId, {
                    matchId,
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
    } catch (err) {
        const { status, error, reason } = formatErrorResponse(err, 'Public Lobbies');
        res.status(status).json({ error, reason });
    }
};

module.exports = {
    getAllPublicLobbies,
};
