import { ApplicationConfiguration } from "../models/app-config.js";
import { User } from "../models/user.js";
import { GoogleAuth } from "./google-auth.service.js";
export default class BaseService {

  constructor() {
    this.googleAuth = new GoogleAuth();
    this.idToken = this.googleAuth.retrieveToken();
  }

  getCredentials() { this.googleAuth.retrieveToken(); }

  async get(url) {
    const idToken = this.getCredentials().idToken;
    const response = await fetch(
      `${ApplicationConfiguration.apiBaseUrl}/api/${url}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ this.idToken }`
        },
      }
    );
    return response.json();
  }

  async post(url, requestBody) {
    try {
      const body = JSON.stringify(requestBody);
      await fetch(`${ApplicationConfiguration.apiBaseUrl}/api/${url}`, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ this.idToken }`,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
