import LobbyService from "../../services/lobbies.service.js";
import importStylesheet from "../utils/import-style-sheet.js";
import "./LobbyCard.component.js";
import SSEManager from "../../services/events.js";

export default class ViewLobbies extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.lobbyService = new LobbyService();
    this.lobbies = [];
    this.eventsManager = new SSEManager();
  }

  connectedCallback() {
    this.retrieveActivePublicLobbies();
    SSEManager.on("match_created", this.handleMatchCreated);
  }

    async handleMatchCreated(_data) {
      console.log("data changed");
    await this.retrieveActivePublicLobbies();
  }

  async retrieveActivePublicLobbies() {
    this.lobbies = await this.lobbyService.getActivePublicLobbies();
    this.render();
  }

  render() {
    importStylesheet(this.shadowRoot, "/static/css/index.css");

    const section = document.createElement("section");
    section.setAttribute("aria-label", "Active Lobbies");

    this.lobbies.forEach((lobby) => {
      const card = document.createElement("lobby-card");
      card.lobby = lobby;
      section.appendChild(card);
    });

    this.shadowRoot.appendChild(section);
  }
}

customElements.define("view-lobbies", ViewLobbies);
