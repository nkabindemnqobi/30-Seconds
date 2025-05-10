const activeConnections = new Map();
const matchMemberships = new Map();

const handleSSEConnection = (req, res, userId) => {
  console.log(`${userId} user has connected to the server.`);

  const userIdString = toString(userId);

  if (activeConnections.has(userIdString)) {
    console.log(`Closing existing SSE connection for user: ${userIdString}`);
    const oldRes = activeConnections.get(userIdString);
    try {
      oldRes.end(); // kills old client connection
    } catch (error) {
      console.error(
        `Error closing old SSE connection for user ${userIdString}:`,
        error
      ); // If that fails, error out and hope it resolves
    }
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.write('event: connected\ndata: {"status": "OK"}\n\n');

  activeConnections.set(userId, res);
  matchMemberships.set("FAF69FEC95", new Set().add("1"));
  console.log(`SSE connection established for user: ${userIdString}`);

  req.on("close", () => {
    console.log(
      `SSE connection close event received for user: ${userIdString}`
    );
    if (activeConnections.get(userIdString) === res) {
      activeConnections.delete(userIdString);
      console.log(`Active connection removed for user: ${userIdString}`);

      // Do we kick someone from the match if they disconnect? Maybe we set up a timeout instead somehow?
      matchMemberships.forEach((members, joinCode) => {
        if (members.has(userIdString)) {
          members.delete(userIdString);
          if (members.size === 0) {
            matchMemberships.delete(joinCode);
          }
          // Broadcast that a user has disconnected. Optional?
          broadcastToMatch(joinCode, {
            event: "user_disconnected",
            userId: userIdString,
          });
        }
      });
    } else {
      console.log(
        `Ignoring close event for old/stale connection for user: ${userIdString}`
      );
    }
  });
};

const addUserToMatch = (joinCode, userId) => {
  const userIdString = userId.toString(); // Ensure consistency
  if (!matchMemberships.has(joinCode)) {
    matchMemberships.set(joinCode, new Set());
  }
  matchMemberships.get(joinCode).add(userIdString);
  console.log(`User ${userIdString} added to match ${joinCode} membership.`);
};

const removeUserFromMatch = (joinCode, userId) => {
  const userIdString = userId.toString(); // Ensure consistency
  if (matchMemberships.has(joinCode)) {
    const members = matchMemberships.get(joinCode);
    if (members.delete(userIdString)) {
      console.log(
        `User ${userIdString} removed from match ${joinCode} membership.`
      );
      if (members.size === 0) {
        matchMemberships.delete(joinCode);
        console.log(`Match ${joinCode} membership is now empty.`);
      }
    }
  }
};

const broadcastToMatch = (joinCode, data, eventType = "message") => {
  console.log(`Broadcasting '${eventType}' to match ${joinCode}`);
  if (matchMemberships.has(joinCode)) {
    const userIdsInMatch = matchMemberships.get(joinCode);
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;

    userIdsInMatch.forEach((userIdString) => {
      const res = activeConnections.get(userIdString);
      if (res) {
        try {
          console.log(`Sending message to user ${userIdString}`);
          res.write(message);
        } catch (error) {
          console.error(`Error sending SSE to user ${userIdString}:`, error);
        }
      } else {
        console.warn(
          `User ${userIdString} in match ${joinCode} but connection not found in activeConnections.`
        );
        // This might happen if the connection closed but the user wasn't removed from lobbyMembership yet.
      }
    });
  } else {
    console.warn(
      `Attempted to broadcast to non-existent or empty match: ${joinCode}`
    );
  }
};

// If we have to send to a specific user on their SSE.
const sendToUser = (userId, data, eventType = "message") => {
  const userIdString = userId.toString();
  const res = activeConnections.get(userIdString);
  if (res) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    try {
      console.log(`Sending '${eventType}' message to user ${userIdString}`);
      res.write(message);
    } catch (error) {
      console.error(`Error sending SSE to user ${userIdString}:`, error);
    }
  } else {
    console.warn(`Attempted to send message to inactive user: ${userIdString}`);
  }
};

module.exports = {
  handleSSEConnection,
  broadcastToMatch,
  sendToUser,
  addUserToMatch,
  removeUserFromMatch,
  matchMemberships, // Should we centralise this elsewhere?
};
