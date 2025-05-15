import importStylesheet from "../utils/import-style-sheet.js";

export default class Chip extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.text = this.getAttribute("text") || "";
    this.customClass = this.getAttribute("class") || "";
    this.render();
  }

  render() {
    importStylesheet(this.shadowRoot, "/static/css/button.css");

    const container = document.createElement("div");
    container.setAttribute("class", `chip ${this.customClass}`.trim());

    const textEl = document.createElement("span");
    textEl.textContent = this.text;
    container.appendChild(textEl);

    this.shadowRoot.appendChild(container);
  }
}

customElements.define("app-chip", Chip);
