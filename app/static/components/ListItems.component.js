import importStylesheet from "../utils/import-style-sheet.js";

export default class Chip extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.labelText = this.getAttribute("label");

    this.render();
    this.setupListener();
  }

  render() {
    importStylesheet(this.shadowRoot, "/static/css/lists.css");
    const ul = document.createElement("ul");
    const li = document.createElement("li");
    li.textContent = this.labelText;

    if (this.hasAttribute("selected")) {
      li.classList.add("selected");
      li.setAttribute("aria-checked", "true");
    }

    ul.appendChild(li);

    this.shadowRoot.appendChild(ul);
  }

  setupListener() {
    const li = this.shadowRoot.querySelector("li");
    li.addEventListener("click", () => {
      const selected = li.classList.toggle("selected");
      li.setAttribute("aria-checked", selected.toString());

      const event = new CustomEvent("change", {
        bubbles: true,
        composed: true,
        detail: {
          label: this.labelText,
        },
      });
      this.dispatchEvent(event);
    });
  }
}

customElements.define("app-list", Chip);
