import LobbyService from "../../services/lobbies.service.js";
import importStylesheet from "../utils/import-style-sheet.js";
import "./LobbyCard.component.js";
import "./Error.component.js";

export default class ViewLobbies extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.lobbyService = new LobbyService();
    this.lobbies = [];
  }

  connectedCallback() {
    this.retrieveActivePublicLobbies();
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
    while (this.shadowRoot.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }

    importStylesheet(this.shadowRoot, "/static/css/index.css");
    

    const errorMessage = document.createElement("error-message");
    errorMessage.setAttribute("message", message);
    errorMessage.setAttribute("retry", "");
    
    errorMessage.addEventListener("retry", () => this.retrieveActivePublicLobbies());
    
    this.shadowRoot.appendChild(errorMessage);
  }

  render() {
    while (this.shadowRoot.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }

    importStylesheet(this.shadowRoot, "/static/css/index.css");

    const section = document.createElement("section");
    section.setAttribute("aria-label", "Active Lobbies");

    if (this.lobbies.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "No active lobbies found.";
      emptyMessage.style.textAlign = "center";
      emptyMessage.style.padding = "2rem";
      section.appendChild(emptyMessage);
    } else {
      this.lobbies.forEach((lobby) => {
        const card = document.createElement("lobby-card");
        card.lobby = lobby;
        section.appendChild(card);
      });
    }

    this.shadowRoot.appendChild(section);
  }
}

customElements.define("view-lobbies", ViewLobbies);