export default class BaseService {
  async get(url) {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  }

  async post(url, requestBody) {
    try {
      url = url.includes("#")
        ? url.replace(/#/g, encodeURIComponent("#"))
        : url;
      let body = JSON.stringify(requestBody);

      await fetch(url, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json", "Authorization": ``
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
