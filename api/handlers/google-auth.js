const { registerUserIfNotExists } = require("../queries/users");
const { generateSessionId } = require("../shared/functions/google-auth-helpers.function");
const { formatErrorResponse, getUnexpectedErrorStatus }  = require("../utils/formatErrorResponse");
const dotenv = require('dotenv');
dotenv.config();

const exchangeCodeForIdToken = async (req, res, next) => {
    try {
        const code = req.query.code;
        let response;
        let errorResponse;

        if(!code) {
          return next(formatErrorResponse(400, "Bad request: Code parameter missing in request.")); 
        };

        const tokenUrl = process.env.TOKEN_ENDPOINT;
        const requestBody = {
            code: code,
            client_id: process.env.CLIENT_ID ?? "",
            client_secret: process.env.CLIENT_SECRET ?? "",
            redirect_uri: process.env.REDIRECT_URI ?? "",
            grant_type: "authorization_code",
        }
        
        response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if(!response.ok) {
          errorResponse = await response.json();
          return next(formatErrorResponse(response.status,`${ errorResponse.error }: ${ errorResponse.error_description }`)); 
        }
        
        const responseData = await response.json();
        const tokenInfo = responseData.id_token ? await verifyIdToken(responseData.id_token) : null;

        await registerUserIfNotExists({
          googleId: tokenInfo.sub,
          name: tokenInfo.name,
          email: tokenInfo.email,
        });
 

        if(tokenInfo.error) {
          return next(formatErrorResponse(400, `${ errorResponse.error }: ${ errorResponse.error_description }`)); 
        }

        await registerUserIfNotExists({
          googleId: tokenInfo.sub,
          name: tokenInfo.name,
          email: tokenInfo.email,
        });

        res.status(200).json({
          idToken: responseData.id_token,
          googleId: tokenInfo.sub,
          userName: tokenInfo.name,
          email: tokenInfo.email
        });

      } catch (error) {
        return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
      }
}

const verifyIdToken = async (idToken) => {
  try {
    const tokenInfoUrl = process.env.TOKEN_INFO;
    const response = await fetch(`${tokenInfoUrl}?id_token=${idToken}`);

    if (!response.ok) {
      const errorResponse = await response.json(); 
      return errorResponse;
    }

    const responseData = await response.json();
    return responseData;

  } catch(error) {
    return {
      error: error.message,
      error_description: "An unexpected error occurred. Please try again later."
    }
  }
}

const getAuthUrl = () => {
    const state = generateSessionId();
    const scopes = ([
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
    ]).join(" ");
    const authUrl = `${process.env.AUTH_ENDPOINT}?client_id=${encodeURIComponent(process.env.CLIENT_ID)}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&state=${state}&prompt=consent`
    return {
      authUrl: authUrl,
      tokenInfo: process.env.TOKEN_INFO
    };
};

module.exports = {
    getAuthUrl,
    exchangeCodeForIdToken,
    verifyIdToken
}