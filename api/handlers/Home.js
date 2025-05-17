const { fetchLobbies } = require('../services/lobbies'); 
const { formatErrorResponse, getUnexpectedErrorStatus } = require('../utils/formatErrorResponse');

const handleFetchLobbies = async (req, res, next) => {
    try {
        const { status, public: isPublic, creatorAlias } = req.query;

        const filters = {
            status,
            isPublic: isPublic === 'true',
            creatorAlias,
        };

        const lobbies = await fetchLobbies(filters);

        if (!lobbies || lobbies.length === 0) {
            return next(formatErrorResponse(404, 'No lobbies found'));
        }

        res.status(200).json(lobbies);
    } catch (error) {
        return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
    }
};

module.exports = {
    handleFetchLobbies,
};
