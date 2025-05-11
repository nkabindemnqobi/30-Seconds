const { getPool, sql } = require("./pool");

const withTransaction = async (callback) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    const request = new sql.Request(transaction);
    const result = await callback(request);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = { withTransaction };
