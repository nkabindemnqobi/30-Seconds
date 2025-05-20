const { executeQuery } = require('../db/query');

const getUserIdFromGoogleId = async (googleId) => {
  const query = `SELECT id FROM Users WHERE google_id = @googleId`;
  const param = {googleId};
  const result = await executeQuery(query, param)
  return result[0].id;
};

const registerUserIfNotExists = async ({ googleId, name, email }) => {
  const query = `SELECT id FROM Users WHERE google_id = @googleId`;
  const queryInsertUser = `
    INSERT INTO Users (google_id, alias, email)
    OUTPUT INSERTED.id
    VALUES (@googleId, @name, @email)`
  const param = {googleId};
  const result = await executeQuery(query, param);
  
  if (result.length > 0) {
    return result[0].id;
  }
  const paramsInsertUser = {googleId, name: name.slice(0, 50), email}
  const insertResult = await executeQuery(queryInsertUser, paramsInsertUser);

  return insertResult[0].id;
};

module.exports = { getUserIdFromGoogleId, registerUserIfNotExists};
