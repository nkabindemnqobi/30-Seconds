import BaseService from "./shared.service.js";

export default class LobbyService {
  constructor() {
    this.baseService = new BaseService();
    console.log(this.baseService);
  }

  async createLobby(requestBody) {
    await this.baseService.post("create-lobby", requestBody);
  }
}
