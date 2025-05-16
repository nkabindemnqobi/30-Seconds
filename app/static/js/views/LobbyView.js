import AbstractView from "./AbstractView.js";
import "../../components/Lobby.js";
import "../../components/Lobby.component.js";



export default class JoinLobby extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("JoinLobby");
    }
   
    async getHtml() {
        return `
        <app-lobby></app-lobby>
        `;
    }
}