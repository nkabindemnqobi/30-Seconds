    const express = require('express');
    const router = express.Router();
    const { fetchLobbies } = require('../handlers/Home');
    const formatErrorResponse = require('../utils/formatErrorResponse');

    router.get('/lobbies', async (req, res) => {
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
        } catch (err) {
            const { status, error, reason } = formatErrorResponse(err, 'Public Lobbies');
            res.status(status).json({ error, reason });
        }
    });
    ;


    module.exports = router;