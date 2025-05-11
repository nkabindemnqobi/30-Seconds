import { applicationConfiguration } from "../models/app-config.js";
export default class BaseService {
  async get(url) {
    const response = await fetch(
      `${applicationConfiguration.apiBaseUrl}/api/${url}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.json();
  }

  async post(url, requestBody) {
    try {
      const body = JSON.stringify(requestBody);
      await fetch(`${applicationConfiguration.apiBaseUrl}/api/${url}`, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
          Authorization: ``,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
