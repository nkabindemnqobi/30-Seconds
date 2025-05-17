export default class HintBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.revealedHints = new Set();
    this.hintsEnabled = false;
    this.roundId = null;
    this.isMyTurn = false;
    this.service = null;
  }
  static get observedAttributes() {
    return ["round-id"];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "round-id") {
      this.roundId = parseInt(newValue, 10);
    }
  }
  connectedCallback() {
    this.render();
    this.listenToBus();
  }
  setService(service) {
    this.service = service;
  }
  setTurnStatus(isMyTurn) {
    this.isMyTurn = isMyTurn;
    this.hintsEnabled = isMyTurn;
    this.updateHintStates();
  }
  listenToBus() {
    EventBus.on("hint_broadcast", (e) => {
      const { item, roundId } = e.detail;
      if (roundId === this.roundId) {
        this.showHint(this.nextHintIndex(), item);
      }
    });
  }
  nextHintIndex() {
    for (let i = 0; i < 3; i++) {
      if (!this.revealedHints.has(i)) return i;
    }
    return -1;
  }
  async revealHint(index) {
    if (!this.hintsEnabled || this.revealedHints.has(index)) return;
    const hintRow = this.shadowRoot.querySelector(`.hint-row-${index}`);
    const button = hintRow.querySelector(".hint-reveal");
    const icon = hintRow.querySelector(".material-symbols-outlined");
    const hintText = hintRow.querySelector(".hint-text");
    icon.style.opacity = "0.7";
    icon.style.cursor = "default";
    button.disabled = true;
    hintText.textContent = "Loading...";
    hintText.style.display = "block";
    try {
      const response = await this.service.requestHint(this.roundId);
      if (!response.success || !response.item) {
        hintText.textContent = "No more hints available.";
        return;
      }
      EventBus.emit("hint_broadcast", {
        item: response.item,
        roundId: this.roundId,
      });
    } catch (err) {
      hintText.textContent = "Failed to load hint.";
      icon.style.opacity = "1";
      button.disabled = false;
    }
  }
  showHint(index, text) {
    if (index < 0 || this.revealedHints.has(index)) return;
    const hintRow = this.shadowRoot.querySelector(`.hint-row-${index}`);
    const hintText = hintRow.querySelector(".hint-text");
    const button = hintRow.querySelector(".hint-reveal");
    hintText.textContent = text;
    hintText.style.display = "block";
    if (button) button.disabled = true;
    this.revealedHints.add(index);
    this.updateHintStates();
  }
  updateHintStates() {
    for (let i = 0; i < 3; i++) {
      const row = this.shadowRoot.querySelector(`.hint-row-${i}`);
      const icon = row.querySelector(".material-symbols-outlined");
      const button = row.querySelector(".hint-reveal");
      const revealed = this.revealedHints.has(i);
      if (revealed) {
        icon.style.opacity = "0.7";
        icon.style.cursor = "default";
        if (button) button.disabled = true;
      } else {
        icon.style.opacity = this.hintsEnabled ? "1" : "0.5";
        icon.style.cursor = this.hintsEnabled ? "pointer" : "default";
        if (button) {
          button.disabled = !this.hintsEnabled;
          button.style.cursor = this.hintsEnabled ? "pointer" : "default";
        }
      }
    }
  }
  render() {
    const root = this.shadowRoot;
    root.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = `
      .hints-container {
        background-color: #FFFBEB;
        border-radius: 12px;
        padding: 15px;
        font-family: system-ui;
      }
      .hint-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 10px 0;
      }
      .material-symbols-outlined {
        font-family: 'Material Symbols Outlined';
        background: #FFEFB3;
        border-radius: 50%;
        padding: 5px;
        font-size: 16px;
        opacity: 0.5;
        cursor: default;
      }
      .hint-reveal {
        background: none;
        border: none;
        color: #D98C00;
        font-weight: bold;
        cursor: pointer;
      }
      .hint-text {
        color: #825500;
        display: none;
      }
    `;
    root.appendChild(style);
    const container = document.createElement("div");
    container.className = "hints-container";
    for (let i = 0; i < 3; i++) {
      const row = document.createElement("div");
      row.className = `hint-row hint-row-${i}`;
      const icon = document.createElement("span");
      icon.className = "material-symbols-outlined";
      icon.textContent = "visibility";
      icon.title = "Reveal hint";
      row.appendChild(icon);
      icon.addEventListener("click", () => this.revealHint(i));
      const button = document.createElement("button");
      button.className = "hint-reveal";
      button.textContent = "Reveal hint";
      button.disabled = true;
      button.addEventListener("click", () => this.revealHint(i));
      row.appendChild(button);
      const hintText = document.createElement("p");
      hintText.className = "hint-text";
      row.appendChild(hintText);
      container.appendChild(row);
    }
    root.appendChild(container);
  }
}
customElements.define("hint-box", HintBox);