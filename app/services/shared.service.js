import { ApplicationConfiguration } from "../models/app-config.js";
import { User } from "../models/user.js";
export default class BaseService {
  constructor() {
    User.setUser(JSON.parse(sessionStorage.getItem("idToken")) || {});
  }

  async get(url) {
    const response = await fetch(
      `${ApplicationConfiguration.apiBaseUrl}/api/${url}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${User.user.idToken}`,
        },
      }
    );
    return response.json();
  }

  async post(url, requestBody) {
    try {
      const body = JSON.stringify(requestBody);
      const response = await fetch(
        `${ApplicationConfiguration.apiBaseUrl}/api/${url}`,
        {
          method: "POST",
          body,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${User.user.idToken}`,
          },
        }
      );
      return response.json();
    } catch (error) {
      throw error;
    }
  }
}
