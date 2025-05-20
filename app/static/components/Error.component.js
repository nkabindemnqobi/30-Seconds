export default class ErrorMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const message = this.getAttribute("message") || "An unexpected error occurred.";
    const showRetry = this.hasAttribute("retry");

    const style = document.createElement("style");
    const errorArticle = document.createElement("article"); 
    errorArticle.classList.add("error-container");

    const iconFigure = document.createElement("figure"); 
    iconFigure.classList.add("error-icon");
    const iconSpan = document.createElement("span");
    iconSpan.classList.add("material-symbols-outlined");
    iconSpan.textContent = "error";
    iconFigure.appendChild(iconSpan);

    const messageHeading = document.createElement("h2"); 
    messageHeading.classList.add("error-message");
    messageHeading.textContent = message;

    const descriptionParagraph = document.createElement("p");
    descriptionParagraph.classList.add("error-description");
    descriptionParagraph.textContent = "Please try again or contact support if the problem persists.";

    errorArticle.appendChild(iconFigure);
    errorArticle.appendChild(messageHeading);
    errorArticle.appendChild(descriptionParagraph);

    let retryButton;
    if (showRetry) {
      retryButton = document.createElement("button");
      retryButton.id = "retryBtn";
      const refreshIcon = document.createElement("span");
      refreshIcon.classList.add("material-symbols-outlined");
      refreshIcon.style.fontSize = "18px";
      refreshIcon.textContent = "refresh";
      retryButton.appendChild(refreshIcon);
      retryButton.appendChild(document.createTextNode(" Retry"));
      errorArticle.appendChild(retryButton);

      retryButton.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("retry", { bubbles: true, composed: true })
        );
      });
    }

    style.textContent = `
      @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined");

      .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1.5rem;
        text-align: center;
        color: #b91c1c;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .error-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 60px;
        height: 60px;
        margin-bottom: 1rem;
        border-radius: 50%;
        background-color: #fee2e2;
      }

      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48;
        font-size: 32px;
        color: #dc2626;
      }

      .error-message {
        margin: 0.5rem 0 1rem;
        font-size: 1.125rem;
        font-weight: 500;
      }

      .error-description {
        margin: 0 0 1rem;
        font-size: 0.875rem;
        color: #4b5563;
        max-width: 400px;
      }

      button {
        margin-top: 0.5rem;
        background-color: #ef4444;
        color: white;
        border: none;
        padding: 0.5rem 1.25rem;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
      }

      button:hover {
        background-color: #dc2626;
        transform: translateY(-1px);
      }

      button:active {
        transform: translateY(1px);
      }
    `;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(errorArticle);
  }

  static show(container, message, showRetry = false) {
    const errorElement = document.createElement('error-message');
    errorElement.setAttribute('message', message);
    if (showRetry) errorElement.setAttribute('retry', '');

    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(errorElement);
    }

    return errorElement;
  }
}

customElements.define("error-message", ErrorMessage);