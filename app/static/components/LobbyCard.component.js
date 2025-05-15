import LobbyService from "../../services/lobbies.service.js";
import importStylesheet from "../utils/import-style-sheet.js";
import "./Chip.component.js";
import router from "../js/index.js";

export default class LobbyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.lobby = undefined;
    this.lobbyService = new LobbyService();
  }

  connectedCallback() {
    this.render();
    this.addEventListener("click", async () => {
      await this.joinLobby(this.lobby.joinCode, 1);
      history.pushState({}, "", "/lobby");
      router();
    });
  }

  async joinLobby(joinCode, id) {
    return await this.lobbyService.joinLobby(joinCode, id);
  }

  render() {
    importStylesheet(this.shadowRoot, "/static/css/index.css");

    const {
      lobbyName,
      creatorAlias,
      participantCount,
      maxParticipants,
      categories,
    } = this.lobby;

    const article = document.createElement("article");
    article.className = "lobby-card";

    const header = document.createElement("header");
    header.className = "lobby-header";

    const title = document.createElement("h2");
    title.textContent = lobbyName;

    const statusEl = document.createElement("strong");
    statusEl.textContent = "Open";
    statusEl.className = "status";

    header.appendChild(title);
    header.appendChild(statusEl);

    const hostEl = document.createElement("p");
    hostEl.textContent = `Host: ${creatorAlias}`;

    const teamsCount = document.createElement("p");
    teamsCount.textContent = `${participantCount}/${maxParticipants} Teams`;

    const categoryContainer = document.createElement("div"); //
    categoryContainer.className = "categories";

    categories.forEach((cat) => {
      const chip = document.createElement("app-chip");
      chip.setAttribute("text", cat.name);
      categoryContainer.appendChild(chip);
    });

    article.appendChild(header);
    article.appendChild(hostEl);
    article.appendChild(teamsCount);
    article.appendChild(categoryContainer);
    this.shadowRoot.appendChild(article);
  }
}

customElements.define("lobby-card", LobbyCard);
