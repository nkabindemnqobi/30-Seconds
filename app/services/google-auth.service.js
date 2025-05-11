import { User } from "../models/user.js";
import BaseService from "./shared.service.js";

export class GoogleAuth {
    constructor () { this.baseService = new BaseService(); }

    async getApplicationConfiguration (applicationConfiguration) {
        try {
            const redirectUrl = await this.baseService.get(`auth/login`);
            applicationConfiguration["redirectUrl"] = redirectUrl.authUrl ? redirectUrl.authUrl : "";
            return applicationConfiguration;
        } catch(error) {
            return error;
        }   
    }

    async exchangeCodeForToken (applicationConfiguration, code) {
        try {
            const token = await this.baseService.get(`auth/get-token?code=${code}`);
            if(token.idToken && token.googleId) User.setUser(token); 
            return token;
        } catch(error) {
            return error;
        }
    }
}