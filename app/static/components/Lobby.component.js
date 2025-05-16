import LobbyService from "../../services/lobbies.service.js";
import "./Button.js";
import eventbus from "../js/sseManager/eventbus.js";
import router from "../js/index.js";

export default class AppLobby extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.lobbyService = new LobbyService();
    this.joinCode = undefined;
  }

  connectedCallback() {
    this.render();
    eventbus.on("lobby-started", (event) => {
      this.joinCode = event.detail.joinCode;
    });
    const button = this.shadowRoot.querySelector("#start-game");
    button.addEventListener("click", this.startGame.bind(this));
  }

  async startGame() {
    await this.lobbyService.startGame(this.joinCode);
    sessionStorage.setItem("joinCode", this.joinCode);
    history.pushState({}, "", "/game-play");
    router();
  }

  render() {
    this.shadowRoot.innerHTML = `
    <app-button id="start-game">Start games</app-button>
    `;
  }
}

customElements.define("app-lobby", AppLobby);