const { executeQuery } = require('../db/query');
const { formatErrorResponse, getUnexpectedErrorStatus } = require('../utils/formatErrorResponse');

const getAllCategories = async (req, res, next) => {
    try {
        const result = await executeQuery('SELECT * FROM Categories');

        if (!result || result.length === 0) {
            return next(formatErrorResponse(404, 'No categories found'));
        }

        res.status(200).json(result);
    } catch (error) {
        return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
    }
};

module.exports = {
    getAllCategories,
};
