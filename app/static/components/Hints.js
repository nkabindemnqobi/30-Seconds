import importStylesheet from "../utils/import-style-sheet.js";

export default class HintBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.hintId = parseInt(this.getAttribute("hint-id") || "0", 10);
    this.revealedHints = new Set();
    this.value = this.getAttribute("value") || "10 points";
    this.hintsEnabled = false; // Add state flag for hints enabled/disabled
  }

  static get observedAttributes() {
    return ["hint-id", "value"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === "hint-id") {
        this.hintId = parseInt(newValue, 10);
        this.render();
      } else if (name === "value") {
        this.value = newValue;
        this.render();
      }
    }
  }

  connectedCallback() {
    this.render();
  }

  async fetchHint(hintId) {
    // Don't fetch hint if hints are disabled
    if (!this.hintsEnabled) return;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = {
          0: "It's the most populous metropolitan area in the world.",
          1: "It hosted the 2020 Summer Olympics.",
          2: "It starts with the letter 'T'."
        };
        resolve(responses[hintId] || "No hint found.");
      }, 100);
    });
  }

  async revealHint(hintId) {
    // Don't reveal hint if hints are disabled
    if (!this.hintsEnabled) return;
    
    if (this.revealedHints.has(hintId)) {
      return;
    }
    
    const hintRow = this.shadowRoot.querySelector(`.hint-row-${hintId}`);
    const icon = hintRow.querySelector(".material-symbols-outlined");
    const button = hintRow.querySelector(".hint-reveal");
    const hintText = hintRow.querySelector(".hint-text");
    
    icon.style.cursor = "default";
    icon.style.opacity = "0.7";
    button.disabled = true;
    
    const loadingText = document.createElement("p");
    loadingText.textContent = "Loading...";
    loadingText.style.color = "#825500";
    loadingText.style.fontStyle = "italic";
    
    button.style.display = "none";
    hintRow.insertBefore(loadingText, hintText);
    
    try {
      // Fetch the actual hint
      const hint = await this.fetchHint(hintId);
      
      hintRow.removeChild(loadingText);
      hintText.textContent = hint;
      hintText.style.display = "block";

      this.revealedHints.add(hintId);
    } catch (err) {
      // Handle error
      hintRow.removeChild(loadingText);
      icon.style.cursor = "pointer";
      icon.style.opacity = "1";
      button.style.display = "inline";
      button.disabled = false;
      hintText.textContent = "Failed to load hint.";
      hintText.style.display = "block";
    }
  }

  // Add methods to enable and disable hints
  enableHints() {
    this.hintsEnabled = true;
    
    const hintButtons = this.shadowRoot.querySelectorAll('.hint-reveal');
    hintButtons.forEach(btn => {
      if (!btn.disabled) { // Only enable if it's not already disabled due to being revealed
        btn.disabled = false;
        btn.style.cursor = 'pointer';
      }
    });
    
    const hintIcons = this.shadowRoot.querySelectorAll('.material-symbols-outlined');
    hintIcons.forEach(icon => {
      // Only enable icons for hints that haven't been revealed yet
      const hintRow = icon.closest('.hint-row');
      const hintId = parseInt(hintRow.className.split('-').pop(), 10);
      if (!this.revealedHints.has(hintId)) {
        icon.style.opacity = '1';
        icon.style.cursor = 'pointer';
      }
    });
    
    this.render(); // Re-render to apply changes
  }
  
  disableHints() {
    this.hintsEnabled = false;
    
    const hintButtons = this.shadowRoot.querySelectorAll('.hint-reveal');
    hintButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.cursor = 'default';
    });
    
    const hintIcons = this.shadowRoot.querySelectorAll('.material-symbols-outlined');
    hintIcons.forEach(icon => {
      // Disable all icons when hints are disabled
      icon.style.opacity = '0.5';
      icon.style.cursor = 'default';
    });
  }

  render() {
    while (this.shadowRoot.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }

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
      
      .material-symbols-outlined {font-family: 'Material Symbols Outlined';

    `;
    this.shadowRoot.appendChild(style);
    
    const container = document.createElement("article");
    container.classList.add("hints-container");
    
    const header = document.createElement("header");
    header.classList.add("hints-header");
    
    const title = document.createElement("h3");
    title.classList.add("hints-title");
    title.textContent = "Hints:";
    header.appendChild(title);
    
    const valueElement = document.createElement("section");
    valueElement.classList.add("hints-value");
    valueElement.textContent = `Value: ${this.value}`;
    header.appendChild(valueElement);
    
    container.appendChild(header);
    
    for (let i = 0; i < 3; i++) {
      const hintRow = document.createElement("section");
      hintRow.classList.add("hint-row", `hint-row-${i}`);
      
      const icon = document.createElement("figure");
      icon.classList.add("material-symbols-outlined");
      icon.textContent = "help";
      icon.title = "Reveal hint";
      
      // Set default states based on hintsEnabled flag and revealed status
      if (this.revealedHints.has(i)) {
        icon.style.opacity = "0.7";
        icon.style.cursor = "default";
        
        const hintText = document.createElement("p");
        hintText.classList.add("hint-text");
        hintText.style.display = "block"; 
        
        const responses = {
          0: "It's the most populous metropolitan area in the world.",
          1: "It hosted the 2020 Summer Olympics.",
          2: "It starts with the letter 'T'."
        };
        hintText.textContent = responses[i] || "No hint found.";
        
        hintRow.appendChild(icon);
        hintRow.appendChild(hintText);
      } else {
        // Apply the correct state based on hintsEnabled
        if (this.hintsEnabled) {
          icon.style.opacity = "1";
          icon.style.cursor = "pointer";
        } else {
          icon.style.opacity = "0.5";
          icon.style.cursor = "default";
        }
        
        icon.addEventListener("click", () => {
          if (this.hintsEnabled) {
            this.revealHint(i);
          }
        });
        
        const button = document.createElement("button");
        button.classList.add("hint-reveal");
        button.textContent = "Reveal hint";
        button.disabled = !this.hintsEnabled;
        button.style.cursor = this.hintsEnabled ? "pointer" : "default";
        
        button.addEventListener("click", () => {
          if (this.hintsEnabled) {
            this.revealHint(i);
          }
        });
        
        const hintText = document.createElement("p");
        hintText.classList.add("hint-text");
        
        hintRow.appendChild(icon);
        hintRow.appendChild(button);
        hintRow.appendChild(hintText);
      }
      
      container.appendChild(hintRow);
    }
    
    this.shadowRoot.appendChild(container);
  }

  static create(container, options = {}) {
    const hintBoxElement = document.createElement("hint-box");
    
    if (options.hintId) hintBoxElement.setAttribute("hint-id", options.hintId);
    if (options.value) hintBoxElement.setAttribute("value", options.value);
    
    if (typeof container === "string") {
      container = document.querySelector(container);
    }

    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(hintBoxElement);
    }

    return hintBoxElement;
  }
}

customElements.define("hint-box", HintBox);