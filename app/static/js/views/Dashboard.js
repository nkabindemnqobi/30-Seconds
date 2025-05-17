import AbstractView from "./AbstractView.js";
import "../../components/View.component.js";

export default class Dashboard extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("Dashboard");
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
                <a href="/create-lobby" data-link>Create Lobby</a>
                <a href="/join-lobby" data-link>Join with Code</a>
                <a href="/results" data-link>Joicscscdsc</a>
                <view-lobbies></view-lobbies>
            </main>
            </section>
        `;
  }
}
