import AbstractView from "./AbstractView.js";

export default class PlayerLobby extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("Lobby");
  }

  async getHtml() {
    return `
      <trivia-lobby></trivia-lobby>
      <app-lobby></app-lobby>
    `;
  }
}
