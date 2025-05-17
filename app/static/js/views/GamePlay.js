import "../../components/Button.js";
import "../../components/GamePlay.component.js";
import GameController from "../../../services/gameplay.service.js";

export default class GamePlay {
    constructor(params) {
        this.params = params;
        this.gameController = null;
        document.title = "30 Seconds - Game Play";
    }
   
    async getHtml() {
        return `
        <game-play></game-play>
        `;
    }
}
