import BaseService from "./shared.service.js";

export default class LobbyService {
  constructor() {
    this.baseService = new BaseService();
  }

  async createLobby(requestBody) {
    const response = await this.baseService.post("create-lobby", requestBody);
    return response;
  }

  async getActivePublicLobbies() {
    return await this.baseService.get("home/lobbies?status=Lobby&public=false");
  }

  async joinLobby(joinCode, id) {
    return await this.baseService.post(`lobby/${joinCode}`, {
      userJoiningId: id,
    });
  }

  async startGame(joinCode) {
    return await this.baseService.post(`lobby/${joinCode}/start`, {});
  }

  async startRound(joinCode) {
    return await this.baseService.post(`round/${joinCode}/start-round`);
  }

  async getHint(joinCode) {
    return await this.baseService.get(`round/${joinCode}/get-hint`);
  }
}
