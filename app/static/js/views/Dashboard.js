import { GoogleAuth } from "../../../services/google-auth.service.js";
import AbstractView from "./AbstractView.js";
import "../../components/View.component.js";
import { initSSE } from "../sseManager/sse.js";

export default class Dashboard extends AbstractView {
    constructor(params) {
        super(params);
        const googleAuth = new GoogleAuth();
        this.setTitle("Dashboard");
    }
    
  async getHtml() {
    return `
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
