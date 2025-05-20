const { executeQuery } = require("../db/query");

async function fetchLobbiesQuery({ status, isPublic, creatorAlias }) {
    let sqlQuery = `SELECT * FROM PublicLobbyView WHERE 1=1`;
    const params = {};

    if (status) {
        sqlQuery += ` AND matchStatusId = (SELECT id FROM MatchStatus WHERE status = @Status)`;
        params.Status = status;
    }

    if (typeof isPublic !== 'undefined') {
        sqlQuery += ` AND isPublic = @IsPublic`;
        params.IsPublic = isPublic ? 1 : 0;
    }

    if (creatorAlias) {
        sqlQuery += ` AND creatorAlias = @CreatorAlias`;
        params.CreatorAlias = creatorAlias;
    }

    return await executeQuery(sqlQuery, params);
}


module.exports = {
    fetchLobbiesQuery,
};
