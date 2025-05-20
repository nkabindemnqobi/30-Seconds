import LobbyService from "../../services/lobbies.service.js";
import { User } from "../../models/user.js";
import "./Button.js";
import "./TextInput.component.js";
import router from "../js/index.js";

export default class JoinWithCode extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.lobbyService = new LobbyService();
    this.errorMsg = "";
  }

  connectedCallback() {
    this.render();

    this.shadowRoot
      .querySelector("#joinLobby")
      ?.addEventListener("click", this.joinLobby.bind(this));

    const codeInput = this.shadowRoot.querySelector("#lobbyCode");
    if (codeInput) {
      codeInput.addEventListener("updated", this.validateLobbyCode.bind(this));
    }
  }

  validateLobbyCode(event) {
    this.lobbyCode = event.detail;

    const errorMsg = this.shadowRoot.querySelector("#error-message");

    const joinButton = this.shadowRoot.querySelector("#joinLobby");

    if (!this.lobbyCode || this.lobbyCode.length === 0) {
      if (errorMsg) errorMsg.textContent = "";
      if (joinButton) joinButton.disabled = true;
    } else if (this.lobbyCode.length !== 8) {
      if (errorMsg) errorMsg.textContent = "Please enter an 8-digit lobby code";
      if (joinButton) joinButton.disabled = true;
    } else {
      if (errorMsg) errorMsg.textContent = "";
      if (joinButton) joinButton.disabled = false;
    }
  }

  async joinLobby() {
    const errorMsg = this.shadowRoot.querySelector("#error-message");

    if (!this.lobbyCode) {
      if (errorMsg) errorMsg.textContent = "Please enter a valid lobby code";
      return;
    }

    const userId = User.user?.googleId;
    if (!userId) {
      if (errorMsg)
        errorMsg.textContent = "You must be logged in to join a lobby";
      return;
    }

    const response = await this.lobbyService.joinLobby(this.lobbyCode, userId);

    if (response.success) {
      history.pushState({}, "", "/trivia-lobby");
      router();
      this.dispatchEvent(
        new CustomEvent("lobbyJoined", {
          detail: { lobbyCode: this.lobbyCode },
          bubbles: true,
          composed: true,
        })
      );
    } else {
      
      const errorMsg = this.shadowRoot.querySelector("#error-message");
      errorMsg.textContent =
        "Failed to join lobby. Please check your code and try again.";
    }
  }

  render() {
    this.shadowRoot.innerHTML = "";
    const html = `
      <style>
        @import url("/static/css/index.css");
        
        .card-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .how-to {
          margin: 1rem 0;
          padding: 1rem;
          background-color: #f9f9f9;
          border-radius: 8px;
        }
        
        .how-to h2 {
          margin-top: 0;
          font-size: 1.2rem;
        }
        
        .how-to ul {
          padding-left: 1.5rem;
          margin-bottom: 0;
        }
        
        #error-message {
          color: #e53935;
          font-size: 0.85rem;
          margin-top: -0.5rem;
          min-height: 1.2rem;
        }
        
        #joinLobby:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      </style>
      
      <section class="card" aria-labelledby="join-lobby-heading">
        <header class="card-header">
          <h1 class="card-title" id="join-lobby-heading">Join a Lobby</h1>
          <p class="card-description">Enter the 8-digit code to join a game</p>
        </header>
        
        <main class="card-content" id="appContent">
          <text-input
            id="lobbyCode"
            data-field="lobbyCode"
            label="Lobby Code"
            placeholder="Enter the 8-digit code"
            maxlength="8"
            required
          ></text-input>
          
          <p id="error-message"></p>  
                      
          <article class="how-to">
            <h2>How to Join</h2>
            <ul>
              <li>Get an 8-digit lobby code from the host</li>
              <li>Enter the code above (not case sensitive)</li>
              <li>Select which team you're representing</li>
              <li>Wait for the host to start the game</li>
            </ul>
          </article>
          
          <join-lobby-form></join-lobby-form>
         
          <app-button 
            leftIcon="vpn_key" 
            id="joinLobby" 
            class="blue-button"
            disabled="true"
          >
            Join Lobby
          </app-button>
        </main>
      </section>
    `;

    const parser = new DOMParser();
    const doc = parser.parseFromString(
      `<template>${html}</template>`,
      "text/html"
    );
    const content = doc.querySelector("template").content;
    this.shadowRoot.appendChild(content);
  }
}

customElements.define("join-with-code", JoinWithCode);
