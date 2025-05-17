import AbstractView from "./AbstractView.js";
import "../../components/Lobby.js";



export default class JoinLobby extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("JoinLobby");
    }
   
    async getHtml() {
        return `
        <lobby-view></lobby-view>
        `;
    }
}