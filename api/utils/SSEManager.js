const { getUserIdFromGoogleId } = require("../queries/users");

const activeConnections = new Map();

const matchMemberships = new Map(); 



const HEARTBEAT_INTERVAL = 20000; 

const handleSSEConnection = async (req, res) => {
  

  try {
    const userIdFetched = await getUserIdFromGoogleId(req.params.googleId);

    if (!userIdFetched) {
      console.error(
        `SSE Connection: User not found for googleId ${req.params.googleId}`
      );

      res.status(404).send("User not found"); 

      return;
    }

    const userIdString = userIdFetched.toString();

    

    if (activeConnections.has(userIdString)) {
      const oldRes = activeConnections.get(userIdString);

      console.log(
        `SSE Connection: Closing old connection for user ${userIdString}`
      );

      try {
        oldRes.end();
      } catch (error) {
        console.error(
          `SSE Connection: Error closing old SSE connection for user ${userIdString}:`,

          error
        );
      }

      
    }

    

    res.setHeader("Access-Control-Allow-Credentials", "true");

    

    

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    res.writeHead(200, {
      "Content-Type": "text/event-stream",

      "Cache-Control": "no-cache",

      Connection: "keep-alive",

      "X-Accel-Buffering": "no", 
    });

    

    res.write('event: connected\ndata: {"status": "OK"}\n\n');

    console.log(`SSE Connection: Established for user ${userIdString}`);
    activeConnections.set(userIdString, res);
    const heartbeatIntervalId = setInterval(() => {
      if (activeConnections.get(userIdString) === res && !res.writableEnded) {
        res.write(": heartbeat\n\n"); 
      } else {
        clearInterval(heartbeatIntervalId);
      }
    }, HEARTBEAT_INTERVAL);
    req.on("close", () => {
      console.log(`SSE Connection: Client closed for user ${userIdString}`);
      clearInterval(heartbeatIntervalId); 
      if (activeConnections.get(userIdString) === res) {
        activeConnections.delete(userIdString);

        console.log(
          `SSE Connection: Cleaned up active connection for user ${userIdString}`
        );
        matchMemberships.forEach((members, joinCode) => {
          if (members.has(userIdString)) {
            members.delete(userIdString);
            console.log(
              `SSE Connection: User ${userIdString} removed from match ${joinCode}`
            );
            if (members.size === 0) {
              matchMemberships.delete(joinCode);
              console.log(
                `SSE Connection: Match ${joinCode} is now empty and removed`
              );
            }
            broadcastToMatch(
              joinCode,
              {
                event: "user_disconnected", 

                userId: userIdString,
              },
              "user_activity"
            ); 
          }
        });
      } else {
        console.log(
          `SSE Connection: 'close' event for user ${userIdString}, but 'res' object did not match. No cleanup needed from activeConnections for this specific 'res'.`
        );
      }
      if (!res.writableEnded) {
        res.end(); 
      }
    });

    res.on("error", (err) => {
      console.error(
        `SSE Connection: Error on response stream for user ${userIdString}:`,
        err
      );

      clearInterval(heartbeatIntervalId);

      if (activeConnections.get(userIdString) === res) {
        activeConnections.delete(userIdString);
      }

    });
  } catch (error) {
    console.error("SSE Connection: Fatal error in handleSSEConnection:", error);

    if (res && !res.headersSent) {
      res.status(500).send("Internal Server Error");
    } else if (res && !res.writableEnded) {
      res.end(); 
    }
  }
};



const addUserToMatch = (joinCode, userId) => {
  const userIdString = userId.toString();

  if (!matchMemberships.has(joinCode)) {
    matchMemberships.set(joinCode, new Set());
  }
  matchMemberships.get(joinCode).add(userIdString);
  console.log(`User ${userIdString} added to match ${joinCode}`);
};

const removeUserFromMatch = (joinCode, userId) => {
  const userIdString = userId.toString();

  if (matchMemberships.has(joinCode)) {
    const members = matchMemberships.get(joinCode);

    if (members.delete(userIdString)) {
      console.log(
        `User ${userIdString} removed from match ${joinCode} via removeUserFromMatch`
      );

      if (members.size === 0) {
        matchMemberships.delete(joinCode);

        console.log(
          `Match ${joinCode} deleted via removeUserFromMatch as it became empty.`
        );
      }
    }
  }
};

const broadcastToMatch = (
  joinCode,
  data,
  eventType = "message",
  excludeUserId = null
) => {
  if (matchMemberships.has(joinCode)) {
    const userIdsInMatch = matchMemberships.get(joinCode);

    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    userIdsInMatch.forEach((userIdString) => {
      if (excludeUserId && userIdString === excludeUserId.toString()) {
        return;
      }
      const res = activeConnections.get(userIdString);
      if (res && !res.writableEnded) {
        try {
          res.write(message);
        } catch (error) {
          console.error(
            `SSE Broadcast: Error writing to user ${userIdString} in match ${joinCode}:`,

            error
          );
        }
      } else if (!res) {
        console.warn(
          `SSE Broadcast: User ${userIdString} in match ${joinCode} but connection not found in activeConnections.`
        );
      } else if (res.writableEnded) {
        console.warn(
          `SSE Broadcast: User ${userIdString} in match ${joinCode} but connection stream already ended.`
        );
      }
    });
  } 
};

const sendToUser = (userId, data, eventType = "message") => {
  const userIdString = userId.toString();
  const res = activeConnections.get(userIdString);
  if (res && !res.writableEnded) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    try {
      res.write(message);
    } catch (error) {
      console.error(
        `SSE SendToUser: Error writing to user ${userIdString}:`,
        error
      );
    }
  } else if (!res) {
    console.warn(
      `SSE SendToUser: Attempted to send message to inactive user: ${userIdString}`
    );
  } else if (res.writableEnded) {
    console.warn(
      `SSE SendToUser: Attempted to send message to user ${userIdString} but stream ended.`
    );
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
