import AbstractView from "./AbstractView.js";
import AppLobby from "../../components/Lobby.component.js";

export default class Lobby extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("Lobby");
  }

  async getHtml() {
    return `
      <app-lobby></app-lobby>
    `;
  }
}