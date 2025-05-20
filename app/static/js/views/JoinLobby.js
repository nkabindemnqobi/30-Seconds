import AbstractView from "./AbstractView.js";
import "../../components/Button.js";
import "../../components/TextInput.component.js";
import "../../components/JoinLobby.js";
import "../../components/JoinLobby.js";
export default class JoinLobby extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("JoinLobby");
  }

  async getHtml() {
    return `
            <join-with-code></join-with-code>
        `;
  }
}
