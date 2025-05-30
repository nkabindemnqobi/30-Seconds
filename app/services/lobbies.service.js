import BaseService from "./shared.service.js";
import { LobbyData } from "../models/LobbyData.js";

export default class LobbyService {
  constructor() {
    this.baseService = new BaseService();
  }

  async createLobby(requestBody) {
    const response = await this.baseService.post("create-lobby", requestBody);
    return response;
  }

  async getActivePublicLobbies() {
    return await this.baseService.get("home/lobbies?status=Lobby&public=true");
  }

  async joinLobby(joinCode, id) {
    
    return await this.baseService.post(`lobby/${joinCode}`, {
      userJoiningId: id,
    });
  }

  async startGame(joinCode) {
    
    return await this.baseService.post(`lobby/${LobbyData.data.join_code}/start`, {});
  }

  async startRound(joinCode) {
    
    return await this.baseService.post(`round/${LobbyData.data.join_code}/start-round`);
  }

  async getHint(joinCode) {
    
    return await this.baseService.get(`round/${LobbyData.data.join_code}/get-hint`);
  }
  async submitGuess(joinCode,guess){
    
    return await this.baseService.post(`round/${LobbyData.data.join_code}/guess`,{guess})
  }
}
