import LobbyService from "../../services/lobbies.service.js";
import "./SelectCategories.component.js";
import "./Switch.component.js";
import "./Button.js";

export default class LobbyForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.title = "Create a Lobby";
    this.lobbyService = new LobbyService();
    this.formData = {
      isPublic: false,
      matchCreatorId: undefined,
      statusId: undefined,
      maxParticipants: undefined,
      teams: [
        { teamName: undefined, captainId: undefined },
        { teamName: undefined, captainId: undefined },
      ],
    };
  }

  connectedCallback() {
    this.render();
    this.createLobby();
    this.shadowRoot.addEventListener(
      "change",
      this.onFormValueChange.bind(this)
    );
  }

  async createLobby() {
    const button = this.shadowRoot.getElementById("createLobby");
    if (button) {
      console.log(button);
      button.addEventListener("click", async () => {
        console.log("Calling createLobby...");
        try {
          const response = await this.lobbyService.createLobby();
          console.log("Lobby created:", response);
        } catch (error) {
          console.error("Failed to create lobby:", error);
        }
      });
    } else {
      console.warn("Create button not found");
    }
  }

  onFormValueChange(event) {
    const field = event.target.dataset.field;
    const value = event.detail;
    this.formData[field] = value;
    console.log(this.formData);
  }

  render() {
    this.shadowRoot.innerHTML = `
    <style>
        @import url('/static/css/index.css');
      </style>
            <section class="card" aria-labelledby="create-lobby-heading">
                <header>
                    <h1 id="create-lobby-heading">Create a Lobby</h1>
                    <p class="subtext">Set up a lobby for teams to join and play trivia</p>
                </header>

                    <div class="input-group">
                        <label for="lobbyName">Lobby Name</label>
                        <input type="text" id="lobbyName" name="lobbyName" placeholder="Enter a name for your lobby"  />
                    </div>
                    <div class="input-group">
                        <label for="lobbyName">First Team Name</label>
                        <input type="text" id="lobbyName" name="lobbyName" placeholder="Enter a name for your lobby"  />
                    </div>
                    <div class="input-group">
                        <label for="lobbyName">Second Team Name</label>
                        <input type="text" id="lobbyName" name="lobbyName" placeholder="Enter a name for your lobby"  />
                    </div>
                    <div class="input-group">
                        <label for="teamSelect">Your Team</label>
                        <select id="teamSelect" name="teamSelect" >
                            <option value="" disabled selected>Select your team</option>
                            <option value="Team A">First Team</option>
                            <option value="Team B">Second Team</option>
                        </select>
                    </div>

                    <div class="input-group">
                        <label for="teamSlider">Max Teams: <span id="teamCount">4</span></label>
                        <input type="range" min="2" max="10" value="4" id="teamSlider" name="maxTeams" />
                    </div>
                    <app-switch data-field="isPublic"></app-switch>
                            <select-categories></select-categories>
                    <app-button id="createLobby" class="primary" >Create lobby</app-button>
                     <app-button leftIcon="replay" id="createLobby" class="primary">Button with icon example</app-button>
            </section>
        `;
  }
}

customElements.define("lobby-form", LobbyForm);
