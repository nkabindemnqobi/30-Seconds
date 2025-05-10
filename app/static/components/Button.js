/*
example usage:
  <app-button leftIcon="replay" id="yourId"class="primary">Button with icon example</app-button>
  <app-button  id="yourId" class="primary">Primary color button</app-button>
  <app-button  id="yourId" class="secondary">Secondary color button</app-button>

*/
import importStylesheet from "../utils/import-style-sheet.js";
export default class Button extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.type = this.getAttribute("type") || "button";
    this.leftIcon = this.getAttribute("leftIcon");
    this.customClass = this.getAttribute("class") || "";
    this.render();
  }

  render() {
    importStylesheet(this.shadowRoot, "/static/css/button.css");
    importStylesheet(
      this.shadowRoot,
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
    );
    const button = document.createElement("button");
    button.type = this.type;
    button.setAttribute("class", this.customClass);

    if (this.leftIcon) {
      const iconElement = document.createElement("i");
      iconElement.classList.add("material-symbols-outlined");
      iconElement.textContent = this.leftIcon;
      button.appendChild(iconElement);
    } else {
      //don't add icon if not added as property
    }

    const slot = document.createElement("slot");
    button.appendChild(slot);

    button.addEventListener("click", (e) => {
      this.dispatchEvent(
        new CustomEvent("click", {
          detail: { originalEvent: e },
          bubbles: true,
          composed: true,
        })
      );
    });

    this.shadowRoot.appendChild(button);
  }
}

customElements.define("app-button", Button);
