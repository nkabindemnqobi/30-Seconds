class CardHeader extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const wrapper = document.createElement('header');
        wrapper.innerHTML = `
          <style>
            header {
                background: linear-gradient(to right, #a855f7, #ec4899);
                color: white;
                padding: 1.5rem;
                border-top-left-radius: 0.5rem;
                border-top-right-radius: 0.5rem;
                text-align: center;
            }
          </style>
        `;

        this.shadowRoot.appendChild(wrapper);
      }

      connectedCallback() {
        this.shadowRoot.getElementById('back-button')
          .addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('back', { bubbles: true, composed: true }));
          });

        this.shadowRoot.getElementById('signOut-button')
          .addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('signout', { bubbles: true, composed: true }));
          });
      }
    }

    customElements.define('card-header', CardHeader);