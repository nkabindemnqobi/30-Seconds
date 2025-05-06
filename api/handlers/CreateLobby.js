const { executeQuery } = require('../db/query');

async function getAllCategories(req, res) {
    try {
        const result = await executeQuery('SELECT * FROM Categories');
        res.json(result);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).send('Failed to get categories');
    }
}

module.exports = {
    getAllCategories,
};
