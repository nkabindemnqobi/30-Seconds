const { getUserIdFromGoogleId } = require("../queries/users");

const activeConnections = new Map();
const matchMemberships = new Map();

const handleSSEConnection = async (req, res, userId) => {
  console.log(userId, `user has connected to the server.`);
  
  const userIdString = req.params.googleId.toString();


  if (activeConnections.has(userIdString)) {
    console.log(`Closing existing SSE connection for user:`, userIdString);
    const oldRes = activeConnections.get(userIdString);
    try {
      oldRes.end(); 
    } catch (error) {
      console.error(
        `Error closing old SSE connection for user ${userIdString}:`,
        error
      ); 
    }
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.write('event: connected\ndata: {"status": "OK"}\n\n');

  activeConnections.set(userIdString, res);
  console.log(`SSE connection established for user:`, userIdString);

  req.on("close", () => {
    console.log(
      `SSE connection close event received for user:`, userIdString
    );
    if (activeConnections.get(userIdString) === res) {
      activeConnections.delete(userIdString);
      console.log(`Active connection removed for user:`, userIdString);

      
      matchMemberships.forEach((members, joinCode) => {
        if (members.has(userIdString)) {
          members.delete(userIdString);
          if (members.size === 0) {
            matchMemberships.delete(joinCode);
          }
          
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
  const userIdString = userId.toString(); 
  if (!matchMemberships.has(joinCode)) {
    matchMemberships.set(joinCode, new Set());
  }
  matchMemberships.get(joinCode).add(userIdString);
  console.log(`User ${userIdString} added to match ${joinCode} membership.`);
};

const removeUserFromMatch = (joinCode, userId) => {
  const userIdString = userId.toString(); 
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

const broadcastToMatch = (joinCode, data, eventType = "message", excludeUserId = null) => {
  if (matchMemberships.has(joinCode)) {
    const userIdsInMatch = matchMemberships.get(joinCode);
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;

    userIdsInMatch.forEach((userIdString) => {
      if (excludeUserId && userIdString === excludeUserId.toString()) {
        return;
      }
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
        
      }
    });
  } else {
    console.warn(
      `Attempted to broadcast to non-existent or empty match: ${joinCode}`
    );
  }
};


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
  matchMemberships, 
};
 