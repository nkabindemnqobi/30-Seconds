const sql = require('mssql');
const dbConfig = require('./connection');

let poolPromise; 

const getPool = async () => {
    if (!poolPromise) {
        poolPromise = sql.connect(dbConfig); 
    }
    return poolPromise;
};

const executeQuery = async (sqlQuery,params) => {
    try {
      const pool = await getPool();
      const request = pool.request();
  
      if (params && Object.keys(params).length > 0) {
        for (const [paramName, paramValue] of Object.entries(params)) {
          request.input(paramName, paramValue);
        }
      }
      const response = await request.query(sqlQuery);
      return response.recordset;
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
