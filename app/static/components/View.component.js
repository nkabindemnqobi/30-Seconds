import LobbyService from "../../services/lobbies.service.js";
import importStylesheet from "../utils/import-style-sheet.js";
import "./LobbyCard.component.js";

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
    this.lobbies = await this.lobbyService.getActivePublicLobbies();
    this.render();
  }

  _clearShadowRoot() {
    while (this.shadowRoot.firstChild) {
        this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }
  }

  _displayMessage(messageText, isError = false) {
    this._clearShadowRoot(); // Clear previous content
    const messageElement = document.createElement('p');
    messageElement.textContent = messageText;
    if (isError) {
        messageElement.classList.add('error-message'); // Add a class for styling errors
    }
    this.shadowRoot.appendChild(messageElement);
  }

  async retrieveActivePublicLobbies() {
    this._displayMessage('Loading lobbies...'); // Show loading state
    try {
        this.lobbies = await this.lobbyService.getActivePublicLobbies();
        this.render(); // Call render to display the fetched lobbies
    } catch (error) {
        console.error('ViewLobbies: Failed to fetch lobbies:', error);
        this._displayMessage(`Error loading lobbies: ${error.message}. Please try again.`, true);
    }
  }

  render() {
    importStylesheet(this.shadowRoot, "/static/css/index.css");
    this._clearShadowRoot();

    if (!this.lobbies || this.lobbies.length === 0) {
      this._displayMessage('No active public lobbies found. Why not create one?');
      return;
    }
    
    const section = document.createElement("section");
    section.setAttribute("aria-label", "Active Lobbies");

    this.lobbies.forEach((lobby) => {
      const card = document.createElement("lobby-card");
      card.lobby = lobby;
      section.appendChild(card);
    });

    this.shadowRoot.appendChild(section);
  }

  refreshLobbies() {
    console.log('ViewLobbies: refreshLobbies method called. Re-fetching lobbies.');
    this.retrieveActivePublicLobbies(); // This will fetch and then call render
  }
}

customElements.define("view-lobbies", ViewLobbies);
