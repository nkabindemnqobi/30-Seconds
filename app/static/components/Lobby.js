import "./Lobby.component.js";
import "./Button.js";
import eventbus from "../js/sseManager/eventbus.js";
import { LobbyData } from "../../models/LobbyData.js";
 
export default class TriviaLobby extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.lobbyData = {
      data: LobbyData.data,
    };
  }
 
  connectedCallback() {
    this.render();
    this.setupEventListeners();
    eventbus.on("player_join", (event) => {
      console.log(event);
      this.lobbyData = {data: event.detail.lobbyData.data};
      this.render();
    });
  }
 
  disconnectedCallback() {
    // Remove the event listener when component is disconnected
    this.removeEventListeners();
  }
 
  copyLobbyCode() {
    const lobbyCode = this.lobbyData.data.join_code;
    navigator.clipboard
      .writeText(lobbyCode)
      .then(() => {
        const copyBtn = this.shadowRoot.querySelector("#copy-code-btn");
        const originalIcon = copyBtn.querySelector(
          ".material-symbols-outlined"
        );
        const checkIcon = this.createMaterialIcon("check", "copy-icon");
        copyBtn.replaceChild(checkIcon, originalIcon);
 
        const tooltip = this.shadowRoot.querySelector(".copy-tooltip");
        tooltip.textContent = "Copied!";
        tooltip.classList.add("show");
 
        setTimeout(() => {
          const copyIcon = this.createMaterialIcon("content_copy", "copy-icon");
          copyBtn.replaceChild(copyIcon, checkIcon);
          tooltip.classList.remove("show");
          tooltip.textContent = "Copy code";
        }, 2000);
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  }
 
  setupEventListeners() {
    const copyButton = this.shadowRoot.querySelector("#copy-code-btn");
    if (copyButton) {
      copyButton.addEventListener("click", this.copyLobbyCode.bind(this));
    }
  }
 
  removeEventListeners() {
    const copyButton = this.shadowRoot.querySelector("#copy-code-btn");
    if (copyButton) {
      copyButton.removeEventListener("click", this.copyLobbyCode.bind(this));
    }
  }
 
  createMaterialIcon(iconName, className = "") {
    const icon = document.createElement("span");
    icon.className = `material-symbols-outlined ${className}`;
    icon.textContent = iconName;
    return icon;
  }
 
  render() {
    this.shadowRoot.innerHTML = "";
 
    const participants = this.lobbyData?.data?.participants || [];
    const maxParticipants = this.lobbyData?.data?.max_participants || 0;
    const joinCode = this.lobbyData?.data?.join_code || "";
    const lobbyName = this.lobbyData?.data?.lobby_name || "Loading...";
    const startedAt =
      this.lobbyData?.data?.started_at || new Date().toISOString();
 
    const style = document.createElement("style");
    style.textContent = `
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined");
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
 
        :host {
          display: block;
          font-family: 'Poppins', sans-serif;
        }
         
        .material-symbols-outlined {
          font-size: 18px;
          vertical-align: middle;
        }
 
        .lobby-container {
          background-color: white;
          border-radius: 0.75rem;
          overflow: hidden;
        }
 
        header {
          background-color: #f3e8ff;
          color: #6b21a8;;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(107, 33, 168, 0.1);
        }
 
        header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }
 
        main {
          padding: 1.5rem;
        }
 
        .lobby-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
 
        .lobby-code-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
 
        .lobby-code {
          background-color: #f3e8ff;
          color: #6b21a8;;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-weight: 500;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
 
        .copy-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b21a8;;
          position: relative;
          padding: 0;
          display: flex;
          align-items: center;
        }
 
        .copy-tooltip {
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #333;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
          white-space: nowrap;
        }
 
        .copy-tooltip.show {
          opacity: 1;
        }
 
        .player-count {
          background-color: #dcfce7;
          color: #166534;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
        }
 
        .players-heading {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 1rem;
          color: #4b5563;
        }
 
        .players-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
 
        .player-item {
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }
 
        .host-player {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
        }
 
        .player-name {
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
 
        .host-badge {
          font-size: 0.75rem;
          background-color: #bbf7d0;
          color: #166534;
          padding: 0.15rem 0.5rem;
          border-radius: 0.25rem;
          font-weight: 600;
        }
 
        .player-status {
          font-size: 0.875rem;
          color: #6b7280;
        }
 
        footer {
          background-color: #f9fafb;
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          font-size: 0.875rem;
          color: #6b7280;
          text-align: center;
        }
      `;
    this.shadowRoot.appendChild(style);
 
    const container = document.createElement("article");
    container.classList.add("lobby-container");
 
    const header = document.createElement("header");
    const title = document.createElement("h2");
    title.textContent = lobbyName;
    header.appendChild(title);
 
    const main = document.createElement("main");
 
    const lobbyMeta = document.createElement("section");
    lobbyMeta.classList.add("lobby-meta");
 
    const lobbyCodeContainer = document.createElement("div");
    lobbyCodeContainer.classList.add("lobby-code-container");
 
    const lobbyCode = document.createElement("p");
    lobbyCode.classList.add("lobby-code");
    lobbyCode.textContent = `Lobby Code: ${joinCode}`;
 
    const copyBtn = document.createElement("button");
    copyBtn.id = "copy-code-btn";
    copyBtn.classList.add("copy-button");
    copyBtn.setAttribute("aria-label", "Copy lobby code");
    copyBtn.appendChild(this.createMaterialIcon("content_copy", "copy-icon"));
 
    const tooltip = document.createElement("figure");
    tooltip.classList.add("copy-tooltip");
    tooltip.textContent = "Copy code";
    copyBtn.appendChild(tooltip);
 
    lobbyCodeContainer.appendChild(lobbyCode);
    lobbyCodeContainer.appendChild(copyBtn);
 
    const playerCount = document.createElement("p");
    playerCount.classList.add("player-count");
    playerCount.textContent = `${participants.length}/${maxParticipants} Players`;
 
    lobbyMeta.appendChild(lobbyCodeContainer);
    lobbyMeta.appendChild(playerCount);
 
    const playersSection = document.createElement("section");
 
    const playersHeading = document.createElement("h3");
    playersHeading.classList.add("players-heading");
    playersHeading.textContent = "Players";
 
    const playersList = document.createElement("ul");
    playersList.classList.add("players-list");
 
    participants.forEach((p) => {
      const playerItem = document.createElement("li");
      playerItem.classList.add("player-item");
      if (p.participant_status === "Creator") {
        playerItem.classList.add("host-player");
      }
 
      const playerInfo = document.createElement("p");
      playerInfo.classList.add("player-info");
 
      const name = document.createElement("p");
      name.classList.add("player-name");
      name.textContent = p.alias;
 
      if (p.participant_status === "Creator") {
        const badge = document.createElement("p");
        badge.classList.add("host-badge");
        badge.textContent = "Host";
        name.appendChild(badge);
      }
 
      const status = document.createElement("p");
      status.classList.add("player-status");
      status.textContent = p.participant_status;
 
      playerInfo.appendChild(name);
      playerItem.appendChild(playerInfo);
      playerItem.appendChild(status);
      playersList.appendChild(playerItem);
    });
 
    playersSection.appendChild(playersHeading);
    playersSection.appendChild(playersList);
 
    main.appendChild(lobbyMeta);
    main.appendChild(playersSection);
 
    const footer = document.createElement("footer");
    footer.textContent = `Created on ${new Date(startedAt).toLocaleString()}`;
 
    container.appendChild(header);
    container.appendChild(main);
    container.appendChild(footer);
 
    this.shadowRoot.appendChild(container);
 
    this.setupEventListeners();
  }
}
 
customElements.define("trivia-lobby", TriviaLobby);