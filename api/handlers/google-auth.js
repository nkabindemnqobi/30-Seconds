const { generateSessionId } = require("../shared/functions/google-auth-helpers.function")
const dotenv = require('dotenv');
dotenv.config();

const getAuthUrl = () => {
    const state = generateSessionId();
    const scopes = ([
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
    ]).join(" ");
    const authUrl = `${process.env.AUTH_ENDPOINT}?client_id=${encodeURIComponent(process.env.CLIENT_ID)}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&state=${state}&prompt=consent`
    return authUrl;
};

const exchangeCodeForIdToken = async (code, state) => {
    try {
        const tokenUrl = process.env.TOKEN_ENDPOINT;
        const requestBody = {
            code: code,
            client_id: process.env.CLIENT_ID ?? "",
            client_secret: process.env.CLIENT_SECRET ?? "",
            redirect_uri: process.env.REDIRECT_URI ?? "",
            grant_type: "authorization_code",
        }
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const responseData = await response.json();
        return {
            response: responseData,
            sessionId: state
        };
      } catch (error) {
        console.error("There was an error during the POST request:", error);
        throw error;
      }
}


module.exports = {
    getAuthUrl,
    exchangeCodeForIdToken
}