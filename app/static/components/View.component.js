import LobbyService from "../../services/lobbies.service.js";
import importStylesheet from "../utils/import-style-sheet.js";
import "./LobbyCard.component.js";
import "./Error.component.js";
import eventbus from "../js/sseManager/eventbus.js";

export default class ViewLobbies extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.lobbyService = new LobbyService();
    this.lobbies = [];
    this.boundRetrieve = this.retrieveActivePublicLobbies.bind(this); 
  }

  connectedCallback() {
    this.retrieveActivePublicLobbies();
    eventbus.on("match_created", this.boundRetrieve);
  }

  disconnectedCallback() {
    eventbus.off("match_created", this.boundRetrieve);
  }

  async retrieveActivePublicLobbies() {
    try {
      this.lobbies = await this.lobbyService.getActivePublicLobbies();

      if (this.lobbies.length === 0) {
        this.renderError("No active lobbies available.");
        return;
      }

      this.render();
    } catch (error) {
      console.error("Failed to load lobbies:", error);
      this.renderError("Failed to load lobbies. Please try again.");
    }
  }

  renderError(message) {
    this.clear();

    importStylesheet(this.shadowRoot, "/static/css/index.css");

    const errorMessage = document.createElement("error-message");
    errorMessage.setAttribute("message", message);
    errorMessage.setAttribute("retry", "");

    errorMessage.addEventListener("retry", () =>
      this.retrieveActivePublicLobbies()
    );

    this.shadowRoot.appendChild(errorMessage);
  }

  render() {
    this.clear();

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

  clear() {
    while (this.shadowRoot.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }
  }
}

customElements.define("view-lobbies", ViewLobbies);
