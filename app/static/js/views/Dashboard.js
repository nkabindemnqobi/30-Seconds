import AbstractView from "./AbstractView.js";
import "../../components/View.component.js";
import { User } from "../../../models/user.js";

export default class Dashboard extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Dashboard");
    }
    
  async getHtml() {
     
    return (User.user.idToken && User.user.googleId) 
    ? `
            <section class="card">
               <header class="card-header">
                <h1 class="card-title">30-Second Trivia Challenge</h1>
                <p class="card-description">Join a lobby or create your own to start playing!</p>
                </header>
                <a href="/create-lobby" data-link>Create Lobby</a>
                <a href="/join-lobby" data-link>Join with Code</a>
                <view-lobbies></view-lobbies>
                <button id="refreshLobbiesBtn">Refresh Lobbies</button>
            </section>
        `
    : `
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
                <app-button leftIcon="login" id="login-button" class="gradient"> Sign in with Google</app-button>
                
                <article class="how-to">
                    <h2>How to Join</h2>
                    <ul>
                        <li>Sign in and create or join a team</li>
                        <li>Join an existing lobby or create your own</li>
                        <li>Wait for other teams to join</li>
                        <li>Start the match when everyone is ready</li>
                        <li>Answer trivia questions to earn points</li>
                        <li>The team with the most points wins!</li>
                    </ul>
                    </article>
            </main>
        </section>
        `;
    }

    afterRender() {
        console.log('Dashboard: afterRender called'); // For debugging

        const refreshLobbiesBtn = document.getElementById('refreshLobbiesBtn');
        const viewLobbiesElement = document.querySelector('view-lobbies'); 
        if (refreshLobbiesBtn && viewLobbiesElement) {
            refreshLobbiesBtn.addEventListener('click', () => {
                if (typeof viewLobbiesElement.refreshLobbies === 'function') {
                    viewLobbiesElement.refreshLobbies(); 
                } else {
                    console.warn('Dashboard: view-lobbies element does not have a refreshLobbies method.');
                }
            });
        } else {
            if (!refreshLobbiesBtn) console.error('Dashboard: Refresh button (refreshLobbiesBtn) not found.');
            if (!viewLobbiesElement) console.error('Dashboard: <view-lobbies> element not found.');
        }
      }
}
