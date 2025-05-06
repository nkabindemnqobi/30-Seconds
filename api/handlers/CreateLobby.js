const sql = require('mssql');
const dbConfig = require('../db/connection');

async function getAllCategories(req, res) {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query('SELECT * FROM Categories');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).send('Failed to get categories');
    }
}


module.exports = {
    getAllCategories,
};
