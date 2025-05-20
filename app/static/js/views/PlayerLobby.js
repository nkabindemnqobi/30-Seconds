import AbstractView from "./AbstractView.js";

export default class PlayerLobby extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("Lobby");
  }

  async getHtml() {
    return `
    <section class="card">
      <header class="card-header">
        <h1 class="card-title">Lobby</h1>
        <p class="card-description">Waiting for players to join</p>
      </header>
      <main class="card-content" id="appContent">
        <trivia-lobby></trivia-lobby>
        <app-lobby></app-lobby>
      </main>
    </section>
    `;
  }
}
