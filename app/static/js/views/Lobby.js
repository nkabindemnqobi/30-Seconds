import AbstractView from "./AbstractView.js";

export default class Lobby extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("Lobby");
  }

  async getHtml() {
    return `
           <p>Hello world</p>
        `;
  }
}
