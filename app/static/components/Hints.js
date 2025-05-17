import LobbyService from "../../services/lobbies.service.js";

export default class HintBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.hints = Array.from({ length: 3 });
    this.lobbiesService = new LobbyService();
  }

  connectedCallback() {
    this.render();
  }

  async fetchHint() {
    const hint = await this.lobbiesService.getHint(
      sessionStorage.getItem("joinCode")
    );
    return hint.hint;
  }

  render() {
    const shadow = this.shadowRoot;

    const style = document.createElement("style");
    style.textContent = `
      .hints-container {
        background-color: #FFFBEB;
        border-radius: 12px;
        padding: 15px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        margin: 15px 0;
      }

      .hints-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .hints-title {
        font-weight: bold;
        color: #825500;
        margin: 0;
      }

      .hints-value {
        background-color: #F9E8B0;
        color: #825500;
        font-weight: bold;
        padding: 4px 10px;
        border-radius: 15px;
        font-size: 0.9em;
      }

      .hint-row {
        display: flex;
        align-items: center;
        margin: 12px 0;
      }

      .material-symbols-outlined {
        color: #F5B800;
        margin-right: 12px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: #FFEFB3;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: opacity 0.2s, background-color 0.2s;
        font-family: 'Material Symbols Outlined';
      }

      .material-symbols-outlined:hover {
        background-color: #FFE280;
      }

      .hint-reveal {
        background: none;
        border: none;
        cursor: pointer;
        color: #D98C00;
        font-weight: bold;
        padding: 0;
        font-size: 1em;
        margin-right: 10px;
      }

      .hint-reveal:hover {
        text-decoration: underline;
      }

      .hint-text {
        color: #825500;
        display: none;
      }
    `;

    shadow.appendChild(style);

    const container = document.createElement("article");
    container.classList.add("hints-container");

    const header = document.createElement("header");
    header.classList.add("hints-header");

    const title = document.createElement("h3");
    title.classList.add("hints-title");
    title.textContent = "Hints:";

    const value = document.createElement("section");
    value.classList.add("hints-value");
    value.textContent = "Value: 10 points";

    header.appendChild(title);
    header.appendChild(value);
    container.appendChild(header);

    for (let i = 0; i < this.hints.length; i++) {
      const hintRow = document.createElement("section");
      hintRow.classList.add("hint-row");

      const icon = document.createElement("figure");
      icon.classList.add("material-symbols-outlined");
      icon.textContent = "help";

      const button = document.createElement("button");
      button.classList.add("hint-reveal");
      button.textContent = "Reveal hint";

      const reveal = async () => {
        const hint = await this.fetchHint(i);
        this.hints[i] = hint;

        const hintText = document.createElement("p");
        hintText.classList.add("hint-text");
        hintText.textContent = hint;
        hintText.style.display = "block";

        hintRow.replaceChild(hintText, button);

        icon.style.opacity = "0.7";
        icon.style.cursor = "default";
      };

      icon.addEventListener("click", reveal);
      button.addEventListener("click", reveal);

      hintRow.appendChild(icon);
      hintRow.appendChild(button);

      container.appendChild(hintRow);
    }

    shadow.appendChild(container);
  }
}

customElements.define("hint-box", HintBox);
