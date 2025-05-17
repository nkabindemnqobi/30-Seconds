//import MatchService from "../../services/match.service.js";
import importStylesheet from "../utils/import-style-sheet.js";
import "./Button.js";

export default class TriviaMatchResults extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.data = null;
   this.matchService = new MatchService();
  }

  get matchData() {
    return this.data;
  }

  set matchData(value) {
    this.data = value;
    if (this.isConnected) {
      this.render();
    }
  }

  connectedCallback() {
    this.render();
  }

  async playAgain() {
    this.dispatchEvent(new CustomEvent("play-again"));
  }

  async backToDashboard() {
    this.dispatchEvent(new CustomEvent("back-to-dashboard"));
  }

  render() {
    const shadow = this.shadowRoot;
    while (shadow.firstChild) {
      shadow.removeChild(shadow.firstChild);
    }

    importStylesheet(this.shadowRoot, "/static/css/index.css");
    
    const style = document.createElement("style");
    style.textContent = `
      @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined");
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

      :host {
        display: block;
        font-family: 'Poppins', sans-serif;
      }
        
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        font-size: 18px;
        vertical-align: middle;
      }

      .card {
        background-color: white;
        border-radius: 0.75rem;
        overflow: hidden;
        max-width: 600px;
        margin: 0 auto;
      }

      .card-header {
        background-color: #f3e8ff;
        color: #6b21a8;
        padding: 1.5rem;
        text-align: center;
        border-bottom: 1px solid rgba(107, 33, 168, 0.1);
      }

      .card-title {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .card-description {
        margin: 0;
        color: #7e22ce;
        font-size: 0.875rem;
      }

      .card-content {
        padding: 1.5rem;
      }

      .players-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 2rem;
      }

      .player-card {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        transition: transform 0.2s ease;
      }

      .player-card:hover {
        transform: translateY(-2px);
      }

      .player-card:first-child {
        background-color: #fef3c7;
        border-color: #fbbf24;
      }

      .player-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .player-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .player-name {
        font-weight: 600;
        font-size: 1.125rem;
        color: #1f2937;
      }

      .score-container {
        text-align: center;
        background-color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
      }

      .score {
        font-size: 1.5rem;
        font-weight: 700;
        color: #6b21a8;
      }

      .score-label {
        font-size: 0.75rem;
        color: #6b7280;
      }

      .actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .winner-badge {
        display: inline-block;
        background-color: #fbbf24;
        color: #78350f;
        padding: 0.125rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
        margin-left: 0.5rem;
      }
    `;
    shadow.appendChild(style);

    

    const main = document.createElement("main");
    main.classList.add("card-content");

    if (!this.data) {
      const placeholder = document.createElement("p");
      placeholder.textContent = "No match data available";
      main.appendChild(placeholder);
    } else {
      const leaderboard = document.createElement("section");
      leaderboard.setAttribute("aria-labelledby", "leaderboard-title");
      leaderboard.classList.add("players-list");
      
      const leaderboardTitle = document.createElement("h2");
      leaderboardTitle.id = "leaderboard-title";
      leaderboardTitle.classList.add("sr-only");
      leaderboardTitle.textContent = "Player Rankings";
      leaderboard.appendChild(leaderboardTitle);

  
      const sortedPlayers = [...this.data].sort((a, b) => b.total_score - a.total_score);
      const winner = sortedPlayers[0];

      sortedPlayers.forEach((player, index) => {
        const playerCard = document.createElement("article");
        playerCard.classList.add("player-card");

        const content = document.createElement("div");
        content.classList.add("player-content");

        const info = document.createElement("div");
        info.classList.add("player-info");
        
        const name = document.createElement("h3");
        name.classList.add("player-name");
        name.textContent = player.user_alias;
        
        if (index === 0) {
          const winnerBadge = document.createElement("span");
          winnerBadge.classList.add("winner-badge");
          winnerBadge.textContent = "Winner";
          name.appendChild(winnerBadge);
        }
        
        const rank = document.createElement("span");
        rank.classList.add("player-rank");
        rank.textContent = `Rank: #${index + 1}`;
        
        info.appendChild(name);
        info.appendChild(rank);

        const scoreContainer = document.createElement("div");
        scoreContainer.classList.add("score-container");
        
        const score = document.createElement("div");
        score.classList.add("score");
        score.setAttribute("aria-label", `${player.total_score} points`);
        score.textContent = player.total_score;
        
        const scoreLabel = document.createElement("div");
        scoreLabel.classList.add("score-label");
        scoreLabel.textContent = "Points";
        
        scoreContainer.appendChild(score);
        scoreContainer.appendChild(scoreLabel);

        content.appendChild(info);
        content.appendChild(scoreContainer);
        playerCard.appendChild(content);
        leaderboard.appendChild(playerCard);
      });

      const actions = document.createElement("nav");
      actions.classList.add("actions");
      actions.setAttribute("aria-label", "Game actions");

      const playAgainButton = document.createElement("app-button");
      playAgainButton.id = "play-again-btn";
      playAgainButton.classList.add("gradient");
      playAgainButton.setAttribute("leftIcon", "replay");
      playAgainButton.textContent = "Play Again";
      playAgainButton.addEventListener("click", () => this.playAgain());

      const backToDashboardButton = document.createElement("app-button");
      backToDashboardButton.id = "back-to-dashboard";
      backToDashboardButton.setAttribute("leftIcon", "dashboard");
      backToDashboardButton.textContent = "Back to Dashboard";
      backToDashboardButton.addEventListener("click", () => this.backToDashboard());

      actions.appendChild(playAgainButton);
      actions.appendChild(backToDashboardButton);

      main.appendChild(leaderboard);
      main.appendChild(actions);
    }

    article.appendChild(header);
    article.appendChild(main);
    shadow.appendChild(article);
  }
}

customElements.define("trivia-match-results", TriviaMatchResults);