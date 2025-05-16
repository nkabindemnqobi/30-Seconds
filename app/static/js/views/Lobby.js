import AbstractView from "./AbstractView.js";
import  "../../components/Lobby.component.js";

export default class Lobby extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("Lobby");
  }

  async getHtml() {
    return `
      <p>Hello world</p>
      <app-lobby></app-lobby>
    `;
  }
}