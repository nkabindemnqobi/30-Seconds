import "./Button.js";
import "./Countdown.component.js";
import "./Hints.js";
import "./TextInput.component.js";
import GameController from "../../services/gameplay.service.js";
import eventbus from "../js/sseManager/eventbus.js";
import LobbyService from "../../services/lobbies.service.js";

export class GamePlayComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.gameController = new GameController();
    this.lobbyService = new LobbyService();
    this.joinCode = undefined;
  }

  connectedCallback() {
    document.title = "30 Seconds - Game Play";
    this.render();
    this.addEventListeners();
  }

  addEventListeners() {
    eventbus.on("game_started", async (event) => {
      const { joinCode } = event.detail;
      this.joinCode = joinCode;
      const timer = document.querySelector("countdown-timer");
      timer.joinCode = joinCode;
    });
    eventbus.on("lobby-started", (event) => {
      this.joinCode = event.detail.joinCode;
    });
    eventbus.on("round_timeout", async (_event) => {
      const answerResponse = this.shadowRoot.querySelector("#round-update");
      answerResponse.classList.add("display");
      answerResponse.textContent = "Times's up";
      this.render();
      this.addEventListeners();
      this.startRound();
      const timerComponent = this.shadowRoot.querySelector("countdown-timer");
      const shadowRoot = timerComponent.shadowRoot;
      const eyeButton = shadowRoot.querySelector(".eye-button");
      eyeButton.click();
    });
    this.guess = "";
    this.shadowRoot.addEventListener("typing", this.onGuess.bind(this));
    const submitGuessButton = this.shadowRoot.querySelector("#submit-guess");
    submitGuessButton.addEventListener("click", this.submitGuess.bind(this));
  }

  async submitGuess() {
    const response = await this.lobbyService.submitGuess(
      sessionStorage.getItem("joinCode"),
      this.guess
    );
    const answerResponse = this.shadowRoot.querySelector("#round-update");
    answerResponse.classList.add("display");
    if (response.correct) {
      const answerResponse = this.shadowRoot.querySelector("#round-update");
      answerResponse.classList.add("display");
      answerResponse.textContent = "Times's up";
      this.render();
      this.addEventListeners();
      this.startRound();
      const timerComponent = this.shadowRoot.querySelector("countdown-timer");
      const shadowRoot = timerComponent.shadowRoot;
      const eyeButton = shadowRoot.querySelector(".eye-button");
      eyeButton.click();
    } else {
      answerResponse.textContent = "Incorrect answer. Try again";
    }
  }

  async startRound() {
    return await this.lobbyService.startRound(
      sessionStorage.getItem("joinCode")
    );
  }

  onGuess(event) {
    this.guess = event.detail;
  }

  render() {
    const html = `
      <section class="card">
        <countdown-timer
          seconds="30"
          team="Team Red"
          question-id="q1">
        </countdown-timer>
 
        <main class="card-content" id="appContent">
          <hint-box value="10 points"></hint-box>  
          <text-input data-field="guess" id="guess"></text-input>    
                <p id="round-update" class="hidden"></p>
          <app-button leftIcon="check" id="submit-guess" class="blue-button">Submit</app-button>
        </main>
      </section>
    `;

    const style = `
      <style>
        .card {
          padding: 1rem;
          background: #fff;
          border-radius: 0.75rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .card-content {
          margin-top: 1rem;
        }
        .blue-button {
          background-color: #007bff;
          color: white;
        }
          .hidden{visibility:hidden}
          .display{visibility : visible}
      </style>
    `;

    const parser = new DOMParser();
    const doc = parser.parseFromString(
      `<template>${style}${html}</template>`,
      "text/html"
    );
    const templateContent = doc.querySelector("template").content;

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(templateContent.cloneNode(true));
  }
}

customElements.define("game-play", GamePlayComponent);
