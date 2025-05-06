import AbstractView from "./AbstractView.js";

export default class CreateLobby extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Create a Lobby");
    }

    async getHtml() {
        return `
            <section class="card" aria-labelledby="create-lobby-heading">
                <header>
                    <h1 id="create-lobby-heading">Create a Lobby</h1>
                    <p class="subtext">Set up a lobby for teams to join and play trivia</p>
                </header>

                <form id="lobbyForm">
                    <div class="input-group">
                        <label for="lobbyName">Lobby Name</label>
                        <input type="text" id="lobbyName" name="lobbyName" placeholder="Enter a name for your lobby" required />
                    </div>
                    <div class="input-group">
                        <label for="lobbyName">First Team Name</label>
                        <input type="text" id="lobbyName" name="lobbyName" placeholder="Enter a name for your lobby" required />
                    </div>
                    <div class="input-group">
                        <label for="lobbyName">Second Team Name</label>
                        <input type="text" id="lobbyName" name="lobbyName" placeholder="Enter a name for your lobby" required />
                    </div>
                    <div class="input-group">
                        <label for="teamSelect">Your Team</label>
                        <select id="teamSelect" name="teamSelect" required>
                            <option value="" disabled selected>Select your team</option>
                            <option value="Team A">First Team</option>
                            <option value="Team B">Second Team</option>
                        </select>
                    </div>

                    <div class="input-group">
                        <label for="teamSlider">Max Teams: <span id="teamCount">4</span></label>
                        <input type="range" min="2" max="10" value="4" id="teamSlider" name="maxTeams" />
                    </div>

                    <div class="switch">
                        <label for="publicToggle">Public Lobby</label>
                        <div id="toggle" class="toggle" role="switch" aria-checked="false" tabindex="0"></div>
                    </div>

                    <fieldset>
                        <legend>Categories</legend>
                        <div class="categories">
                            <button type="button">Animals</button>
                            <button type="button">Space</button>
                            <button type="button">Geography</button>
                            <button type="button">Chemistry</button>
                            <button type="button">Art</button>
                            <button type="button">Music</button>
                        </div>
                        <small>All categories will be included</small>
                    </fieldset>

                    <button type="submit" class="create">Create Lobby</button>
                </form>
            </section>
        `;
    }
}


