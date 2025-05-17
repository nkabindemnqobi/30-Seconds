function formatMatchWithParticipants(sqlQueryResult) {

  if (!Array.isArray(sqlQueryResult) || sqlQueryResult.length === 0 || !sqlQueryResult[0]) {
      console.log("Formatter returning null due to invalid input or no data.");
      return null;
  }

  const firstRow = sqlQueryResult[0];

  const formattedMatch = {
      match_id: firstRow.match_id,
      join_code: firstRow.join_code,
      lobby_name: firstRow.lobby_name,
      is_public: firstRow.is_public,
      max_participants: firstRow.max_participants,
      started_at: firstRow.started_at,
      completed_at: firstRow.completed_at,
      status_id: firstRow.status_id, 
      match_status: firstRow.match_status, 
      participants: []
  };

  sqlQueryResult.forEach((row) => {
      if (row.match_participant_id !== null && row.participant_user_id !== null) {
          const participant = {
              match_participant_id: row.match_participant_id,
              user_id: row.participant_user_id,
              alias: row.participant_alias,
              match_participants_status_id: row.match_participants_status_id, 
              participant_status: row.participant_status 
          };
          if (!formattedMatch.participants.find(p => p.match_participant_id === participant.match_participant_id)) {
               formattedMatch.participants.push(participant);
          }
      }
  });

  return formattedMatch;
}

module.exports = {
  formatMatchWithParticipants
};