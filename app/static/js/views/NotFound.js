import AbstractView from "./AbstractView.js";

export default class NotFound extends AbstractView {
  constructor() {
    super();
    this.setTitle("Page Not Found");
  }

  async getHtml() {
    return `
      <section class="card">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/" data-link>Go back home</a>
      </section>
    `;
  }
}
