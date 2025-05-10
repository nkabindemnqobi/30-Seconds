import importStylesheet from "../utils/import-style-sheet.js";

export default class TextInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.label = this.getAttribute("label") || "";
    this.placeholder = this.getAttribute("placeholder") || "";
    this.value = this.getAttribute("value") || "";

    this.render();
    this.setupListeners();
  }

  render() {
    importStylesheet(this.shadowRoot, "/static/css/text-input.css");

    const labelEl = document.createElement("label");

    if (this.label) {
      const span = document.createElement("span");
      span.textContent = this.label;
      labelEl.appendChild(span);
    }

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = this.placeholder;
    input.value = this.value;

    labelEl.appendChild(input);
    this.shadowRoot.appendChild(labelEl);
  }

  setupListeners() {
    const input = this.shadowRoot.querySelector("input");

    input.addEventListener("input", () => {
      this.value = input.value;

      this.dispatchEvent(
        new CustomEvent("change", {
          bubbles: true,
          composed: true,
          detail: this.value,
        })
      );
    });
  }

  get inputValue() {
    return this.value;
  }

  set inputValue(val) {
    this.value = val;
    const input = this.shadowRoot.querySelector("input");
    if (input) input.value = val;
  }
}

customElements.define("text-input", TextInput);
