import AbstractView from "./AbstractView.js";
import LobbyService from "../../../services/lobbies.service.js";
import "../../components/SelectCategories.component.js";
import "../../components/Switch.component.js";
import "../../components/LobbyForm.js";

export default class CreateLobby extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("Create a Lobby");
  }

  async getHtml() {
    return `<lobby-form></lobby-form>`;
  }
}
