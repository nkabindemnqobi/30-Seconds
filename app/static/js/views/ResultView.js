import AbstractView from "./AbstractView.js";
import "../../components/Results.component.js";
import "../../components/Button.js";

export default class CreateLobby extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("Create a Lobby");
  }

  async getHtml() {
    return `
    <section class="card">
               <header class="card-header">
                <h1 class="card-title">Match Results</h1>
                <p class="card-description">Final scores and rankings</p>
                </header>                
                    <main class="card-content" id="appContent">
                    <app-button id="dashboard" class="blue-button"> Return to Dashboard</app-button>
                    <app-button id="replay" class="blue-button"> Play Gategories</app-button>
                    </main>
            </section>
        `;
  }
}
