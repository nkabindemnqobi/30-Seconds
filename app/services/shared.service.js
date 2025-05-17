import { ApplicationConfiguration } from "../models/app-config.js";
import { User } from "../models/user.js";
export default class BaseService {
  async get(url) {
    const response = await fetch(
      `${ApplicationConfiguration.apiBaseUrl}/api/${url}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ User.user.idToken }`
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
          "Authorization": `Bearer ${ User.user.idToken }`,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
