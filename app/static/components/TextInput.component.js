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
    this.required = this.hasAttribute("required");
    this.id = this.getAttribute("id") || "";

    this.render();
    this.setupListeners();
  }

  render() {
    // Clear existing content
    this.shadowRoot.innerHTML = "";

    // Add styling
    const style = document.createElement("style");
    style.textContent = `
      .wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      label {
        font-size: 0.875rem; /* roughly Tailwind's text-sm */
        font-weight: 500;
        color: #6B21A8; /* purple-800 */
      }

      input {
        padding: 0.5rem 0.75rem;
        border: 1px solid #D8B4FE; /* purple-300 */
        border-radius: 0.375rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      input:focus {
        border-color: #A855F7; /* purple-500 */
        box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.4);
      }
    `;

    const wrapper = document.createElement("section");
    wrapper.className = "wrapper";

    const labelEl = document.createElement("label");
    labelEl.setAttribute("for", this.id);
    labelEl.textContent = this.label;

    const input = document.createElement("input");
    input.type = "text";
    input.id = this.id;
    input.placeholder = this.placeholder;
    input.value = this.value;
    input.required = this.required;

    wrapper.appendChild(labelEl);
    wrapper.appendChild(input);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(wrapper);
  }

  setupListeners() {
    const input = this.shadowRoot.querySelector("input");

    input.addEventListener("change", () => {
      this.value = input.value;

      this.dispatchEvent(
        new CustomEvent("updated", {
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
