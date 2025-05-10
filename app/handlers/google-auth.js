import { User } from "../models/user.js";
import BaseService from "../services/shared.service.js";

const baseService = new BaseService();

export const getApplicationConfiguration = async (applicationConfiguration) => {
    try {
        const redirectUrl = await baseService.get(`${applicationConfiguration.apiBaseUrl}/auth/login`);
        applicationConfiguration["redirectUrl"] = redirectUrl.authUrl ? redirectUrl.authUrl : "";
        return applicationConfiguration;
    } catch(error) {
        return error;
    }   
}

export const exchangeCodeForToken = async (applicationConfiguration, code) => {
    try {
        const token = await baseService.get(`${applicationConfiguration.apiBaseUrl}/auth/get-token?code=${code}`);
        if(token.idToken && token.googleId) User.setUser(token); 
        return token;
    } catch(error) {
        return error;
    }
}