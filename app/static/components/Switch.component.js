export default class Switch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.checked = this.hasAttribute("checked");
  }

  connectedCallback() {
    this.labelText = this.getAttribute("label") || "Toggle";
    this.descriptionText = this.getAttribute("description") || "";
    this.render();
    this.setupListeners();
  }

  render() {
    const style = document.createElement("style");
    style.textContent = `
    .switch{
    display: flex;
    }

      label {
        font-weight: 500;
        color: #4b0082; 
        margin-right: 8px;
      }

      .description {
        font-size: 12px;
        color: #7e22ce;
      }

      .toggle {
        align-self: center;
        justify-self: end;
        position: relative;
        width: 50px;
        height: 24px;
        background-color: #ccc;
        border-radius: 12px;
        cursor: pointer;
        transition: background-color 0.3s;
        margin:0;
      }

      .toggle::after {
        content: "";
        position: absolute;
        left: 2px;
        top: 2px;
        width: 20px;
        height: 20px;
        background-color: white;
        border-radius: 50%;
        transition: left 0.3s;
        margin:0;
      }

      .toggle[aria-checked="true"] {
        background-color: var(--primary-color, #4caf50);
      }

      .toggle[aria-checked="true"]::after {
        left: 28px;
      }
      label {
        cursor: pointer;
      }
    `;

    const id = `toggle-${crypto.randomUUID()}`;
    this.shadowRoot.innerHTML = `
      <section class="switch">

        <label for="${id}">${this.labelText}</label>
          <figure id="${id}" class="toggle" role="switch" aria-checked="${this.checked}" tabindex="0"></figure>
          </section>
           ${this.descriptionText ? `<p class="description">${this.descriptionText}</p>` : ""}
      
    `;
    this.shadowRoot.appendChild(style);
  }

  setupListeners() {
    const toggle = this.shadowRoot.querySelector(".toggle");

    const toggleState = () => {
      this.checked = !this.checked;
      toggle.setAttribute("aria-checked", this.checked.toString());

      this.dispatchEvent(
        new CustomEvent("change", {
          bubbles: true,
          composed: true,
          detail: this.checked,
        })
      );
    };

    toggle.addEventListener("click", toggleState);
    toggle.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggleState();
      }
    });
  }

  isChecked() {
    return this.checked;
  }
}

customElements.define("app-switch", Switch);
