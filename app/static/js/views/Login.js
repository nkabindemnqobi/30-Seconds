import AbstractView from "./AbstractView.js";
import "../../components/Button.js";

export default class Login extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Login");
    }
   
    async getHtml() {
        return `
        <style>
            @import url('/static/css/login.css');
        </style>
        <section class="card">
            <header class="card-header">
                <h1 class="card-title">30-Second Trivia Challenge</h1>
                <p class="card-description">Join a lobby or create your own to start playing!</p>
            </header>
            <main class="card-content" id="appContent">
                <section class="welcome-section">
                    <h3>Welcome to 30-Second Trivia!</h3>
                    <p>Sign in to join lobbies and start playing!</p>
                </section>
                <app-button leftIcon="login" id="login-button" class="gradient full-width"> Sign in with Google</app-button>
                
                <ul>
                    <li>Sign in and create or join a team</li>
                    <li>Join an existing lobby or create your own</li>
                    <li>Wait for other teams to join</li>
                    <li>Start the match when everyone is ready</li>
                    <li>Answer trivia questions to earn points</li>
                    <li>The team with the most points wins!</li>
                </ul>
            </main>
        </section>
        `;
    }
}