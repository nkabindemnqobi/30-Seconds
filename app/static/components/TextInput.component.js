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
    this.maxlength = this.getAttribute("maxlength");
    this.minLength = this.getAttribute("minLength");

    this.error = "";
    this.render();
    this.setupListeners();
  }

  render() {
    this.shadowRoot.innerHTML = "";

    const style = document.createElement("style");
    style.textContent = `
      .wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #6B21A8;
      }

      input {
        padding: 0.5rem 0.75rem;
        border: 1px solid #D8B4FE;
        border-radius: 0.375rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      input:focus {
        border-color: #A855F7;
        box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.4);
      }

      small {
        color: #DC2626;
        font-size: 0.75rem;
      }
    `;

    const wrapper = document.createElement("section");
    wrapper.className = "wrapper";

    if (this.label) {
      const labelEl = document.createElement("label");
      labelEl.setAttribute("for", this.id);
      labelEl.textContent = this.label;
      wrapper.appendChild(labelEl);
    }

    const input = document.createElement("input");
    input.type = "text";
    input.id = this.id;
    input.placeholder = this.placeholder;
    input.value = this.value;
    input.required = this.required;
    if (this.maxlength) input.maxLength = parseInt(this.maxlength, 10);

    input.addEventListener("change", (e) => {
      this.value = e.target.value;
      this.validateInput();
      this.render();
      this.dispatchEvent(new CustomEvent("updated", {
        bubbles: true,
        composed: true,
        detail: this.value,
      }));
    });

    wrapper.appendChild(input);

    if (this.error) {
      const errorEl = document.createElement("small");
      errorEl.textContent = this.error;
      wrapper.appendChild(errorEl);
    }

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(wrapper);
  }

  validateInput() {
    this.error = "";
    const trimmed = this.value.trim();

    if (this.required && trimmed === "") {
      this.error = "This field is required.";
    } else if (this.minLength && trimmed.length < parseInt(this.minLength, 10)) {
      this.error = `Minimum length is ${this.minLength} characters.`;
    } else if (this.maxlength && trimmed.length > parseInt(this.maxlength, 10)) {
      this.error = `Maximum length is ${this.maxlength} characters.`;
    }
  }

  setupListeners() {
    // no-op here, because input events are now fully handled inside render
  }

  get inputValue() {
    return this.value;
  }

  set inputValue(val) {
    this.value = val;
    this.validateInput();
    this.render();
  }
}

customElements.define("text-input", TextInput);
