function formatMatchWithParticipants(sqlQueryResult) {
  if (!sqlQueryResult || sqlQueryResult.length === 0) {
    return null; // Match not found or no data
  }

  // All rows share the same core match and team details.
  // We extract these from the first row.
  const firstRow = sqlQueryResult[0];

  const formattedMatch = {
    match_id: firstRow.match_id,
    join_code: firstRow.join_code,
    is_public: firstRow.is_public,
    match_creator: {
      id: firstRow.match_creator_id,
      alias: firstRow.match_creator_alias,
      email: firstRow.match_creator_email,
    },
    status_id: firstRow.status_id,
    match_status: firstRow.match_status,
    max_participants: firstRow.max_participants,
    started_datetime: firstRow.started_datetime,
    completed_datetime: firstRow.completed_datetime,
    team_a: {
      id: firstRow.team_a_id,
      is_open: firstRow.team_a_is_open,
      captain: {
        id: firstRow.team_a_captain_id,
        alias: firstRow.team_a_captain_alias,
        email: firstRow.team_a_captain_email,
      },
      participants: [],
    },
    team_b: {
      id: firstRow.team_b_id,
      is_open: firstRow.team_b_is_open,
      captain: {
        id: firstRow.team_b_captain_id,
        alias: firstRow.team_b_captain_alias,
        email: firstRow.team_b_captain_email,
      },
      participants: [],
    },
  };

  const processedParticipants = new Set(); // Helps avoid adding duplicate participant entries

  sqlQueryResult.forEach((row) => {
    // Check if the current row contains participant information
    // (it might not if a team has no participants, due to LEFT JOIN)
    if (row.participant_user_id !== null) {
      const participant = {
        user_id: row.participant_user_id,
        alias: row.participant_alias,
        email: row.participant_email,
        is_barred: row.participant_is_barred, // Barred status from their team membership
      };

      // Create a unique key for this participant in this team to prevent duplicates
      // if the SQL somehow returned the same participant multiple times for the same team.
      const participantKey = `${participant.user_id}_${row.participant_team_id}`;

      if (!processedParticipants.has(participantKey)) {
        if (row.participant_team_id === formattedMatch.team_a.id) {
          formattedMatch.team_a.participants.push(participant);
        } else if (row.participant_team_id === formattedMatch.team_b.id) {
          formattedMatch.team_b.participants.push(participant);
        }
        processedParticipants.add(participantKey);
      }
    }
  });

  return formattedMatch;
}

module.exports = {
  formatMatchWithParticipants,
};
