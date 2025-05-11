const { generateSessionId } = require("../shared/functions/google-auth-helpers.function");
const formatErrorResponse  = require("../utils/formatErrorResponse");
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

const exchangeCodeForIdToken = async (req, res) => {
    try {
        const code = req.query["code"];
        if(!code) return res.status(400).json({ error: "Code missing in request", reason: "Authentication" });

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
        
        if(response.ok) {
          const responseData = await response.json();
          const tokenInfo = responseData.id_token ? await verifyIdToken(responseData.id_token) : null
          res.status(200).json({
            idToken: responseData.id_token,
            googleId: tokenInfo.sub,
            userName: tokenInfo.name,
            email: tokenInfo.email
          });
        } else {
          res.status(response.status).json({ error: response, reason: "Authentication" });
        }
      } catch (err) {
        const { status, error, reason } = formatErrorResponse(err, "Authentication");
        res.status(status).json({ error, reason });
      }
}

const verifyIdToken = async (idToken) => {
  try {
      const tokenInfoUrl = process.env.TOKEN_INFO;
      
      const response = await fetch(`${tokenInfoUrl}?id_token=${idToken}`);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const responseData = await response.json();
      return responseData;
    } catch (error) {
      return error;
    }
}

module.exports = {
    getAuthUrl,
    exchangeCodeForIdToken
}