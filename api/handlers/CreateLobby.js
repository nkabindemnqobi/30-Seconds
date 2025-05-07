const { executeQuery } = require('../db/query');
const formatErrorResponse = require('../utils/formatErrorResponse');

const getAllCategories = async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM Categories');

        if (!result || result.length === 0) {
            return res.status(404).json({ message: 'No categories found' });
        }

        res.status(200).json(result);
    } catch (err) {
        const { status, error, reason } = formatErrorResponse(err, 'categories');
        res.status(status).json({ error, reason });
    }
};

module.exports = {
    getAllCategories,
};
