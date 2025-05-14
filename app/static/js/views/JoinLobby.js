import AbstractView from "./AbstractView.js";
import "../../components/Button.js";
import "../../components/TextInput.component.js";

export default class JoinLobby extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("JoinLobby");
    }
   
    async getHtml() {
        return `
        <style>
            @import url('/static/css/login.css');
        </style>
        <section class="card">
            <header class="card-header">
                <h1 class="card-title">Join a Lobby</h1>
                <p class="card-description">Enter a lobby code to join a game</p>
            </header>
            <main class="card-content" id="appContent">
                <text-input
                    id="lobbyCode"
                    label="Lobby Code"
                    placeholder="Enter the 6-digit code"
                    maxlength="6"
                    required
                    ></text-input>               
                <article class="how-to">
                    <h2>How to Join</h2>
                    <ul>
                        <li>Get a 6-digit lobby code from the host</li>
                        <li>Enter the code above (not case sensitive)</li>
                        <li>Select which team you're representing</li>
                        <li>Wait for the host to start the game</li>
                    </ul>
                    </article>

                    <app-button leftIcon="vpn_key" id="login-button" class="blue-button"> Join Lobby</app-button>

            </main>
        </section>
        `;
    }
}