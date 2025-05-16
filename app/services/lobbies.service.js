import BaseService from "./shared.service.js";

export default class LobbyService {
  constructor() {
    this.baseService = new BaseService();
  }

  async createLobby(requestBody) {
    return await this.baseService.post("create-lobby", requestBody); 
  }

  async getActivePublicLobbies() {
    return await this.baseService.get("home/lobbies?status=Lobby&public=false");
  }

   async joinLobby(joinCode,id) {
    return await this.baseService.post(`lobby/${joinCode}`,{userJoiningId:id});
  }
}
