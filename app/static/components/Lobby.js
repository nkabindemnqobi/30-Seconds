import "./lobby.component.js";
import "./Button.js";

export default class LobbyView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const shadow = this.shadowRoot;
    while (this.shadowRoot.firstChild) {
  this.shadowRoot.removeChild(this.shadowRoot.firstChild);
}

    // --- STYLES ---
    const style = document.createElement("style");
    style.textContent = `
      @import url("/static/css/index.css");
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

      :host {
        display: block;
        font-family: 'Poppins', sans-serif;
      }

      .card-content {
        padding: 2rem;
      }

    `;
    shadow.appendChild(style);

    const section = document.createElement("section");
    section.classList.add("card");

    const header = document.createElement("header");
    header.classList.add("card-header");

    const title = document.createElement("h1");
    title.classList.add("card-title");
    title.textContent = "Lobby";

    const description = document.createElement("p");
    description.classList.add("card-description");
    description.textContent = "Waiting for teams to join and get ready";

    header.appendChild(title);
    header.appendChild(description);

    const main = document.createElement("main");
    main.classList.add("card-content");

    const triviaLobby = document.createElement("trivia-lobby");
    const startButton = document.createElement("app-button");
    startButton.id = "start-game-button";
    startButton.classList.add("gradient");
    startButton.setAttribute("leftIcon", "play_circle");
    startButton.textContent = "Start game";

    main.appendChild(triviaLobby);
    main.appendChild(startButton);

    section.appendChild(header);
    section.appendChild(main);
    shadow.appendChild(section);
  }
}

customElements.define("lobby-view", LobbyView);
