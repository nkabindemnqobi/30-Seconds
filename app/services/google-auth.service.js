import BaseService from "./shared.service.js";
import { User } from "../models/user.js";
import { ApplicationConfiguration } from "../models/app-config.js";

export class GoogleAuth {
    constructor () { this.baseService = new BaseService(); }

    async getApplicationConfiguration () {
        try {
            const authenticationUrls = await this.baseService.get(`auth/login`);
            if(authenticationUrls.authUrl && authenticationUrls.tokenInfo) {
                sessionStorage.setItem('authUrl', authenticationUrls.authUrl);
                sessionStorage.setItem('tokenInfo', authenticationUrls.tokenInfo);
                ApplicationConfiguration.setAppConfig(authenticationUrls);
                return authenticationUrls
            }
            return authenticationUrls;
        } catch(error) {
            return error;
        }   
    }

    async exchangeCodeForToken (code) {
        try {
            const token = await this.baseService.get(`auth/get-token?code=${code}`);
            if(token.idToken && token.googleId) {
                sessionStorage.setItem('idToken', JSON.stringify(token));
                User.setUser(token);
            }
            return token;
        } catch(error) {
            return error;
        }
    }

    retrieveToken() {
        try {
            const idToken = sessionStorage.getItem('idToken');
            return idToken;
        } catch(error) {
            return error;
        }
    }

    isAuthenticated(){
        try {
            const idToken = this.retrieveToken();
            return !!idToken;
        } catch (error) {
            console.error('Error checking authentication:', error);
            return false;
        }
    }
}