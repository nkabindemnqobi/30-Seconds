import AbstractView from "./AbstractView.js";
import "../../components/lobby.component.js";
import "../../components/Button.js";



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
                <h1 class="card-title">Lobby </h1>
                <p class="card-description">Waiting for teams to join and get ready</p>
            </header>
            <main class="card-content" id="appContent">
                <trivia-lobby></trivia-lobby>

                    <app-button leftIcon="vpn_key" id="login-button" class="blue-button"> Start game</app-button>

            </main>
        </section>
        `;
    }
}