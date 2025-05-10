import BaseService from "./shared.service.js";

export default class LobbyService {
  constructor() {
    this.baseService = new BaseService();
    console.log(this.baseService);
  }

  async createLobby() {
    const body = {
      isPublic: true,
      matchCreatorId: 2,
      statusId: 3,
      maxParticipants: 6,
      teams: [
        { teamName: "Different team", captainId: null },
        { teamName: "Another team", captainId: 2 },
      ],
    };
    console.log(body);
   await this.baseService.post("http://localhost:3002/lobbies", body);
  }
}
