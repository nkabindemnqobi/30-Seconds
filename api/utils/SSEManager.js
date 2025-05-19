const { getUserIdFromGoogleId } = require("../queries/users");
 
const activeConnections = new Map();

const matchMemberships = new Map(); // Assuming this is defined elsewhere or should be here
 
// Define a reasonable interval for heartbeats (e.g., 20 seconds)

const HEARTBEAT_INTERVAL = 20000; // in milliseconds
 
const handleSSEConnection = async (req, res) => { // Removed 'userId' from params as it's fetched inside

  try {

    const userIdFetched = await getUserIdFromGoogleId(req.params.googleId);

    if (!userIdFetched) {

      console.error(`SSE Connection: User not found for googleId ${req.params.googleId}`);

      res.status(404).send("User not found"); // Or appropriate error handling

      return;

    }

    const userIdString = userIdFetched.toString();
 
    // Close any existing connection for this user

    if (activeConnections.has(userIdString)) {

      const oldRes = activeConnections.get(userIdString);

      console.log(`SSE Connection: Closing old connection for user ${userIdString}`);

      try {

        oldRes.end();

      } catch (error) {

        console.error(

          `SSE Connection: Error closing old SSE connection for user ${userIdString}:`,

          error

        );

      }

      // It might be good to also clear any heartbeat interval associated with oldRes if you store them

    }
 
    // Set SSE headers

    res.setHeader("Access-Control-Allow-Credentials", "true");

    // Note: Access-Control-Allow-Headers is typically for preflight (OPTIONS) responses.

    // For the actual GET request for SSE, it's less critical but doesn't hurt.

    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
 
    res.writeHead(200, {

      "Content-Type": "text/event-stream",

      "Cache-Control": "no-cache",

      Connection: "keep-alive",

      "X-Accel-Buffering": "no", // Useful if behind Nginx to disable its buffering for this response

    });
 
    // Send initial connection confirmation event

    res.write('event: connected\ndata: {"status": "OK"}\n\n');

    console.log(`SSE Connection: Established for user ${userIdString}`);
 
    // Store the new connection

    activeConnections.set(userIdString, res);
 
    // --- Heartbeat Mechanism ---

    const heartbeatIntervalId = setInterval(() => {

      // Check if the connection is still active before writing

      if (activeConnections.get(userIdString) === res && !res.writableEnded) {

        res.write(': heartbeat\n\n'); // SSE comment

        // console.log(`SSE Heartbeat: Sent to user ${userIdString}`); // Optional: for debugging

      } else {

        // If connection is no longer the active one or is closed, clear interval

        // This case should ideally be covered by req.on('close')

        clearInterval(heartbeatIntervalId);

      }

    }, HEARTBEAT_INTERVAL);

    // --- End Heartbeat Mechanism ---
 
    // Handle client closing the connection

    req.on("close", () => {

      console.log(`SSE Connection: Client closed for user ${userIdString}`);

      clearInterval(heartbeatIntervalId); // Crucial: stop sending heartbeats
 
      if (activeConnections.get(userIdString) === res) {

        activeConnections.delete(userIdString);

        console.log(`SSE Connection: Cleaned up active connection for user ${userIdString}`);
 
        // Clean up match memberships

        matchMemberships.forEach((members, joinCode) => {

          if (members.has(userIdString)) {

            members.delete(userIdString);

            console.log(`SSE Connection: User ${userIdString} removed from match ${joinCode}`);

            if (members.size === 0) {

              matchMemberships.delete(joinCode);

              console.log(`SSE Connection: Match ${joinCode} is now empty and removed`);

            }

            // Consider if you still need to broadcast user_disconnected here,

            // as the connection that would receive it is now closed.

            // This broadcast is for OTHER users in the match.

            broadcastToMatch(joinCode, {

              event: "user_disconnected", // This seems like an event type, not a top-level key

              userId: userIdString,

            }, "user_activity"); // Assuming "user_activity" is the event type for this kind of message

          }

        });

      } else {

        console.log(`SSE Connection: 'close' event for user ${userIdString}, but 'res' object did not match. No cleanup needed from activeConnections for this specific 'res'.`);

      }

      if (!res.writableEnded) {

        res.end(); // Ensure the response stream is properly closed on the server side

      }

    });
 
    // Handle errors on the response stream (e.g., if the client connection is forcibly closed)

    res.on('error', (err) => {

        console.error(`SSE Connection: Error on response stream for user ${userIdString}:`, err);

        clearInterval(heartbeatIntervalId);

        if (activeConnections.get(userIdString) === res) {

            activeConnections.delete(userIdString);

        }

        // Further cleanup of matchMemberships could also be done here if necessary

    });
 
  } catch (error) {

    console.error("SSE Connection: Fatal error in handleSSEConnection:", error);

    if (res && !res.headersSent) {

      res.status(500).send("Internal Server Error");

    } else if (res && !res.writableEnded) {

      res.end(); // Try to close if possible

    }

  }

};
 
 
// ... rest of your SSE manager code (addUserToMatch, removeUserFromMatch, broadcastToMatch, sendToUser)
 
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

      console.log(`User ${userIdString} removed from match ${joinCode} via removeUserFromMatch`);

      if (members.size === 0) {

        matchMemberships.delete(joinCode);

        console.log(`Match ${joinCode} deleted via removeUserFromMatch as it became empty.`);

      }

    }

  }

};
 
const broadcastToMatch = (joinCode, data, eventType = "message", excludeUserId = null) => {

  if (matchMemberships.has(joinCode)) {

    const userIdsInMatch = matchMemberships.get(joinCode);

    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;

    // console.log(`Broadcasting to match ${joinCode}: ${message.trim()}`); // Debugging
 
    userIdsInMatch.forEach((userIdString) => {

      if (excludeUserId && userIdString === excludeUserId.toString()) {

        return;

      }

      const res = activeConnections.get(userIdString);

      if (res && !res.writableEnded) { // Check if writable

        try {

          res.write(message);

        } catch (error) {

          console.error(

            `SSE Broadcast: Error writing to user ${userIdString} in match ${joinCode}:`,

            error

          );

          // Potentially remove this connection if it's broken

          // However, the 'close' or 'error' event on 'res' should handle cleanup.

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

  } else {

    // console.warn( // This can be noisy if matches are frequently created/destroyed

    //   `SSE Broadcast: Attempted to broadcast to non-existent or empty match: ${joinCode}`

    // );

  }

};
 
const sendToUser = (userId, data, eventType = "message") => {

  const userIdString = userId.toString();

  const res = activeConnections.get(userIdString);

  if (res && !res.writableEnded) { // Check if writable

    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;

    try {

      res.write(message);

    } catch (error) {

      console.error(`SSE SendToUser: Error writing to user ${userIdString}:`, error);

    }

  } else if (!res) {

    console.warn(`SSE SendToUser: Attempted to send message to inactive user: ${userIdString}`);

  } else if (res.writableEnded) {

     console.warn(`SSE SendToUser: Attempted to send message to user ${userIdString} but stream ended.`);

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
 