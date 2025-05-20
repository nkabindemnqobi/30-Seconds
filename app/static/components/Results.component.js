
import { GameSession } from "../../models/game-session.js";
import router from "../js/index.js";
import importStylesheet from "../utils/import-style-sheet.js";
import "./Button.js";

export default class TriviaMatchResults extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.data = GameSession.data;
  }

  connectedCallback() {
    this.render();
  }

  async playAgain() {
    this.dispatchEvent(
      new CustomEvent("play-again", { bubbles: true, composed: true })
    );
  }

  async backToDashboard() {
    history.pushState({}, "", "/");
    router();
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
  flex-wrap: wrap;
  gap: 0.5rem;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1 1 auto;
  min-width: 150px;
}

.player-name {
  font-weight: 600;
  font-size: 1.125rem;
  color: #1f2937;
}

.player-rank {
  font-size: 0.875rem;
  color: #4b5563;
}

.score-container {
  text-align: center;
  background-color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  min-width: 80px;
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
  margin-top: 1rem;
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

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

@media (max-width: 600px) {
  .player-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .score-container {
    align-self: flex-end;
  }

  .card-content {
    padding: 1rem;
  }

  .player-name {
    font-size: 1rem;
  }

  .score {
    font-size: 1.25rem;
  }
}
    `;
    shadow.appendChild(style);

    const mainElement = document.createElement("main");
    mainElement.classList.add("card-content");

    if (!this.data || this.data.length === 0) {
      const placeholder = document.createElement("p");
      placeholder.textContent = "No match data available or scores are empty.";
      if (!this.data) {
        console.warn(
          "TriviaMatchResults.render: Match data (this.data from GameSession.data.scores) is undefined or null."
        );
      } else if (this.data.length === 0) {
        console.warn(
          "TriviaMatchResults.render: Match data (this.data from GameSession.data.scores) is an empty array."
        );
      }
      mainElement.appendChild(placeholder);
    } else {

      const leaderboard = document.createElement("section");
      leaderboard.setAttribute("aria-labelledby", "leaderboard-title");
      leaderboard.classList.add("players-list");

      const leaderboardTitle = document.createElement("h2");
      leaderboardTitle.id = "leaderboard-title";
      leaderboardTitle.classList.add("sr-only");
      leaderboardTitle.textContent = "Player Rankings";
      leaderboard.appendChild(leaderboardTitle);

      const sortedPlayers = [...this.data].sort(
        (a, b) => b.total_score - a.total_score
      );

      sortedPlayers.forEach((player, index) => {
        const playerCard = document.createElement("article");
        playerCard.classList.add("player-card");

        const content = document.createElement("div");
        content.classList.add("player-content");

        const info = document.createElement("div");
        info.classList.add("player-info");

        const nameElement = document.createElement("h3"); 
        nameElement.classList.add("player-name");
        nameElement.textContent = player.user_alias || "N/A"; 

        if (index === 0 && player.total_score > 0) {
          const winnerBadge = document.createElement("span");
          winnerBadge.classList.add("winner-badge");
          winnerBadge.textContent = "Winner";
          nameElement.appendChild(winnerBadge);
        }

        const rank = document.createElement("span");
        rank.classList.add("player-rank");
        rank.textContent = `Rank: #${index + 1}`;

        info.appendChild(nameElement);
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

      mainElement.appendChild(leaderboard);

      const actions = document.createElement("nav");
      actions.classList.add("actions");
      actions.setAttribute("aria-label", "Game actions");

      const backToDashboardButton = document.createElement("app-button");
      backToDashboardButton.id = "back-to-dashboard";
      backToDashboardButton.setAttribute("leftIcon", "dashboard");
      backToDashboardButton.textContent = "Back to Dashboard";
      backToDashboardButton.addEventListener("click", () =>
        this.backToDashboard()
      );

      actions.appendChild(backToDashboardButton);
      mainElement.appendChild(actions);
    }

    shadow.appendChild(mainElement);
  }
}

customElements.define("trivia-match-results", TriviaMatchResults);
