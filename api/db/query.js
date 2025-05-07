const sql = require('mssql');
const dbConfig = require('./connection');

let poolPromise; 

const getPool = async () => {
    if (!poolPromise) {
        poolPromise = sql.connect(dbConfig); 
    }
    return poolPromise;
};

const executeQuery = async (sqlQuery) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(sqlQuery);
        return result.recordset;
    } catch (err) {
        err.isConnectionError =
            err.code === 'ECONNREFUSED' ||
            err.name === 'ConnectionError' ||
            err instanceof sql.ConnectionError;

        console.error('[DB ERROR]', {
            message: err.message,
            code: err.code,
            name: err.name,
        });

        throw err;
    }
};

module.exports = {
    executeQuery,
};
