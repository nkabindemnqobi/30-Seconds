const template = document.createElement('template');
template.innerHTML = `
  <style>
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border-left-color: #007bff; /* Your primary color */
      animation: spin 1s linear infinite;
      margin: 10px auto; /* Center the spinner */
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  </style>
  <div class="spinner"></div>
`;

class Spinner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('loading-spinner', Spinner);