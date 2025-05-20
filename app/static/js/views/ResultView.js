import AbstractView from "./AbstractView.js";
import "../../components/Results.component.js";
import "../../components/Button.js";
import { GameSession } from "../../../models/game-session.js";

export default class CreateLobby extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("Match Results"); 
    this.viewData = GameSession.data ? GameSession.data.scores : undefined; 
    console.log("ResultView constructor: GameSession.data.scores:", this.viewData);
  }
 
  async getHtml() {
    return `
<section class="card" id="result-view">
<header class="card-header">
<h1 class="card-title">Match Results</h1>
<p class="card-description">Final scores and rankings</p>
</header>
<main class="card-content" id="appContent">
<trivia-match-results></trivia-match-results>
</main>
</section>
    `;
  }
 
  async afterRender() {
    const triviaResultsElement = document.querySelector('trivia-match-results');
    if (triviaResultsElement) {
      triviaResultsElement.scores = GameSession.data ? GameSession.data.scores : [];
    }
  }
}
 
 