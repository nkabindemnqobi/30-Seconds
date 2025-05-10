import { Token } from "../models/token.js";

export const getApplicationConfiguration = async (applicationConfiguration) => {
    try {
        const redirectUrlResponse = await fetch(`${applicationConfiguration.apiBaseUrl}/auth/login`);
        const redirectUrl = await redirectUrlResponse.json();
        applicationConfiguration["redirectUrl"] = redirectUrl.authUrl ? redirectUrl.authUrl : "";
        return applicationConfiguration;
    } catch(error) {
        return error;
    }   
}

export const exchangeCodeForToken = async (applicationConfiguration, code) => {
    try {
        const tokenResponse = await fetch(`${applicationConfiguration.apiBaseUrl}/auth/get-token?code=${code}`);
        const token = await tokenResponse.json();
        if(token.id_token) Token.setUserToken(token.id_token); 
        return token;
    } catch(error) {
        return error;
    }
}