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


module.exports = {
    getAuthUrl,
}