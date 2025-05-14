    const express = require('express');
    const router = express.Router();
    const { fetchLobbies } = require('../handlers/Home');
    const { formatErrorResponse, getUnexpectedErrorStatus } = require('../utils/formatErrorResponse');
    const { authMiddleware } = require("../middleware/authorization");

    router.get('/lobbies', authMiddleware, async (req, res, next) => {
        try {
            const { status, public: isPublic, creatorAlias } = req.query;

            const filters = {
                status,
                isPublic: isPublic === 'true',
                creatorAlias,
            };

            const lobbies = await fetchLobbies(filters);

            if (!lobbies || lobbies.length === 0) {
                return res.status(404).json({ message: 'No lobbies found' });
            }

            res.status(200).json(lobbies);
        } catch (error) {
            return next(formatErrorResponse(getUnexpectedErrorStatus(error)));        
        }
    });
    ;


    module.exports = router;