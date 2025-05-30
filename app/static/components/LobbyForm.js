import LobbyService from "../../services/lobbies.service.js";
import "./SelectCategories.component.js";
import "./Switch.component.js"; 
import "./Button.js";
import "./TextInput.component.js";
import { User } from "../../models/user.js";
import router from "../js/index.js";

export default class LobbyForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.title = "Create a Lobby";
    this.lobbyService = new LobbyService();
    this.formData = {
      userId: User.user.googleId,
      categoryIds: [],
      isPublic: false, 
      maxParticipants: 1,
      lobbyName: undefined,
    };
    
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.addEventListener(
      "updated",
      this.onFormValueChange.bind(this)
    );
    this.shadowRoot.addEventListener(
      "change",
      this.onFormValueChange.bind(this)
    );

    this.shadowRoot
      .querySelector("#createLobby")
      ?.addEventListener("click", this.createLobby.bind(this));

    const teamSlider = this.shadowRoot.querySelector("#maxParticipants");
    const teamLabel = this.shadowRoot.querySelector(
      'label[for="maxParticipants"]'
    );

    if (teamSlider && teamLabel) {
      teamLabel.textContent = `Max participants allowed: ${teamSlider.value}`;

      teamSlider.addEventListener("input", (event) => {
        const value = parseInt(event.target.value, 10);
        teamLabel.textContent = `Max participants allowed: ${value}`;

        teamSlider.dispatchEvent(
          new CustomEvent("updated", {
            detail: value, 
            bubbles: true,
            composed: true,
          })
        );
      });
    }
    const createLobbyButton = this.shadowRoot.getElementById("createLobby");
    const isValid = this.formData.lobbyName && this.formData.categoryIds.length > 0;
    if(createLobbyButton && !isValid) {
      createLobbyButton.setAttribute('disabled', 'true');
    }
  }

  async createLobby() {
    try {
      const createLobbyButton = this.shadowRoot.getElementById("createLobby");
      const isValid = this.formData.lobbyName && this.formData.categoryIds.length > 0;
      const submitLobbyError = this.shadowRoot.getElementById('error-message-submit');

      if (createLobbyButton && isValid) {
        submitLobbyError.textContent = '';
      }

      if (!createLobbyButton || !isValid) {
        submitLobbyError.textContent = 'Please select 1 or more categories or input a lobby name and try again.';
        return;
      }

      const errorMsg = this.shadowRoot.querySelector("#error-message");
      const createLobby = await this.lobbyService.createLobby(this.formData);
      if(!createLobby.data) {
        errorMsg.textContent = createLobby.message;
      }
      if(createLobby.data.success) {
        history.pushState({}, "", "/trivia-lobby");
        router();
      }
    } catch (_err) {
      
    }
  }

  onFormValueChange(event) {
    const field = event.target.dataset.field;
    let value = event.detail;
    
    if (value === undefined && event.target.id === 'maxParticipants' && event.type === 'change') {
      value = parseInt(event.target.value, 10);
    }
    this.formData[field] = value;
  }

  render() {
    this.shadowRoot.innerHTML = ""; 
    const html = `
    <style>
      @import url("/static/css/index.css");

      #error-message,
      #error-message-submit {
          color: #e53935;
          font-size: 0.85rem;
          margin-top: 0.5rem;
          min-height: 1.2rem;
      }
    </style>
    <section class="card" aria-labelledby="create-lobby-heading">
      <header class="card-header">
        <h1 class="card-title" id="create-lobby-heading">Create a Lobby</h1>
        <p class="card-description">Set up a lobby for teams to join and play trivia</p>
      </header>
      <main class="card-content" id="appContent">
        <text-input
          label="Lobby name"
          data-field="lobbyName"
          placeholder="Enter a name for your lobby"
        ></text-input>
        
        <p id="error-message"></p>
        <section class="input-group">
          <label for="maxParticipants"></label>
          <input
            type="range"
            min="1"
            max="5"
            value="1"
            id="maxParticipants"
            name="maxTeams" 
            data-field="maxParticipants" 
          />
        </section>

        <app-switch
          data-field="isPublic" 
          label="Public Lobby"
          description="Visible to everyone in the lobby list"
          aria-checked="${this.formData.isPublic}" 
        ></app-switch>

        <select-categories data-field="categoryIds"></select-categories>

        <p id="error-message-submit"></p>
        <app-button id="createLobby" class="submit-button" disabled>Create lobby</app-button>
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

customElements.define("lobby-form", LobbyForm);
