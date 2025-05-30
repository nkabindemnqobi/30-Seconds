const { verifyIdToken } = require("../handlers/google-auth");
const { formatErrorResponse, getUnexpectedErrorStatus } = require("../utils/formatErrorResponse");
const { getLoggedInUser } = require("../utils/getUser");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(formatErrorResponse(401, 'Unauthorized'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const tokenInfoJson = await verifyIdToken(token);

    if (tokenInfoJson.error) {
        if(tokenInfoJson.error.code) return next(formatErrorResponse(tokenInfoJson.error.code, `${tokenInfoJson.error.status}: ${tokenInfoJson.error.message}`));
        return next(formatErrorResponse(401, `${tokenInfoJson.error}: ${tokenInfoJson.error_description}`));
    } else {
        const user = getLoggedInUser(tokenInfoJson);
        req.user = user;
        next();
    }
    
  } catch (error) {
    return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
  }
};

module.exports = { authMiddleware };
