import LobbyService from "../../services/lobbies.service.js";
import "./SelectCategories.component.js";
import "./Switch.component.js";
import "./Button.js";
import "./TextInput.component.js";
import { User } from "../../models/user.js";

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
  }

  async createLobby() {
    return await this.lobbyService.createLobby(this.formData);
  }

  onFormValueChange(event) {
    const field = event.target.dataset.field;
    const value = event.detail;
    this.formData[field] = value;
  }

  render() {
    this.shadowRoot.innerHTML = `
                    <style>
                    @import url("/static/css/index.css");
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
                    <app-switch data-field="isPublic" label="Public Lobby" description="Visible to everyone in the lobby list"></app-switch>
                    <select-categories data-field="categoryIds"></select-categories>
                    <app-button id="createLobby" class="submit-button">Create lobby</app-button>
                    </main>
                    </section>

`;
  }
}

customElements.define("lobby-form", LobbyForm);
