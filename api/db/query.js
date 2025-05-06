const sql = require('mssql');
const dbConfig = require('./connection');

async function executeQuery(sqlQuery) {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(sqlQuery);
    return result.recordset;
}

module.exports = {
    executeQuery,
};
