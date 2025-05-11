import { User } from "../models/user.js";
import BaseService from "./shared.service.js";
import { ApplicationConfiguration } from "../models/app-config.js";

export class GoogleAuth {
    constructor () { this.baseService = new BaseService(); }

    async getApplicationConfiguration () {
        try {
            const redirectUrl = await this.baseService.get(`${ApplicationConfiguration.apiBaseUrl}/auth/login`);
            redirectUrl.authUrl ? ApplicationConfiguration.setRedirectUrl(redirectUrl.authUrl) : ApplicationConfiguration.setRedirectUrl(null);
        } catch(error) {
            return error;
        }   
    }

    async exchangeCodeForToken (code) {
        try {
            const token = await this.baseService.get(`${ApplicationConfiguration.apiBaseUrl}/auth/get-token?code=${code}`);
            if(token.idToken && token.googleId) User.setUser(token); 
            return token;
        } catch(error) {
            return error;
        }
    }
}