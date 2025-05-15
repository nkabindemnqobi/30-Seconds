const { sql } = require('../db/pool');

const getUserIdFromGoogleId = async (googleId) => {
  const result = await sql.query`
    SELECT id FROM Users WHERE google_id = ${googleId}
  `;
  return result.recordset[0]?.id;
};

const registerUserIfNotExists = async ({ googleId, name, email }) => {
  const result = await sql.query`
    SELECT id FROM Users WHERE google_id = ${googleId}
  `;

  if (result.recordset.length > 0) {
    return result.recordset[0].id;
  }

  const insertResult = await sql.query`
    INSERT INTO Users (google_id, alias, email)
    OUTPUT INSERTED.id
    VALUES (${googleId}, ${name}, ${email})
  `;

  return insertResult.recordset[0].id;
};

module.exports = { getUserIdFromGoogleId, registerUserIfNotExists};
