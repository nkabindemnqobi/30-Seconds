const sql = require("mssql");
const dbConfig = require("./connection");

let poolPromise;

const getPool = async () => {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig);
  }
  return poolPromise;
};

module.exports = {
  getPool,
  sql,
};
