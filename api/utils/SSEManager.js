const { getUserIdFromGoogleId } = require("../queries/users");

const activeConnections = new Map();
const matchMemberships = new Map();

const handleSSEConnection = async (req, res, userId) => {
  
  const userIdFetched = await getUserIdFromGoogleId(req.params.googleId);
  const userIdString = userIdFetched.toString();

  if (activeConnections.has(userIdString)) {
    
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

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.write('event: connected\ndata: {"status": "OK"}\n\n');

  activeConnections.set(userIdString, res);
  

  req.on("close", () => {
    
    if (activeConnections.get(userIdString) === res) {
      activeConnections.delete(userIdString);
      

      
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
      
    }
  });
};

const addUserToMatch = (joinCode, userId) => {
  const userIdString = userId.toString(); 
  if (!matchMemberships.has(joinCode)) {
    matchMemberships.set(joinCode, new Set());
  }
  matchMemberships.get(joinCode).add(userIdString);
  
};

const removeUserFromMatch = (joinCode, userId) => {
  const userIdString = userId.toString(); 
  if (matchMemberships.has(joinCode)) {
    const members = matchMemberships.get(joinCode);
    if (members.delete(userIdString)) {
      
      if (members.size === 0) {
        matchMemberships.delete(joinCode);
        
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
          
          res.write(message);
        } catch (error) {
          
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
      
      res.write(message);
    } catch (error) {
      
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
 
