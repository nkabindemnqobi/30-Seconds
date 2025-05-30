import LobbyService from "../../services/lobbies.service.js";
import eventbus from "../js/sseManager/eventbus.js";
import { LobbyData } from "../../models/LobbyData.js";

export default class CountdownTimer extends HTMLElement {
    constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.seconds = parseInt(this.getAttribute("seconds") || 30);
    this.team = this.getAttribute("team") || "Team Red"; 
    this.joinCode = this.getAttribute("joinCode"); 
    this.remaining = this.seconds;
    this.isRunning = false;
    this.interval = null;
    this.isClueRevealed = false;
    this.question = ""; 
    this.lobbyService = new LobbyService();
    this.currentQuestion = ""; 
    this.currentPlayer = "Waiting for round to start..."; 
    
  }

  static get observedAttributes() {
    return ["seconds", "team", "question-id"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === "seconds") {
        this.seconds = parseInt(newValue);
        this.remaining = this.seconds;
      } else if (name === "team") {
        this.team = newValue;
      } else if (name === "question-id") {
        this.questionId = newValue;
        this.question = "";
        this.isClueRevealed = false;
      }
      this.render();
    }
  }

  connectedCallback() {
    if (!this.joinCode && this.hasAttribute("joinCode")) {
        this.joinCode = this.getAttribute("joinCode");
    }
    this.render();
    eventbus.on("round_started", (event) => {
      
      const { roundInfo } = event.detail;
      
      this.round = roundInfo;
      this.currentQuestion = roundInfo.hint;
      
      const currentPlayer = roundInfo.guessingAlias;
      this.currentPlayer = `${currentPlayer}` || "someone else is playing";
      this.question = this.currentQuestion;
      this.isClueRevealed = true;

      this.render();
      this.start();
    });
  }

  disconnectedCallback() {
    this.stop();
  }

  async fetchQuestion() {
    try {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.currentQuestion);
        }, 300);
      });
    } catch (error) {
      
      return "Error loading question";
    }
  }

  async revealQuestion() {
    
    const code = this.joinCode || LobbyData.data.join_code;
    if (!code) {
      
      
      return;
    }
    const eyeButton = this.shadowRoot.querySelector(".eye-button");
    if (eyeButton) {
      eyeButton.disabled = true;
    }
    try {
      
      const response = await this.lobbyService.startRound(code);
      if (response && response.error) { 
        
        if (eyeButton && !this.isClueRevealed) { 
          eyeButton.disabled = false;
        }
      } else if (!response || (response.status && response.status >= 400)) { 
        
        if (eyeButton && !this.isClueRevealed) {
            eyeButton.disabled = false;
        }
      } else {
        
      }
    } catch (error) {
      
      
      if (eyeButton && !this.isClueRevealed) {
        eyeButton.disabled = false;
      }
    }
  }

  render() {
    const progress = (this.remaining / this.seconds) * 100;

    const style = document.createElement("style");
    style.textContent = `
         figure{
         margin:0;
         }
        
        .question-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }
  
        .question-placeholder {
          height: 24px;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          width: 80%;
          animation: pulse 1.5s infinite;
        }
        
        .prompt-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
          margin-top: 8px;
          font-style: italic;
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.8; }
          100% { opacity: 0.6; }
        }
  
        .eye-button {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          font-size: 20px;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .eye-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }
        
        .countdown-container {
          background-color: #ff4c4c;
          color: white;
          padding: 1.5rem;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .team-label {
          background-color: rgba(255, 255, 255, 0.2);
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 500;
          font-size: 14px;
        }
        
        .timer {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .material-icons {
          font-size: 18px;
          opacity: 0.9;
        }
        
        .question {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        
        .progress-bar {
          height: 8px;
          background-color: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        
        .progress-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: ${progress}%;
          background-color: white;
          border-radius: 4px;
          transition: width 1s linear;
        }
        .material-symbols-outlined {font-family: 'Material Symbols Outlined';
        }

      `;

    const container = document.createElement("header");
    container.classList.add("countdown-container");

    const header = document.createElement("header");
    header.classList.add("header");

    const teamLabel = document.createElement("header");
    teamLabel.classList.add("team-label");
    teamLabel.textContent = this.currentPlayer;

    const timer = document.createElement("figure");
    timer.classList.add("timer");

    const timerIcon = document.createElement("figure");
    timerIcon.classList.add("material-symbols-outlined");
    timerIcon.textContent = "schedule";

    const timerText = document.createTextNode(`${this.remaining}s`);
    timer.appendChild(timerIcon);
    timer.appendChild(timerText);

    header.appendChild(teamLabel);
    header.appendChild(timer);

    const questionWrapper = document.createElement("article");
    questionWrapper.classList.add("question-wrapper");

    const questionElement = document.createElement("p");
    questionElement.classList.add("question");

    if (this.isClueRevealed) {
      questionElement.textContent = this.question;
    } else {
      questionElement.innerHTML = "";
      const promptText = document.createElement("div");
      promptText.classList.add("prompt-text");
      promptText.textContent =
        "Press the eye button to reveal question and start timer";
      questionElement.appendChild(promptText);
    }

    const eyeButton = document.createElement("button");
    eyeButton.classList.add("eye-button");

    const eyeIcon = document.createElement("figure");
    eyeIcon.classList.add("material-symbols-outlined");
    eyeIcon.textContent = "visibility";
    eyeButton.appendChild(eyeIcon);

    eyeButton.title = "Reveal Question & Start Timer";
    eyeButton.disabled = this.isClueRevealed;

    if (!this.isClueRevealed) {
      eyeButton.addEventListener("click", () => this.revealQuestion());
    }

    questionWrapper.appendChild(questionElement);
    questionWrapper.appendChild(eyeButton);

    const progressBar = document.createElement("section");
    progressBar.classList.add("progress-bar");

    const progressFill = document.createElement("section");
    progressFill.classList.add("progress-fill");

    progressBar.appendChild(progressFill);

    container.appendChild(header);
    container.appendChild(questionWrapper);
    container.appendChild(progressBar);

    while (this.shadowRoot.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.interval = setInterval(() => {
        this.remaining--;

        if (this.remaining <= 0) {
          this.stop();
          this.dispatchEvent(
            new CustomEvent("timeout", { bubbles: true, composed: true })
          );
        }

        this.render();
      }, 1000);
    }
    return this;
  }

  stop() {
    if (this.isRunning) {
      clearInterval(this.interval);
      this.isRunning = false;
    }
    return this;
  }

  reset() {
    this.stop();
    this.remaining = this.seconds;
    this.isClueRevealed = false;
    this.render();
    return this;
  }

  static create(container, options = {}) {
    const timerElement = document.createElement("countdown-timer");

    if (options.seconds) timerElement.setAttribute("seconds", options.seconds);
    if (options.team) timerElement.setAttribute("team", options.team);
    if (options.questionId)
      timerElement.setAttribute("question-id", options.questionId);

    if (typeof container === "string") {
      container = document.querySelector(container);
    }

    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(timerElement);
    }

    return timerElement;
  }
}

customElements.define("countdown-timer", CountdownTimer);
